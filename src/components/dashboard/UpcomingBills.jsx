import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'

const fmt = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function daysUntil(date) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((date - now) / 86400000)
}

function urgencyStyle(days) {
  if (days <= 3)  return { color: 'var(--danger)',  bg: 'rgba(255,107,107,0.1)' }
  if (days <= 7)  return { color: 'var(--warning)', bg: 'rgba(255,176,58,0.1)' }
  return              { color: 'var(--primary)',  bg: 'var(--accent-light)' }
}

export default function UpcomingBills({ debts = [] }) {
  const navigate = useNavigate()

  const bills = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return debts
      .filter((d) => d.monthlyPayment > 0 && d.dueDay)
      .map((d) => {
        let due = new Date(today.getFullYear(), today.getMonth(), d.dueDay)
        if (due <= today) due = new Date(today.getFullYear(), today.getMonth() + 1, d.dueDay)
        return { id: d.id, name: d.name, amount: d.monthlyPayment, due }
      })
      .sort((a, b) => a.due - b.due)
      .slice(0, 6)
  }, [debts])

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-light)' }}>
          <CalendarClock size={16} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Upcoming Bills</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Next 30 days</p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming bills. Add debts with due dates to track them here.</p>
          <button onClick={() => navigate('/debts')} className="btn-ghost text-xs mt-3">Add Debt</button>
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map((b) => {
            const days = daysUntil(b.due)
            const { color, bg } = urgencyStyle(days)
            const label = days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `${days}d`
            return (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: bg, color }}>
                  {b.due.getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {b.due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(b.amount)}</div>
                  <div className="text-[11px] font-medium mt-0.5" style={{ color }}>{label}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
