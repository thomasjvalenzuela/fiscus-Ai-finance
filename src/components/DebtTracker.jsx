import { useState } from 'react'
import { Plus, Trash2, Edit2, CreditCard, TrendingDown, Zap, Calendar } from 'lucide-react'

const fmt      = n => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = n => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

function calcPayoff(balance, apr, monthlyPayment) {
  if (!balance || !monthlyPayment) return null
  const r = apr / 100 / 12
  if (r === 0) {
    const months = Math.ceil(balance / monthlyPayment)
    return { months, totalInterest: 0 }
  }
  if (monthlyPayment <= balance * r) return null
  const months = Math.ceil(-Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r))
  const totalPaid = monthlyPayment * months
  return { months, totalInterest: totalPaid - balance }
}

function payoffDate(months) {
  const d = new Date(Date.now() + months * 30.5 * 24 * 3600 * 1000)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

function fmtMonths(n) {
  if (n < 12) return `${n} mo`
  const y = Math.floor(n / 12), m = n % 12
  return m === 0 ? `${y}y` : `${y}y ${m}mo`
}

const BLANK = { name: '', balance: '', apr: '', monthlyPayment: '', originalBalance: '', dueDay: '' }

export default function DebtTracker({ debts, onSave, settings = {} }) {
  const [showAdd, setShowAdd]   = useState(false)
  const [form,    setForm]      = useState(BLANK)
  const [editId,  setEditId]    = useState(null)

  const totalDebt     = debts.reduce((s, d) => s + (d.balance || 0), 0)
  const totalOriginal = debts.reduce((s, d) => s + (d.originalBalance || d.balance || 0), 0)
  const totalMinPmt   = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0)

  const addOrUpdate = () => {
    if (!form.name || !form.balance) return
    const debt = {
      id:              editId ?? Date.now().toString(),
      name:            form.name,
      balance:         parseFloat(form.balance)        || 0,
      apr:             parseFloat(form.apr)            || 0,
      monthlyPayment:  parseFloat(form.monthlyPayment) || 0,
      originalBalance: parseFloat(form.originalBalance) || parseFloat(form.balance) || 0,
      dueDay:          parseInt(form.dueDay)           || null,
    }
    if (editId) {
      onSave(debts.map(d => d.id === editId ? debt : d))
      setEditId(null)
    } else {
      onSave([...debts, debt])
    }
    setForm(BLANK)
    setShowAdd(false)
  }

  const startEdit = (d) => {
    setForm({
      name:            d.name,
      balance:         d.balance,
      apr:             d.apr,
      monthlyPayment:  d.monthlyPayment,
      originalBalance: d.originalBalance || d.balance,
      dueDay:          d.dueDay ?? '',
    })
    setEditId(d.id)
    setShowAdd(true)
  }
  const deleteDebt = (id) => onSave(debts.filter(d => d.id !== id))

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Debt Tracker</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Track balances, APR, and payoff timelines
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(v => !v); setEditId(null); setForm(BLANK) }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} /> Add Debt
        </button>
      </div>

      {/* Summary bar */}
      {debts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <div className="font-mono text-xl font-bold" style={{ color: 'var(--danger)' }}>
              {fmtShort(totalDebt)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total remaining</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-mono text-xl font-bold" style={{ color: 'var(--success)' }}>
              {totalOriginal > 0 ? ((1 - totalDebt / totalOriginal) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Overall paid off</div>
          </div>
          <div className="card p-4 text-center">
            <div className="font-mono text-xl font-bold" style={{ color: 'var(--primary)' }}>
              {fmtShort(totalMinPmt)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Monthly payments</div>
          </div>
        </div>
      )}

      {/* Add/Edit form */}
      {showAdd && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editId ? 'Edit Debt' : 'Add New Debt'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Name</label>
              <input
                className="input"
                placeholder="e.g. Chase Sapphire, Student Loan"
                value={form.name}
                onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Current Balance ($)</label>
              <input
                className="input" type="number" placeholder="5000"
                value={form.balance}
                onChange={e => setForm(v => ({ ...v, balance: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Original Balance ($)</label>
              <input
                className="input" type="number" placeholder="8000"
                value={form.originalBalance}
                onChange={e => setForm(v => ({ ...v, originalBalance: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>APR (%)</label>
              <input
                className="input" type="number" placeholder="19.99"
                value={form.apr}
                onChange={e => setForm(v => ({ ...v, apr: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Monthly Payment ($)</label>
              <input
                className="input" type="number" placeholder="200"
                value={form.monthlyPayment}
                onChange={e => setForm(v => ({ ...v, monthlyPayment: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Due Day <span style={{ opacity: 0.5 }}>(day of month, e.g. 15)</span>
              </label>
              <input
                className="input" type="number" placeholder="15" min="1" max="31"
                value={form.dueDay}
                onChange={e => setForm(v => ({ ...v, dueDay: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addOrUpdate} className="btn-primary text-sm">
              {editId ? 'Save Changes' : 'Add Debt'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditId(null); setForm(BLANK) }}
              className="btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Debt cards */}
      {debts.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <CreditCard size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No debts tracked yet.</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Add a debt to see payoff ETA, interest costs, and payment scenarios.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map(d => {
            const original  = d.originalBalance || d.balance
            const paidPct   = original > 0 ? Math.min(100, ((original - d.balance) / original) * 100) : 0
            const payoff    = calcPayoff(d.balance, d.apr, d.monthlyPayment)

            // Extra payment scenarios
            const extras = [50, 100, 200].map(extra => {
              const p = calcPayoff(d.balance, d.apr, d.monthlyPayment + extra)
              if (!p || !payoff) return null
              const saved = payoff.months - p.months
              const interestSaved = payoff.totalInterest - p.totalInterest
              return { extra, months: p.months, saved, interestSaved }
            }).filter(Boolean)

            const nextDue = d.dueDay ? (() => {
              const today = new Date()
              let due = new Date(today.getFullYear(), today.getMonth(), d.dueDay)
              if (due <= today) due = new Date(today.getFullYear(), today.getMonth() + 1, d.dueDay)
              return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            })() : null

            return (
              <div key={d.id} className="card p-5 space-y-4">
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,107,107,0.1)' }}
                    >
                      <CreditCard size={16} style={{ color: 'var(--danger)' }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {d.name}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <span>{d.apr}% APR</span>
                        <span>·</span>
                        <span>{fmt(d.monthlyPayment)}/mo</span>
                        {nextDue && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              Due {nextDue}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(d)}
                      className="btn-icon !w-7 !h-7"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => deleteDebt(d.id)}
                      className="btn-icon !w-7 !h-7"
                      style={{ '--hover-color': 'var(--danger)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Balance + progress */}
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-mono text-2xl font-bold" style={{ color: 'var(--danger)' }}>
                      {fmt(d.balance)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      of {fmt(original)}
                    </span>
                  </div>
                  <div
                    className="rounded-full overflow-hidden mb-1"
                    style={{ height: 7, background: 'var(--border)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${paidPct}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--success))',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{paidPct.toFixed(0)}% paid off</span>
                    <span>{fmt(original - d.balance)} paid</span>
                  </div>
                </div>

                {/* Payoff ETA */}
                {payoff ? (
                  <div className="space-y-3">
                    {/* Main payoff stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: 'var(--bg)' }}
                      >
                        <div
                          className="font-mono text-sm font-bold"
                          style={{ color: 'var(--primary)' }}
                        >
                          {payoffDate(payoff.months)}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Payoff date
                        </div>
                      </div>
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: 'var(--bg)' }}
                      >
                        <div
                          className="font-mono text-sm font-bold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {fmtMonths(payoff.months)}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Time left
                        </div>
                      </div>
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: 'var(--bg)' }}
                      >
                        <div
                          className="font-mono text-sm font-bold"
                          style={{ color: 'var(--warning)' }}
                        >
                          {fmt(payoff.totalInterest)}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Total interest
                        </div>
                      </div>
                    </div>

                    {/* Extra payment scenarios */}
                    {extras.length > 0 && (
                      <div>
                        <div
                          className="text-[11px] font-semibold mb-2 flex items-center gap-1.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Zap size={11} style={{ color: 'var(--success)' }} />
                          Pay it off faster
                        </div>
                        <div className="space-y-1.5">
                          {extras.map(({ extra, months, saved, interestSaved }) => (
                            <div
                              key={extra}
                              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs"
                              style={{ background: 'rgba(59,197,122,0.06)', border: '1px solid rgba(59,197,122,0.15)' }}
                            >
                              <span style={{ color: 'var(--text-secondary)' }}>
                                +{fmtShort(extra)}/mo extra
                              </span>
                              <div className="flex items-center gap-3 text-right">
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                  {fmtMonths(saved)} sooner
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  saves {fmt(interestSaved)}
                                </span>
                                <span
                                  className="font-medium"
                                  style={{ color: 'var(--primary)' }}
                                >
                                  → {payoffDate(months)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : d.monthlyPayment > 0 ? (
                  <div
                    className="text-xs rounded-xl px-3 py-2 flex items-center gap-2"
                    style={{ background: 'rgba(255,107,107,0.08)', color: 'var(--danger)' }}
                  >
                    <TrendingDown size={12} />
                    Monthly payment doesn't cover interest — increase payment to make progress.
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
