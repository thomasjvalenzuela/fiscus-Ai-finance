import { describe, it, expect } from 'vitest'
import { computeRange, filterByRange, pctChange } from '../lib/dateRange.js'

describe('computeRange', () => {
  it('returns sentinel dates for "all"', () => {
    const r = computeRange('all')
    expect(r.start).toBe('2000-01-01')
    expect(r.end).toBe('2099-12-31')
    expect(r.prevStart).toBeNull()
    expect(r.prevEnd).toBeNull()
  })

  it('this_month start is first of current month', () => {
    const r = computeRange('this_month')
    const today = new Date()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    expect(r.start).toBe(expected)
  })

  it('last_month start < end', () => {
    const r = computeRange('last_month')
    expect(r.start < r.end).toBe(true)
  })

  it('custom range uses provided dates', () => {
    const r = computeRange('custom', '2024-01-01', '2024-03-31')
    expect(r.start).toBe('2024-01-01')
    expect(r.end).toBe('2024-03-31')
    expect(r.prevStart).toBeTruthy()
  })

  it('all presets return valid labels', () => {
    const presets = ['this_month', 'last_month', 'last_3m', 'last_6m', 'ytd', 'last_12m', 'all']
    presets.forEach(p => {
      const r = computeRange(p)
      expect(r.label).toBeTruthy()
    })
  })
})

describe('filterByRange', () => {
  const txs = [
    { id: '1', date: '2024-01-15' },
    { id: '2', date: '2024-03-01' },
    { id: '3', date: '2024-06-30' },
  ]

  it('returns all for sentinel range', () => {
    expect(filterByRange(txs, '2000-01-01', '2099-12-31')).toHaveLength(3)
  })

  it('filters to range inclusive', () => {
    const result = filterByRange(txs, '2024-01-01', '2024-03-31')
    expect(result.map(t => t.id)).toEqual(['1', '2'])
  })

  it('exact boundary dates are included', () => {
    const result = filterByRange(txs, '2024-01-15', '2024-06-30')
    expect(result).toHaveLength(3)
  })
})

describe('pctChange', () => {
  it('returns null when prev is 0', () => {
    expect(pctChange(100, 0)).toBeNull()
  })

  it('returns null when prev is falsy', () => {
    expect(pctChange(100, null)).toBeNull()
  })

  it('computes positive change', () => {
    expect(pctChange(120, 100)).toBeCloseTo(20)
  })

  it('computes negative change', () => {
    expect(pctChange(80, 100)).toBeCloseTo(-20)
  })
})
