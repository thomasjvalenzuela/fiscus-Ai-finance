import Papa from 'papaparse'
import { isTransfer } from './transferDetect.js'
import { deduplicateByHash } from './dedup.js'

export function parseFireflyCSV(text) {
  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  if (errors.length && !data.length) throw new Error(errors[0].message)

  return data.filter(row => row.journal_id).map(row => {
    const amount = parseFloat(row.amount || 0)
    const isDeposit = row.type === 'Deposit'
    const autoTransfer = isTransfer(row.description)

    return {
      id: row.journal_id,
      journal_id: row.journal_id,
      import_hash_v2: row.import_hash_v2 || '',
      date: row.date?.substring(0, 10) ?? '',
      description: row.description ?? '',
      amount: Math.abs(amount),
      type: row.type ?? '',
      isIncome: isDeposit && !autoTransfer,
      isExpense: !isDeposit && !autoTransfer,
      isTransfer: autoTransfer || row.type === 'Transfer',
      source_name: row.source_name ?? '',
      destination_name: row.destination_name ?? '',
      category: autoTransfer ? 'Transfer / Internal' : (row.category || ''),
      account: isDeposit ? row.destination_name : row.source_name,
      notes: row.notes ?? '',
      tags: row.tags ?? '',
    }
  })
}

export function mergeTransactions(existing, incoming) {
  const fresh = deduplicateByHash(incoming, existing)
  return [...existing, ...fresh]
}

export function computeSummary(transactions) {
  const real = transactions.filter(t => !t.isTransfer)
  const income = real.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0)
  const expenses = real.filter(t => t.isExpense).reduce((s, t) => s + t.amount, 0)
  const net = income - expenses

  // Monthly breakdown
  const byMonth = {}
  for (const t of real) {
    const m = t.date?.substring(0, 7)
    if (!m) continue
    if (!byMonth[m]) byMonth[m] = { month: m, income: 0, expenses: 0 }
    if (t.isIncome) byMonth[m].income += t.amount
    if (t.isExpense) byMonth[m].expenses += t.amount
  }
  const months = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
  const monthCount = months.length || 1

  // By category
  const byCat = {}
  for (const t of real.filter(t => t.isExpense)) {
    const cat = t.category || 'Skip / Uncategorized'
    byCat[cat] = (byCat[cat] || 0) + t.amount
  }

  return {
    income,
    expenses,
    net,
    avgMonthlyExpenses: expenses / monthCount,
    avgMonthlyIncome: income / monthCount,
    months,
    byCat,
    txCount: transactions.length,
  }
}
