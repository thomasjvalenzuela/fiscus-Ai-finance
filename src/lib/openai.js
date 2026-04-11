import { CATEGORIES } from './categories.js'
import { extractKeyword } from './transferDetect.js'

/**
 * When VITE_PROXY_URL is set (e.g. "/.netlify/functions/openai-proxy"),
 * all requests are routed through the server-side proxy and the API key
 * is never sent from the browser.  Fall back to the direct OpenAI endpoint
 * when no proxy is configured (local dev with a user-supplied key).
 */
const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? null
const OPENAI_ENDPOINT = PROXY_URL ?? 'https://api.openai.com/v1/chat/completions'

function buildHeaders(apiKey) {
  const h = { 'Content-Type': 'application/json' }
  if (!PROXY_URL && apiKey) h.Authorization = `Bearer ${apiKey}`
  return h
}

const BATCH_SIZE = 25
const GROUP_BATCH_SIZE = 30 // keyword groups per API call (more efficient)

const RULES_PROMPT = `Rules:
- CC payments / ONLINE PAYMENT THANK YOU / APPLECARD GSBANK PAYMENT / CAPITAL ONE / ONLINE TRANSFER → "Transfer / Internal"
- Payroll/direct deposit/employer income → "Salary". Online marketplace deposits → "Marketplace Sales". Marketplace seller fees → "Marketplace Fees"
- Business payroll received → "Business Income"; business-related expenses → "Business Expenses"
- Rental management platform fees → "Rental Platform Fees". Zelle from a person's name → "Rental Income"
- Gas stations → "Fuel". Auto parts/repair/insurance → "Auto". Grocery stores → "Groceries"
- Restaurants/delivery/takeout → "Dining & Takeout". Convenience/vending → "Convenience & Snacks"
- Google Workspace/Hostinger/GoDaddy/Squarespace/Envato/dev tools → "Software & Tools"
- Apple.com/Netflix/Spotify/Hulu/Disney/streaming → "Subscriptions"
- Bank interest/fees → "Fees & Interest". ATM → "Cash & ATM"
- Medical/dental/pharmacy → "Medical". Movies/games → "Entertainment"
- Retail/Amazon → "Shopping". Housing rent → "Rent / Housing"
- Uber/Lyft/bus/parking → "Transit & Parking". Internet/phone/electric/water → "Internet & Utilities"
- Rental mortgage → "Rental Mortgage". Rental repairs → "Rental Repairs & Maintenance"
- Cashback/rewards → "Cashback & Rewards". Merchant refunds → "Refunds & Returns"`

function buildPrompt(transactions) {
  const list = transactions.map((t, i) =>
    `${i + 1}. [${t.type}] $${t.amount.toFixed(2)} | "${t.description}" | From:${t.source_name} To:${t.destination_name}`
  ).join('\n')

  return `Categorize these bank transactions. For each output:
"index" (1-based), "category" (exact from list), "confidence" (high/medium/low), "keyword" (shortest stable match text).

Categories: ${CATEGORIES.join(', ')}

${RULES_PROMPT}

Transactions:
${list}

JSON array only, no markdown fences: [{"index":1,"category":"Shopping","confidence":"high","keyword":"AMAZON MKTPL"}]`
}

// Build prompt for keyword-group-based categorization (much more efficient)
function buildGroupPrompt(groups) {
  const list = groups.map((g, i) => {
    const rep = g.representative
    return `${i + 1}. [${rep.type || 'expense'}] $${Math.abs(rep.amount || 0).toFixed(2)} avg | keyword:"${g.keyword}" | ${g.count} transaction${g.count > 1 ? 's' : ''}`
  }).join('\n')

  return `Categorize these merchant keywords. Each represents multiple bank transactions grouped by keyword.
Output "index" (1-based), "category" (exact from list), "confidence" (high/medium/low).

Categories: ${CATEGORIES.join(', ')}

${RULES_PROMPT}

Merchant keywords to categorize (most frequent first):
${list}

JSON array only, no markdown fences: [{"index":1,"category":"Shopping","confidence":"high"}]`
}

export async function categorizeBatch(transactions, apiKey, model = 'gpt-4o-mini', signal) {
  const resp = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    signal,
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [{ role: 'user', content: buildPrompt(transactions) }],
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI ${resp.status}`)
  }

  const data = await resp.json()
  const text = data.choices?.[0]?.message?.content || '[]'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

export async function categorizeAll(transactions, apiKey, model, onProgress, signal) {
  const uncategorized = transactions.filter(t => !t.isTransfer && !t.category)
  const batches = []
  for (let i = 0; i < uncategorized.length; i += BATCH_SIZE) {
    batches.push(uncategorized.slice(i, i + BATCH_SIZE))
  }

  const results = {}
  for (let b = 0; b < batches.length; b++) {
    if (signal?.aborted) break
    const batch = batches[b]
    onProgress?.(b, batches.length, batch.length)
    const suggestions = await categorizeBatch(batch, apiKey, model, signal)
    for (const s of suggestions) {
      const tx = batch[s.index - 1]
      if (tx) {
        results[tx.id] = {
          category: s.category,
          confidence: s.confidence,
          keyword: s.keyword || extractKeyword(tx.description),
        }
      }
    }
  }
  return results
}

// ── Keyword-Group Categorization ─────────────────────────────────────────────

/**
 * Categorize a single batch of keyword groups via one OpenAI call.
 * groups = [{ keyword, txs, count, representative }]
 * returns [{ index, category, confidence }]
 */
async function categorizeGroupsBatch(groups, apiKey, model, signal) {
  const resp = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    signal,
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [{ role: 'user', content: buildGroupPrompt(groups) }],
    }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI ${resp.status}`)
  }
  const data = await resp.json()
  const text = data.choices?.[0]?.message?.content || '[]'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

