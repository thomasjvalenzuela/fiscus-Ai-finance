/**
 * Netlify Function: openai-proxy
 *
 * Proxies requests to the OpenAI Chat Completions API so the API key
 * stays server-side and is never exposed to the browser.
 *
 * Deploy-time env var required: OPENAI_API_KEY
 *
 * POST /.netlify/functions/openai-proxy
 * Body: same shape as OpenAI /v1/chat/completions (model, messages, stream, temperature, …)
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'OPENAI_API_KEY is not configured on the server.' } }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: { message: 'Invalid JSON body.' } }) }
  }

  const upstream = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const text = await upstream.text()

  return {
    statusCode: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
    body: text,
  }
}
