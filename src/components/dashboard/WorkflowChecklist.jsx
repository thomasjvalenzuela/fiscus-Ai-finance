import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle } from 'lucide-react'
import { useSettingsStore } from '../../stores/useSettingsStore.js'

const WORKFLOW_STEPS = [
  { id: 'import',     label: 'Import Transactions',    sub: 'Sync your latest bank data',  to: '/import',  btn: 'Import Now' },
  { id: 'categorize', label: 'Categorize Transactions', sub: null,                          to: '/review',  btn: 'Review' },
  { id: 'bills',      label: 'Confirm Bills & Subs',   sub: 'Check recurring payments',    to: '/debt',    btn: 'View Bills' },
  { id: 'spending',   label: 'Review Weekly Spending',  sub: 'Check budget progress',       to: '/budget',  btn: 'Budget' },
  { id: 'budgets',    label: 'Update Budgets',          sub: 'Adjust for next month',       to: '/budget',  btn: 'Edit' },
  { id: 'paycheck',   label: 'Review Paycheck Plan',   sub: 'See where income goes',       to: null,       btn: null },
]

function getWeekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export default function WorkflowChecklist({ reviewCount = 0 }) {
  const navigate = useNavigate()
  const { getWorkflowChecklist, saveWorkflowChecklist } = useSettingsStore()
  const weekKey = getWeekKey()
  const [checklist, setChecklist] = useState(() => {
    const saved = getWorkflowChecklist() ?? {}
    return saved.week === weekKey ? saved : { week: weekKey, done: {} }
  })

  const toggleStep = (id) => {
    setChecklist((prev) => {
      const updated = { ...prev, done: { ...prev.done, [id]: !prev.done[id] } }
      saveWorkflowChecklist(updated)
      return updated
    })
  }

  const completedCount = Object.values(checklist.done).filter(Boolean).length
  const allDone = completedCount === WORKFLOW_STEPS.length

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Weekly Finance Review</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {allDone
              ? '🎉 All steps complete! Great job this week.'
              : `Complete these steps to keep your finances accurate — ${completedCount}/${WORKFLOW_STEPS.length} done`}
          </p>
        </div>
        {allDone && (
          <div className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--primary)' }}>
            ✓ Week Complete
          </div>
        )}
      </div>
      <div className="rounded-full overflow-hidden mb-4" style={{ height: 4, background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / WORKFLOW_STEPS.length) * 100}%`, background: 'var(--primary)' }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {WORKFLOW_STEPS.map((step) => {
          const done = !!checklist.done[step.id]
          const dynamicSub = step.id === 'categorize' && reviewCount > 0
            ? `${reviewCount} transactions pending`
            : step.id === 'categorize' && reviewCount === 0 ? 'All categorized ✓' : step.sub
          return (
            <div
              key={step.id}
              className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all"
              style={{
                background: done ? 'var(--accent-light)' : 'var(--bg)',
                border: `1px solid ${done ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'transparent'}`,
              }}
              onClick={() => toggleStep(step.id)}
            >
              <button
                className="shrink-0 transition-colors"
                onClick={(e) => { e.stopPropagation(); toggleStep(step.id) }}
                style={{ color: done ? 'var(--primary)' : 'var(--text-muted)' }}
              >
                {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium" style={{ color: done ? 'var(--primary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>
                  {step.label}
                </div>
                {dynamicSub && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{dynamicSub}</div>}
              </div>
              {step.to && step.btn && (
                <button
                  className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
                  style={{ background: 'var(--bg-card)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                  onClick={(e) => { e.stopPropagation(); navigate(step.to) }}
                >
                  {step.btn}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
