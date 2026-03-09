import { useState, useMemo } from 'react'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, CreditCard, Upload, Plus, RefreshCw,
  CheckCircle2, Circle, Search, ArrowUpRight, Calendar,
} from 'lucide-react'
import { catMeta } from '../lib/categories.js'
import { pctChange } from '../lib/dateRange.js'
import { storage } from '../lib/storage.js'

const fmt     = n => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtFull = n => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const CHART_COLORS = [
  'var(--primary)', '#7c6af7', '#f0a040', '#f06080',
  '#60a5fa', '#a78bfa', '#34d399', '#fb923c',
]

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function getWeekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function TT({ ...rest }) {
  return (
    <Tooltip
      {...rest}
      contentStyle={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        fontSize: 12,
        color: 'var(--text-primary)',
      }}
      labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
    />
  )
}

function DeltaBadge({ value, positiveIsGood = true }) {
  if (value == null) return null
  const isGood = positiveIsGood ? value >= 0 : value <= 0
  const color = isGood ? 'var(--success)' : 'var(--danger)'
  const Icon = value > 0 ? TrendingUp : TrendingDown
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color }}>
      <Icon size={10} />
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function KpiCard({ label, value, sub, delta, positiveIsGood, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg || 'var(--accent-light)' }}
        >
          <Icon size={15} style={{ color: iconColor || 'var(--primary)' }} />
        </div>
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
      {delta != null && <DeltaBadge value={delta} positiveIsGood={positiveIsGood} />}
    </div>
  )
}

const WORKFLOW_STEPS = [
  { id: 'import',     label: 'Import Transactions',    sub: 'Sync your latest bank data',  page: 'import',  btn: 'Import Now' },
  { id: 'categorize', label: 'Categorize Transactions', sub: null,                          page: 'review',  btn: 'Review' },
  { id: 'bills',      label: 'Confirm Bills & Subs',   sub: 'Check recurring payments',    page: 'debt',    btn: 'View Bills' },
  { id: 'spending',   label: 'Review Weekly Spending',  sub: 'Check budget progress',       page: 'budget',  btn: 'Budget' },
  { id: 'budgets',    label: 'Update Budgets',          sub: 'Adjust for next month',       page: 'budget',  btn: 'Edit' },
  { id: 'paycheck',   label: 'Review Paycheck Plan',   sub: 'See where income goes',       page: null,      btn: null },
]

