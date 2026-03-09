import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { PRESETS, computeRange, formatRangeLabel } from '../lib/dateRange.js'

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen]         = useState(false)
  const [customStart, setCS]    = useState(value?.customStart || '')
  const [customEnd,   setCE]    = useState(value?.customEnd   || '')
  const ref = useRef()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (preset) => {
    const cs = preset === 'custom' ? customStart : ''
    const ce = preset === 'custom' ? customEnd   : ''
    onChange({ ...computeRange(preset, cs, ce), customStart: cs, customEnd: ce })
    if (preset !== 'custom') setOpen(false)
  }

  const applyCustom = () => {
    if (!customStart || !customEnd) return
    onChange({ ...computeRange('custom', customStart, customEnd), customStart, customEnd })
    setOpen(false)
  }

  const active = value?.preset || 'all'
  const rangeLabel = value?.start && active !== 'all'
    ? formatRangeLabel(value.start, value.end)
    : null

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{
          background: 'var(--bg)',
          color:      'var(--text-primary)',
          border:     '1px solid var(--border)',
        }}
      >
        <CalendarDays size={13} style={{ color: 'var(--primary)' }} />
        <span>{PRESETS.find(p => p.id === active)?.label}</span>
        {rangeLabel && (
          <span style={{ color: 'var(--text-muted)' }} className="hidden sm:inline">
            &nbsp;·&nbsp;{rangeLabel}
          </span>
        )}
        <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full mt-2 right-0 z-50 rounded-2xl shadow-xl p-3 min-w-[260px]"
          style={{
            background: 'var(--bg-card)',
            border:     '1px solid var(--border)',
            boxShadow:  '0 16px 48px rgba(0,0,0,0.18)',
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            Date Range
          </p>

          {/* Preset grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {PRESETS.filter(p => p.id !== 'custom').map(p => (
              <button
                key={p.id}
                onClick={() => select(p.id)}
                className="text-xs py-2 px-3 rounded-xl text-left font-medium transition-all"
                style={
                  active === p.id
                    ? { background: 'var(--primary)', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--text-secondary)' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px my-2" style={{ background: 'var(--border)' }} />

          {/* Custom range */}
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            Custom Range
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              className="input text-xs py-1.5 flex-1"
              value={customStart}
              onChange={e => setCS(e.target.value)}
              max={customEnd || undefined}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              className="input text-xs py-1.5 flex-1"
              value={customEnd}
              onChange={e => setCE(e.target.value)}
              min={customStart || undefined}
            />
          </div>
          <button
            onClick={applyCustom}
            disabled={!customStart || !customEnd}
            className="btn-primary text-xs w-full mt-2 justify-center disabled:opacity-40"
          >
            Apply Custom Range
          </button>

          {/* Comparison info */}
          {value?.prevStart && (
            <p className="text-[10px] mt-3 px-1" style={{ color: 'var(--text-muted)' }}>
              Comparing to: {formatRangeLabel(value.prevStart, value.prevEnd)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
