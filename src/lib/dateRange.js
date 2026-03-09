/**
 * Date range utilities for period filtering and period-over-period comparison.
 * All dates are 'YYYY-MM-DD' strings to match the transaction.date format.
 */

export const PRESETS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3m',    label: 'Last 3 Months' },
  { id: 'last_6m',    label: 'Last 6 Months' },
  { id: 'ytd',        label: 'Year to Date' },
  { id: 'last_12m',   label: 'Last 12 Months' },
  { id: 'all',        label: 'All Time' },
  { id: 'custom',     label: 'Custom Range' },
]

function toStr(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function addMonths(d, n) {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

/**
 * Compute { preset, start, end, prevStart, prevEnd, label } for a given preset.
 * 'all' returns null for prevStart/prevEnd (no comparison).
 */
export function computeRange(preset, customStart, customEnd) {
  const today = new Date()
  const todayStr = toStr(today)
  let start, end, prevStart, prevEnd

  switch (preset) {
    case 'this_month': {
      start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
      end   = todayStr
      prevStart = toStr(new Date(today.getFullYear(), today.getMonth() - 1, 1))
      prevEnd   = toStr(new Date(today.getFullYear(), today.getMonth(), 0))
      break
    }
    case 'last_month': {
      start = toStr(new Date(today.getFullYear(), today.getMonth() - 1, 1))
      end   = toStr(new Date(today.getFullYear(), today.getMonth(), 0))
      prevStart = toStr(new Date(today.getFullYear(), today.getMonth() - 2, 1))
      prevEnd   = toStr(new Date(today.getFullYear(), today.getMonth() - 1, 0))
      break
    }
    case 'last_3m': {
      start     = toStr(addMonths(today, -3))
      end       = todayStr
      prevStart = toStr(addMonths(today, -6))
      prevEnd   = toStr(addDays(new Date(start), -1))
      break
    }
    case 'last_6m': {
      start     = toStr(addMonths(today, -6))
      end       = todayStr
      prevStart = toStr(addMonths(today, -12))
      prevEnd   = toStr(addDays(new Date(start), -1))
      break
    }
    case 'ytd': {
      start     = `${today.getFullYear()}-01-01`
      end       = todayStr
      prevStart = `${today.getFullYear() - 1}-01-01`
      prevEnd   = `${today.getFullYear() - 1}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      break
    }
    case 'last_12m': {
      start     = toStr(addMonths(today, -12))
      end       = todayStr
      prevStart = toStr(addMonths(today, -24))
      prevEnd   = toStr(addDays(new Date(start), -1))
      break
    }
    case 'custom': {
      start = customStart || toStr(addMonths(today, -3))
      end   = customEnd   || todayStr
      const durMs   = new Date(end) - new Date(start)
      const daysDur = Math.round(durMs / 86400000)
      prevEnd   = toStr(addDays(new Date(start), -1))
      prevStart = toStr(addDays(new Date(prevEnd), -daysDur))
      break
    }
    default: { // 'all'
      start     = '2000-01-01'
      end       = '2099-12-31'
      prevStart = null
      prevEnd   = null
      break
    }
  }

  const label = PRESETS.find(p => p.id === preset)?.label ?? 'All Time'
  return { preset, start, end, prevStart, prevEnd, label }
}

/**
 * Filter a transaction array to those within [start, end] inclusive.
 */
export function filterByRange(transactions, start, end) {
  if (start === '2000-01-01' && end === '2099-12-31') return transactions
  return transactions.filter(t => t.date >= start && t.date <= end)
}

/**
 * Format a range for display: "Jan 1 – Mar 31" or "All Time"
 */
export function formatRangeLabel(start, end) {
  if (start === '2000-01-01') return 'All Time'
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

/** Compute % change: (current - prev) / prev * 100, or null if no prev */
export function pctChange(current, prev) {
  if (!prev || prev === 0) return null
  return ((current - prev) / prev) * 100
}
