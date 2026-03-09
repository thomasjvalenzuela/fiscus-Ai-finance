import { Sun, Moon, Menu } from 'lucide-react'
import DateRangePicker from './DateRangePicker.jsx'

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  transactions: 'Transactions',
  review:       'Review & Categorize',
  budget:       'Budget Tracker',
  debt:         'Debt Tracker',
  rental:       'Rental Properties',
  advisor:      'AI Advisor',
  import:       'Import Data',
  settings:     'Settings',
}

// Pages where the date-range picker is relevant
const RANGE_PAGES = new Set(['dashboard', 'transactions', 'budget'])

export default function Topbar({ page, theme, toggleTheme, onMenuClick, dateRange, onDateRangeChange }) {
  const showPicker = RANGE_PAGES.has(page) && dateRange && onDateRangeChange

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10 backdrop-blur"
      style={{
        borderColor: 'var(--border)',
        background:  'var(--bg-card)',
      }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          <Menu size={18} />
        </button>
        <h1
          className="font-semibold text-[15px] truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {PAGE_TITLES[page]}
        </h1>
      </div>

      {/* Center: date range picker (only on relevant pages) */}
      {showPicker && (
        <div className="flex-1 flex justify-center px-4">
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
        </div>
      )}

      {/* Right: theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
        style={{ color: 'var(--text-muted)' }}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  )
}
