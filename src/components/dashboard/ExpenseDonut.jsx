import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const fmt     = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtFull = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function getChartColors() {
  const s = getComputedStyle(document.documentElement)
  return [
    s.getPropertyValue('--primary').trim()  || '#2F6F5F',
    s.getPropertyValue('--info').trim()     || '#4A90E2',
    s.getPropertyValue('--warning').trim()  || '#F7B731',
    s.getPropertyValue('--danger').trim()   || '#FF6B6B',
    '#60a5fa', '#a78bfa', '#34d399', '#fb923c',
  ]
}

function TT(props) {
  return (
    <Tooltip
      {...props}
      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' }}
      labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
    />
  )
}

export default function ExpenseDonut({ byCat = {} }) {
  const CHART_COLORS = useMemo(() => getChartColors(), [])
  const pieData = useMemo(
    () => Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name, value })),
    [byCat],
  )

  return (
    <div className="card p-5 lg:col-span-2 flex flex-col">
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
            {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <TT formatter={(v, name) => [fmtFull(v), name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-3">
        {pieData.slice(0, 6).map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
            <span className="font-mono shrink-0 font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
