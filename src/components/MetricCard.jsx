import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * props:
 *   label        — top label string
 *   value        — formatted value string
 *   sub          — optional sub-text
 *   delta        — % change vs previous period (number | null | undefined)
 *   deltaLabel   — e.g. "vs. prev period"
 *   positiveIsGood — default true; set false to flip color (e.g. expenses: lower = green)
 *   color        — accent color
 *   icon         — lucide icon component
 */
export default function MetricCard({
  label, value, sub,
  delta, deltaLabel = 'vs. prev period', positiveIsGood = true,
  color = 'var(--primary)', icon: Icon,
  // back-compat
  trend,
}) {
  const pct = delta !== undefined ? delta : trend

  const isGood = positiveIsGood ? (pct >= 0) : (pct <= 0)

  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        {Icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: color + '20' }}
          >
            <Icon size={14} style={{ color }} />
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <div
          className="font-mono text-xl sm:text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </div>
        )}
      </div>

      {/* Period comparison */}
      {pct != null && (
        <div
          className="flex items-center gap-1 text-[11px] font-semibold"
          style={{ color: isGood ? 'var(--success)' : 'var(--danger)' }}
        >
          {Math.abs(pct) < 0.1
            ? <Minus size={11} />
            : pct > 0
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />
          }
          {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
          <span className="font-normal" style={{ color: 'var(--text-muted)', marginLeft: 2 }}>
            {deltaLabel}
          </span>
        </div>
      )}
    </div>
  )
}