/**
 * Categorize ALL keyword groups with ETA tracking and real-time streaming.
 * groups = [{ keyword, txs, count, representative }]  (sorted most-frequent first)
 * onProgress(batchesDone, totalBatches, batchElapsedMs)
 * onBatchComplete(partialResults)  — called after every batch with accumulated results so far
 * returns { keyword → { category, confidence } }
 */
export async function categorizeAllGroups(
  groups,
  apiKey,
  model = 'gpt-4o-mini',
  onProgress,
  onBatchComplete,
  signal,
) {
  const batches = []
  for (let i = 0; i < groups.length; i += GROUP_BATCH_SIZE) {
    batches.push(groups.slice(i, i + GROUP_BATCH_SIZE))
  }

  const results = {} // keyword → { category, confidence }
  for (let b = 0; b < batches.length; b++) {
    if (signal?.aborted) break
    const t0 = Date.now()
    const batch = batches[b]
    const suggestions = await categorizeGroupsBatch(batch, apiKey, model, signal)
    const elapsed = Date.now() - t0
    for (const s of suggestions) {
      const group = batch[s.index - 1]
      if (group) results[group.keyword] = { category: s.category, confidence: s.confidence }
    }
    onProgress?.(b + 1, batches.length, elapsed)
    // Stream partial results so ReviewPage can update in real-time and save mid-run
    onBatchComplete?.({ ...results })
  }
  return results
}

export async function chatWithAdvisor(messages, summary, debts, goals, apiKey, model, onChunk, signal) {
  const system = `You are a personal finance advisor. You have access to the user's financial data:

SPENDING SUMMARY (last 90 days):
${Object.entries(summary.byCat || {})
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`)
  .join('\n')}

Income: $${(summary.income || 0).toFixed(2)} | Expenses: $${(summary.expenses || 0).toFixed(2)} | Net: $${(summary.net || 0).toFixed(2)}
Avg monthly expenses: $${(summary.avgMonthlyExpenses || 0).toFixed(2)}

DEBTS: ${debts.length ? debts.map(d => `${d.name} $${d.balance} @ ${d.apr}% APR`).join(', ') : 'None entered'}

Be concise, specific, and actionable. Use actual numbers from the data above.`

  const resp = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    signal,
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI ${resp.status}`)
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') break
      try {
        const token = JSON.parse(data).choices?.[0]?.delta?.content
        if (token) { full += token; onChunk?.(full) }
      } catch { /* skip */ }
    }
  }
  return full
}

/**
 * Analyzes historical spending and suggests monthly budget limits per category.
 * Returns array of { category, suggested, reasoning, confidence }
 */
export async function suggestBudgets(summary, rentalProperties, apiKey, model = 'gpt-4o-mini', signal) {
  const spendingLines = Object.entries(summary.byCat || {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => {
      const monthly = summary.months?.length ? total / summary.months.length : total
      return `  ${cat}: $${total.toFixed(2)} total, ~$${monthly.toFixed(2)}/mo`
    })
    .join('\n')

  const rentalContext = rentalProperties?.length
    ? `\nRENTAL PROPERTIES (${rentalProperties.length}):\n` +
      rentalProperties.map(p => `  ${p.address}: rent $${p.monthlyRent}/mo, mortgage $${p.mortgage}/mo`).join('\n')
    : ''

  const prompt = `You are a personal finance advisor. Based on this person's actual historical spending data (${summary.months?.length || 1} months), suggest realistic monthly budget limits for each category.

HISTORICAL SPENDING:
${spendingLines}

Monthly income: ~$${(summary.avgMonthlyIncome || 0).toFixed(2)}
Monthly expenses: ~$${(summary.avgMonthlyExpenses || 0).toFixed(2)}
${rentalContext}

For each category that had any spending, suggest a monthly budget limit. Be realistic (don't suggest unrealistically low numbers), but identify areas where 10-20% reduction is achievable. For rental/business categories, base on actual costs.

Return JSON array only, no markdown:
[{"category":"Groceries","suggested":450,"reasoning":"You averaged $380/mo — $450 gives a 18% buffer","confidence":"high"}]

Include only expense categories (not income, not Transfer/Internal). Order by amount descending.`

  const resp = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    signal,
    body: JSON.stringify({ model, temperature: 0.3, messages: [{ role: 'user', content: prompt }] }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI ${resp.status}`)
  }

  const data = await resp.json()
  const text = data.choices?.[0]?.message?.content || '[]'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}
