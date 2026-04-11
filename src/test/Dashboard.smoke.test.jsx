import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../components/Dashboard.jsx'
import { useBudgetStore } from '../stores/useBudgetStore.js'
import { useDebtStore }   from '../stores/useDebtStore.js'

// Minimal summary shape expected by Dashboard sub-components
const SUMMARY = {
  income: 5000,
  expenses: 3200,
  net: 1800,
  byCat: { Groceries: 400, Dining: 200 },
  months: [{ month: '2024-03', income: 5000, expenses: 3200 }],
  avgMonthlyIncome: 5000,
  avgMonthlyExpenses: 3200,
}

// Stub recharts to avoid SVG render issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  LineChart:   ({ children }) => <svg>{children}</svg>,
  Line:        () => null,
  XAxis:       () => null,
  YAxis:       () => null,
  CartesianGrid: () => null,
  Tooltip:     () => null,
  PieChart:    ({ children }) => <svg>{children}</svg>,
  Pie:         () => null,
  Cell:        () => null,
}))

function renderDashboard(txOverrides = {}) {
  useBudgetStore.setState({ budgets: [] })
  useDebtStore.setState({ debts: [] })

  return render(
    <MemoryRouter>
      <Dashboard
        summary={SUMMARY}
        transactions={[{ id: '1', date: '2024-03-01', description: 'AMAZON', amount: 50, isIncome: false, isTransfer: false, category: 'Shopping', account: 'Checking', ...txOverrides }]}
        dateRange={{ preset: 'all' }}
        reviewCount={0}
        user={{ username: 'demo' }}
      />
    </MemoryRouter>
  )
}

describe('Dashboard smoke tests', () => {
  it('renders without crashing', () => {
    renderDashboard()
  })

  it('shows empty state when no transactions', () => {
    useBudgetStore.setState({ budgets: [] })
    useDebtStore.setState({ debts: [] })
    render(
      <MemoryRouter>
        <Dashboard
          summary={{ income: 0, expenses: 0, net: 0, byCat: {}, months: [] }}
          transactions={[]}
          dateRange={{ preset: 'all' }}
          reviewCount={0}
          user={{ username: 'demo' }}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/No data yet/i)).toBeInTheDocument()
  })

  it('renders KPI section', () => {
    renderDashboard()
    // KPICards renders monetary values — any "$" proves it rendered
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0)
  })
})
