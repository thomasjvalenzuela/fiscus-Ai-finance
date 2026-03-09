import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Transactions from './components/Transactions.jsx'
import ReviewPage from './components/ReviewPage.jsx'
import BudgetPage from './components/BudgetPage.jsx'
import DebtTracker from './components/DebtTracker.jsx'
import AIAdvisor from './components/AIAdvisor.jsx'
import ImportPage from './components/ImportPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import FloatingChat from './components/FloatingChat.jsx'
import SetupWizard from './components/SetupWizard.jsx'
import LoginPage from './components/LoginPage.jsx'
import { storage } from './lib/storage.js'
import { getCurrentSession, logout } from './lib/authStore.js'
import { computeSummary } from './lib/csvParser.js'
import { computeRange, filterByRange, pctChange } from './lib/dateRange.js'
import { applyPalette } from './lib/palettes.js'

// Resolve 'system' | 'light' | 'dark' → effective 'light' | 'dark'
function resolveTheme(setting) {
  if (setting === 'dark') return 'dark'
  if (setting === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(effective) {
  document.documentElement.classList.toggle('dark', effective === 'dark')
}

export default function App() {
  const [session, setSession]         = useState(() => getCurrentSession())
  const [page, setPage]               = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [wizardOpen, setWizardOpen]   = useState(false)

  // Per-user data
  const [transactions, setTransactions]    = useState([])
  const [budgets, setBudgets]              = useState([])
  const [debts, setDebts]                  = useState([])
  const [settings, setSettings]            = useState({ openaiKey:'', openaiModel:'gpt-4o-mini', pageSize:50, customRules:[], theme:'system' })
  const [rentalProperties, setRentalProps] = useState([])
  const [themeSetting, setThemeSetting]    = useState('system')
  const [branding, setBranding]            = useState(() => storage.getBranding())

  // Date range — default to All Time so users see all their data immediately
  const [dateRange, setDateRange] = useState(() => computeRange('all'))

  // Load when session changes
  useEffect(() => {
    if (!session) return
    storage.setUser(session.username)
    setTransactions(storage.getTransactions())
    setBudgets(storage.getBudgets())
    setDebts(storage.getDebts())
    const s = storage.getSettings()
    setSettings(s)
    setThemeSetting(s.theme ?? 'system')
    setBranding(storage.getBranding())
    setRentalProps(storage.getRentalProperties())
    const w = storage.getWizard()
    if (!w.completed && !w.skipped) setWizardOpen(true)
  }, [session])

  // Theme — follows system if set to 'system'
  useEffect(() => {
    const effective = resolveTheme(themeSetting)
    applyTheme(effective)
    if (themeSetting === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const h = () => applyTheme(resolveTheme('system'))
      mq.addEventListener('change', h)
      return () => mq.removeEventListener('change', h)
    }
  }, [themeSetting])

  const effectiveTheme = useMemo(() => resolveTheme(themeSetting), [themeSetting])

  // Apply color palette whenever branding or theme changes
  useEffect(() => {
    applyPalette(branding.palette ?? 'forest', effectiveTheme === 'dark')
  }, [branding.palette, effectiveTheme])

  // Date-filtered slices
  const filteredTx = useMemo(
    () => filterByRange(transactions, dateRange.start, dateRange.end),
    [transactions, dateRange],
  )
  const prevTx = useMemo(
    () => dateRange.prevStart
      ? filterByRange(transactions, dateRange.prevStart, dateRange.prevEnd)
      : [],
    [transactions, dateRange],
  )
  const summary     = useMemo(() => computeSummary(filteredTx), [filteredTx])
  const prevSummary = useMemo(() => computeSummary(prevTx),     [prevTx])

  const reviewCount = useMemo(() => transactions.filter(t => !t.isTransfer && !t.category).length, [transactions])

  const saveTransactions = useCallback((v) => { setTransactions(v); storage.saveTransactions(v) }, [])
  const saveBudgets      = useCallback((v) => { setBudgets(v);      storage.saveBudgets(v) }, [])
  const saveDebts        = useCallback((v) => { setDebts(v);        storage.saveDebts(v) }, [])
  const saveRentalProps  = useCallback((v) => { setRentalProps(v);  storage.saveRentalProperties(v) }, [])
  const saveSettings     = useCallback((v) => {
    setSettings(v); setThemeSetting(v.theme ?? 'system'); storage.saveSettings(v)
  }, [])
  const saveBranding     = useCallback((v) => {
    setBranding(v); storage.saveBranding(v)
  }, [])
  const updateCategory   = useCallback((id, cat) => {
    saveTransactions(transactions.map(t => t.id === id ? { ...t, category: cat } : t))
  }, [transactions, saveTransactions])
  const clearAll = useCallback(() => {
    storage.clearAll()
    setTransactions([]); setBudgets([]); setDebts([]); setRentalProps([])
    setSettings(storage.getSettings())
    setBranding(storage.getBranding())
  }, [])
  const toggleTheme = useCallback(() => {
    const next = effectiveTheme === 'dark' ? 'light' : 'dark'
    saveSettings({ ...settings, theme: next })
  }, [effectiveTheme, settings, saveSettings])

  const handleLogin  = (s) => { setSession(s); setPage('dashboard') }
  const handleLogout = () => {
    logout(); setSession(null); setPage('dashboard')
    setTransactions([]); setBudgets([]); setDebts([]); setRentalProps([])
  }
  const closeWizard = () => { storage.saveWizard({ completed: true }); setWizardOpen(false) }

  if (!session) return <LoginPage onLogin={handleLogin} />

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <Dashboard summary={summary} prevSummary={prevSummary} transactions={filteredTx} dateRange={dateRange} onNavigate={setPage} debts={debts} budgets={budgets} reviewCount={reviewCount} user={session} />
      case 'transactions': return <Transactions transactions={filteredTx} onUpdateCategory={updateCategory} />
      case 'review':       return <ReviewPage transactions={transactions} settings={settings} onUpdateCategory={updateCategory} onSaveTransactions={saveTransactions} />
      case 'budget':       return <BudgetPage budgets={budgets} onSave={saveBudgets} summary={summary} settings={settings} rentalProperties={rentalProperties} />
      case 'debt':         return <DebtTracker debts={debts} onSave={saveDebts} settings={settings} />
      case 'rental':       return <RentalPage properties={rentalProperties} />
      case 'advisor':      return <AIAdvisor summary={summary} debts={debts} settings={settings} rentalProperties={rentalProperties} />
      case 'import':       return <ImportPage transactions={transactions} onImport={saveTransactions} />
      case 'settings':     return <SettingsPage settings={settings} onSave={saveSettings} onClearData={clearAll} onOpenWizard={() => setWizardOpen(true)} themeSetting={themeSetting} branding={branding} onSaveBranding={saveBranding} />
      default: return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar page={page} setPage={(p) => { setPage(p); setSidebarOpen(false) }} reviewCount={reviewCount} user={session} onLogout={handleLogout} branding={branding} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar page={page} theme={effectiveTheme} toggleTheme={toggleTheme} onMenuClick={() => setSidebarOpen(o => !o)} dateRange={dateRange} onDateRangeChange={setDateRange} />
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
      <FloatingChat summary={summary} debts={debts} settings={settings} onOpenWizard={() => setWizardOpen(true)} />
      {wizardOpen && (
        <SetupWizard onClose={closeWizard} settings={settings} onSaveSettings={saveSettings} summary={summary} rentalProperties={rentalProperties} onSaveRentalProperties={saveRentalProps} onSaveBudgets={saveBudgets} budgets={budgets} />
      )}
    </div>
  )
}

function RentalPage({ properties }) {
  const fmt = n => '$' + (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (!properties.length) return (
    <div className="flex flex-col items-center justify-center py-28 gap-3">
      <span className="text-5xl">🏠</span>
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No rental properties yet</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add them in the Setup Wizard (⚙ Settings → Run Wizard).</p>
    </div>
  )
  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Rental Properties</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {properties.map(p => {
          const cf = (p.monthlyRent || 0) - (p.mortgage || 0)
          return (
            <div key={p.id} className="card p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'var(--accent-light)' }}>🏠</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{p.address}</div>
                  {p.tenant && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tenant: {p.tenant}</div>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Rent', p.monthlyRent, 'success'], ['Mortgage', p.mortgage, 'danger'], ['Cash Flow', cf, cf >= 0 ? 'success' : 'danger']].map(([label, val, type]) => (
                  <div key={label} className="rounded-xl p-2.5" style={{ background: 'var(--bg)' }}>
                    <div className="font-mono text-sm font-semibold" style={{ color: `var(--${type})` }}>{fmt(val)}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}/mo</div>
                  </div>
                ))}
              </div>
              {p.notes && <p className="text-xs mt-3 italic" style={{ color: 'var(--text-muted)' }}>{p.notes}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