export default function Dashboard({
  summary, prevSummary = {}, transactions, dateRange, onNavigate,
  debts = [], budgets = [], reviewCount = 0, user,
}) {
  const { income = 0, expenses = 0, net = 0, months = [], byCat = {} } = summary
  const hasPrev = !!dateRange?.prevStart

  const [search, setSearch] = useState('')
  const weekKey = getWeekKey()
  const [checklist, setChecklist] = useState(() => {
    const saved = storage.getWorkflowChecklist() ?? {}
    return saved.week === weekKey ? saved : { week: weekKey, done: {} }
  })

  const toggleStep = (id) => {
    setChecklist(prev => {
      const updated = { ...prev, done: { ...prev.done, [id]: !prev.done[id] } }
      storage.saveWorkflowChecklist(updated)
      return updated
    })
  }

  const deltas = useMemo(() => ({
    income:   hasPrev ? pctChange(income,   prevSummary.income   ?? 0) : null,
    expenses: hasPrev ? pctChange(expenses, prevSummary.expenses ?? 0) : null,
    net:      hasPrev ? pctChange(net,      prevSummary.net      ?? 0) : null,
  }), [income, expenses, net, prevSummary, hasPrev])

  const lineData = useMemo(() =>
    months.map(m => ({ month: m.month.substring(5), income: m.income, expenses: m.expenses })),
    [months],
  )
  const avgIncome   = months.length ? income   / months.length : 0
  const avgExpenses = months.length ? expenses / months.length : 0

  const pieData = useMemo(() =>
    Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name, value })),
    [byCat],
  )

  const recentTx = useMemo(() => {
    let list = [...transactions]
      .filter(t => !t.isTransfer)
      .sort((a, b) => b.date.localeCompare(a.date))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q),
      )
    }
    return list.slice(0, 10)
  }, [transactions, search])

  const upcomingBills = useMemo(() => {
    const today = new Date()
    return debts
      .filter(d => d.minimumPayment > 0)
      .map(d => {
        let due = null
        if (d.dueDay) {
          due = new Date(today.getFullYear(), today.getMonth(), d.dueDay)
          if (due <= today) due = new Date(today.getFullYear(), today.getMonth() + 1, d.dueDay)
        }
        return { name: d.name, amount: d.minimumPayment, due }
      })
      .sort((a, b) => {
        if (!a.due && !b.due) return 0
        if (!a.due) return 1
        if (!b.due) return -1
        return a.due - b.due
      })
  }, [debts])
  const upcomingTotal = upcomingBills.reduce((s, b) => s + b.amount, 0)

  const avgMonthlyIncome = months.length ? income / months.length : 0
  const paycheckEst = avgMonthlyIncome / 2

  const budgetAlloc = useMemo(() => {
    if (!budgets.length || paycheckEst === 0) return []
    return budgets.filter(b => b.amount > 0).slice(0, 6).map(b => ({
      ...b,
      biweekly: b.amount / 2,
      pct: Math.min(100, ((b.amount / 2) / paycheckEst) * 100),
    }))
  }, [budgets, paycheckEst])
  const totalAlloc  = budgetAlloc.reduce((s, b) => s + b.biweekly, 0)
  const remaining   = paycheckEst - totalAlloc

  const completedCount = Object.values(checklist.done).filter(Boolean).length
  const allDone = completedCount === WORKFLOW_STEPS.length

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 gap-4">
        <div className="text-5xl">📊</div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>No data yet</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Import your bank CSV to get started.</p>
        <button onClick={() => onNavigate?.('import')} className="btn-primary text-sm mt-2">Import Data</button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Greeting bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {getGreeting()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Here is your financial overview
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onNavigate?.('import')} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
            <Upload size={12} /> Import
          </button>
          <button onClick={() => onNavigate?.('review')} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
            <RefreshCw size={12} /> Review
            {reviewCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: 'var(--primary)' }}
              >
                {reviewCount}
              </span>
            )}
          </button>
          <button onClick={() => onNavigate?.('transactions')} className="btn-primary text-xs flex items-center gap-1.5 py-1.5">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* ── 4 KPI cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Net Savings"
          value={fmt(net)}
          sub={net >= 0 ? 'Surplus this period' : 'Deficit this period'}
          icon={Wallet}
          iconColor="var(--primary)"
          iconBg="var(--accent-light)"
          delta={deltas.net}
        />
        <KpiCard
          label="Total Income"
          value={fmt(income)}
          sub={`${months.length} month${months.length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          iconColor="var(--success)"
          iconBg="rgba(59,197,122,0.12)"
          delta={deltas.income}
        />
        <KpiCard
          label="Total Expenses"
          value={fmt(expenses)}
          icon={TrendingDown}
          iconColor="var(--danger)"
          iconBg="rgba(255,107,107,0.1)"
          delta={deltas.expenses}
          positiveIsGood={false}
        />
        <KpiCard
          label="Upcoming Bills"
          value={fmt(upcomingTotal)}
          sub={upcomingBills.length > 0
            ? `${upcomingBills.length} payment${upcomingBills.length !== 1 ? 's' : ''} scheduled`
            : 'No bills in Debt Tracker'}
          icon={CreditCard}
          iconColor="var(--warning)"
          iconBg="rgba(247,183,49,0.12)"
        />
      </div>

      {/* ── Cash Flow Line Chart ───────────────────────────────────────── */}
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
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
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

      {/* ── Paycheck Plan + Upcoming Bills ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Paycheck allocation */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-light)' }}>
              <Wallet size={16} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Next Paycheck Plan</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Est. biweekly:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{fmt(paycheckEst)}</strong>
                {paycheckEst > 0 && <span className="ml-1">arriving Friday</span>}
              </p>
            </div>
          </div>

          {budgetAlloc.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Set up budgets to see your paycheck plan.</p>
              <button onClick={() => onNavigate?.('budget')} className="btn-ghost text-xs mt-3">Set Up Budgets</button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetAlloc.map(b => (
                <div key={b.id || b.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.category}</span>
                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(b.biweekly)}</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 5, background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${b.pct}%`, background: 'var(--primary)' }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Remaining</span>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: remaining >= 0 ? 'var(--success)' : 'var(--danger)' }}
                >
                  {fmt(remaining)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming bills timeline */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(247,183,49,0.12)' }}>
              <Calendar size={16} style={{ color: 'var(--warning)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Upcoming Bills</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>From Debt Tracker</p>
            </div>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No bills tracked yet.</p>
              <button onClick={() => onNavigate?.('debt')} className="btn-ghost text-xs mt-3">Add Bills in Debt Tracker</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingBills.slice(0, 5).map((bill, i) => {
                const isThisWeek = bill.due && (bill.due - new Date()) < 7 * 86400000
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl transition-colors" style={{ background: isThisWeek ? 'rgba(247,183,49,0.06)' : 'transparent' }}>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                      style={{ background: isThisWeek ? 'rgba(247,183,49,0.15)' : 'var(--bg)' }}
                    >
                      💳
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{bill.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: isThisWeek ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {bill.due
                          ? bill.due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          : 'No due date'}
                        {isThisWeek && ' · This week'}
                      </div>
                    </div>
                    <div
                      className="font-mono text-xs font-semibold shrink-0"
                      style={{ color: isThisWeek ? 'var(--warning)' : 'var(--text-secondary)' }}
                    >
                      {fmt(bill.amount)}
                    </div>
                  </div>
                )
              })}
              {upcomingTotal > 0 && (
                <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total upcoming</span>
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(upcomingTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Weekly Finance Workflow ────────────────────────────────────── */}
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
            <div
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'var(--accent-light)', color: 'var(--primary)' }}
            >
              ✓ Week Complete
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="rounded-full overflow-hidden mb-4" style={{ height: 4, background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / WORKFLOW_STEPS.length) * 100}%`, background: 'var(--primary)' }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {WORKFLOW_STEPS.map((step) => {
            const done = !!checklist.done[step.id]
            const dynamicSub = step.id === 'categorize' && reviewCount > 0
              ? `${reviewCount} transactions pending`
              : step.id === 'categorize' && reviewCount === 0
              ? 'All categorized ✓'
              : step.sub
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
                  onClick={e => { e.stopPropagation(); toggleStep(step.id) }}
                  style={{ color: done ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                  {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-medium"
                    style={{
                      color: done ? 'var(--primary)' : 'var(--text-primary)',
                      textDecoration: done ? 'line-through' : 'none',
                      opacity: done ? 0.7 : 1,
                    }}
                  >
                    {step.label}
                  </div>
                  {dynamicSub && (
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{dynamicSub}</div>
                  )}
                </div>
                {step.page && step.btn && (
                  <button
                    className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--primary)',
                      border: '1px solid var(--border)',
                    }}
                    onClick={e => { e.stopPropagation(); onNavigate?.(step.page) }}
                  >
                    {step.btn}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Spending donut + Recent transactions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Spending donut */}
        <div className="card p-5 lg:col-span-2 flex flex-col">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Expense Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={80}
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
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

        {/* Recent transactions with search */}
        <div className="card p-5 lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
            <button
              onClick={() => onNavigate?.('transactions')}
              className="text-[11px] font-medium flex items-center gap-1"
              style={{ color: 'var(--primary)' }}
            >
              View all <ArrowUpRight size={11} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input pl-8 text-xs py-2"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: 300 }}>
            {recentTx.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg)] transition-colors">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ background: 'var(--bg)' }}
                >
                  {catMeta(t.category).icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {t.description}
                  </div>
                  <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span>{t.date}</span>
                    {t.category && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px]"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                      >
                        {t.category}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="font-mono text-xs font-semibold shrink-0"
                  style={{ color: t.isIncome ? 'var(--success)' : 'var(--text-secondary)' }}
                >
                  {t.isIncome ? '+' : '−'}{fmtFull(t.amount)}
                </div>
              </div>
            ))}
            {recentTx.length === 0 && (
              <p className="text-xs text-center py-10" style={{ color: 'var(--text-muted)' }}>
                No transactions found
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
