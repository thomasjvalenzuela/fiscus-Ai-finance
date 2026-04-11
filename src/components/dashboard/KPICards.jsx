import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton.jsx'

const fmt = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

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

function KpiCard({ label, value, sub, delta, positiveIsGood, icon: Icon, iconColor, iconBg, loading }) {
  if (loading) {
    return (
      <div className="card p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg || 'var(--accent-light)' }}>
          <Icon size={15} style={{ color: iconColor || 'var(--primary)' }} />
        </div>
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
      {delta != null && <DeltaBadge value={delta} positiveIsGood={positiveIsGood} />}
    </div>
  )
}

export default function KPICards({ summary, prevSummary = {}, debts = [], hasPrev, loading }) {
  const { income = 0, expenses = 0, net = 0, months = [] } = summary

  const pctChange = (cur, prev) => (!prev || prev === 0 ? null : ((cur - prev) / prev) * 100)
  const deltas = {
    income:   hasPrev ? pctChange(income,   prevSummary.income   ?? 0) : null,
    expenses: hasPrev ? pctChange(expenses, prevSummary.expenses ?? 0) : null,
    net:      hasPrev ? pctChange(net,      prevSummary.net      ?? 0) : null,
  }

  const upcomingBills = debts.filter((d) => d.minimumPayment > 0)
  const upcomingTotal = upcomingBills.reduce((s, d) => s + d.minimumPayment, 0)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard loading={loading} label="Net Savings"    value={fmt(net)}      sub={net >= 0 ? 'Surplus this period' : 'Deficit this period'} icon={Wallet}      iconColor="var(--primary)"  iconBg="var(--accent-light)"            delta={deltas.net} />
      <KpiCard loading={loading} label="Total Income"   value={fmt(income)}   sub={`${months.length} month${months.length !== 1 ? 's' : ''}`}                    icon={TrendingUp}  iconColor="var(--success)"  iconBg="rgba(59,197,122,0.12)"          delta={deltas.income} />
      <KpiCard loading={loading} label="Total Expenses" value={fmt(expenses)}                                                                                     icon={TrendingDown} iconColor="var(--danger)"  iconBg="rgba(255,107,107,0.1)"          delta={deltas.expenses} positiveIsGood={false} />
      <KpiCard loading={loading} label="Upcoming Bills" value={fmt(upcomingTotal)} sub={upcomingBills.length > 0 ? `${upcomingBills.length} payment${upcomingBills.length !== 1 ? 's' : ''} scheduled` : 'No bills in Debt Tracker'} icon={CreditCard} iconColor="var(--warning)" iconBg="rgba(247,183,49,0.12)" />
    </div>
  )
}
