import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EmptyState } from './ui/EmptyState.jsx'
import { Upload } from 'lucide-react'
import DashboardGreeting   from './dashboard/DashboardGreeting.jsx'
import KPICards            from './dashboard/KPICards.jsx'
import CashFlowChart       from './dashboard/CashFlowChart.jsx'
import WorkflowChecklist   from './dashboard/WorkflowChecklist.jsx'
import ExpenseDonut        from './dashboard/ExpenseDonut.jsx'
import RecentTransactions  from './dashboard/RecentTransactions.jsx'
import PaycheckPlan        from './dashboard/PaycheckPlan.jsx'
import UpcomingBills       from './dashboard/UpcomingBills.jsx'
import { useBudgetStore }  from '../stores/useBudgetStore.js'
import { useDebtStore }    from '../stores/useDebtStore.js'

const PAGE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.18 } }

export default function Dashboard({ summary, prevSummary = {}, transactions, dateRange, reviewCount = 0, user }) {
  const navigate = useNavigate()
  const { budgets } = useBudgetStore()
  const { debts }   = useDebtStore()
  const hasPrev = !!dateRange?.prevStart

  if (!transactions.length) {
    return (
      <motion.div {...PAGE} className="flex items-center justify-center h-full">
        <EmptyState
          icon={Upload}
          title="No data yet"
          description="Import your bank CSV to get started."
          action={<button onClick={() => navigate('/import')} className="btn-primary text-sm">Import Data</button>}
        />
      </motion.div>
    )
  }

  return (
    <motion.div {...PAGE} className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <DashboardGreeting user={user} reviewCount={reviewCount} />
      <KPICards summary={summary} prevSummary={prevSummary} debts={debts} hasPrev={hasPrev} />
      <CashFlowChart months={summary.months ?? []} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaycheckPlan budgets={budgets} avgMonthlyIncome={summary.income && summary.months?.length ? summary.income / summary.months.length : 0} byCat={summary.byCat ?? {}} />
        <UpcomingBills debts={debts} />
      </div>
      <WorkflowChecklist reviewCount={reviewCount} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ExpenseDonut byCat={summary.byCat ?? {}} />
        <RecentTransactions transactions={transactions} />
      </div>
    </motion.div>
  )
}
