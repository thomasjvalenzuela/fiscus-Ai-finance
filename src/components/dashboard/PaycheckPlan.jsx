import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'

const fmt = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

export default function PaycheckPlan({ budgets = [], avgMonthlyIncome = 0, byCat = {} }) {
  const navigate = useNavigate()
  const paycheckEst = avgMonthlyIncome / 2

  const budgetAlloc = useMemo(() => {
    if (!budgets.length || paycheckEst === 0) return []
    return budgets.filter((b) => b.amount > 0 || b.limit > 0).slice(0, 6).map((b) => {
      const amt = b.amount ?? b.limit ?? 0
      return { ...b, biweekly: amt / 2, pct: Math.min(100, ((amt / 2) / paycheckEst) * 100) }
    })
  }, [budgets, paycheckEst])

  const totalAlloc = budgetAlloc.reduce((s, b) => s + b.biweekly, 0)
  const remaining  = paycheckEst - totalAlloc

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-light)' }}>
          <Wallet size={16} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Next Paycheck Plan</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Est. biweekly: <strong style={{ color: 'var(--text-primary)' }}>{fmt(paycheckEst)}</strong>
          </p>
        </div>
      </div>
      {budgetAlloc.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Set up budgets to see your paycheck plan.</p>
          <button onClick={() => navigate('/budget')} className="btn-ghost text-xs mt-3">Set Up Budgets</button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetAlloc.map((b) => (
            <div key={b.id || b.category}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.category}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(b.biweekly)}</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 5, background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.pct}%`, background: 'var(--primary)' }} />
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Remaining</span>
            <span className="font-mono text-sm font-bold" style={{ color: remaining >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(remaining)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
