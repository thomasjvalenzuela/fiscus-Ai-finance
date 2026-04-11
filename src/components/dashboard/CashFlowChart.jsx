import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const fmtFull = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function TT(props) {
  return (
    <Tooltip
      {...props}
      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text-primary)' }}
      labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
    />
  )
}

export default function CashFlowChart({ months = [] }) {
  const lineData = useMemo(
    () => months.map((m) => ({ month: m.month.substring(5), income: m.income, expenses: m.expenses })),
    [months],
  )
  const avgIncome   = months.length ? months.reduce((s, m) => s + m.income,   0) / months.length : 0
  const avgExpenses = months.length ? months.reduce((s, m) => s + m.expenses, 0) / months.length : 0

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Cash Flow Forecast</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Monthly income vs expenses</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ background: 'var(--success)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ background: 'var(--danger)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Expenses</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={lineData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <TT formatter={(v, name) => [fmtFull(v), name === 'income' ? 'Income' : 'Expenses']} />
          <Line type="monotone" dataKey="income"   stroke="var(--success)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: 'var(--success)' }} />
          <Line type="monotone" dataKey="expenses" stroke="var(--danger)"  strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: 'var(--danger)' }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Monthly Income</div>
          <div className="font-mono font-semibold mt-0.5 text-sm" style={{ color: 'var(--success)' }}>{fmtFull(avgIncome)}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Monthly Expenses</div>
          <div className="font-mono font-semibold mt-0.5 text-sm" style={{ color: 'var(--danger)' }}>{fmtFull(avgExpenses)}</div>
        </div>
      </div>
    </div>
  )
}
