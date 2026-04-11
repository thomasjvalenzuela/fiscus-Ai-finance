import { useEffect, useMemo, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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
import { useAuthStore }        from './stores/useAuthStore.js'
import { useTransactionStore } from './stores/useTransactionStore.js'
import { useBudgetStore }      from './stores/useBudgetStore.js'
import { useDebtStore }        from './stores/useDebtStore.js'
import { useSettingsStore }    from './stores/useSettingsStore.js'
import { computeSummary }      from './lib/csvParser.js'
import { computeRange, filterByRange, pctChange } from './lib/dateRange.js'
import { applyPalette }        from './lib/palettes.js'
import { applyThemeStyle, getThemeStyle } from './lib/themeStyle.js'
import { ThemeSwitcherPill }  from './components/ThemeSwitcher.jsx'
import { useState } from 'react'

// Resolve 'system' | 'light' | 'dark' → effective 'light' | 'dark'
function resolveTheme(setting) {
  if (setting === 'dark')  return 'dark'
  if (setting === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
function applyTheme(effective) {
  document.documentElement.classList.toggle('dark', effective === 'dark')
}

// ── Per-page <title> ──────────────────────────────────────────────────────────
const TITLES = {
  '/dashboard':    'Dashboard — Fiscus',
  '/transactions': 'Transactions — Fiscus',
  '/review':       'Review & Categorize — Fiscus',
  '/budget':       'Budget Tracker — Fiscus',
  '/debt':         'Debt Tracker — Fiscus',
  '/advisor':      'AI Advisor — Fiscus',
  '/import':       'Import Data — Fiscus',
  '/settings':     'Settings — Fiscus',
}

function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Fiscus'
  }, [pathname])
  return null
}

// ── Storage-warning toast ─────────────────────────────────────────────────────
function StorageWarning() {
  const { storageWarning, dismissStorageWarning } = useTransactionStore()
  if (!storageWarning) return null
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm"
      style={{ background: 'var(--warning)', color: '#1a1a00', maxWidth: 480 }}
    >
      <span>⚠️ Storage is nearly full (~5 MB limit). Export your data and clear old records.</span>
      <button
        onClick={dismissStorageWarning}
        className="font-semibold underline shrink-0"
      >
        Dismiss
      </button>
    </div>
  )
}

export default function App() {
  const { session, init, logout }      = useAuthStore()
  const { transactions, updateCategory, importTransactions, clearTransactions } = useTransactionStore()
  const { budgets, setBudgets, clearBudgets }     = useBudgetStore()
  const { debts, setDebts, clearDebts }           = useDebtStore()
  const { settings, branding, rentalProperties, saveSettings, saveBranding,
          saveRentalProperties, saveWizard, wizard, clearAll } = useSettingsStore()

  // Layout-only state (not domain data)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [wizardOpen,  setWizardOpen]  = useState(false)
  const [dateRange,   setDateRange]   = useState(() => computeRange('all'))

  // ── Bootstrap: restore session + theme style on mount ───────────────────────
  useEffect(() => {
    init()
    applyThemeStyle(getThemeStyle())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hydrate / clear stores when session changes ──────────────────────────────
  useEffect(() => {
    if (session) {
      useTransactionStore.getState().hydrate()
      useBudgetStore.getState().hydrate()
      useDebtStore.getState().hydrate()
      useSettingsStore.getState().hydrate()
      // Show wizard if not yet completed
      const w = useSettingsStore.getState().wizard
      if (!w.completed && !w.skipped) setWizardOpen(true)
    }
  }, [session])

  // ── Theme ────────────────────────────────────────────────────────────────────
  const themeSetting = settings.theme ?? 'system'
  useEffect(() => {
    const effective = resolveTheme(themeSetting)
    applyTheme(effective)
    if (themeSetting !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => applyTheme(resolveTheme('system'))
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [themeSetting])

  const effectiveTheme = useMemo(() => resolveTheme(themeSetting), [themeSetting])

  // ── Palette ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    applyPalette(branding.palette ?? 'forest', effectiveTheme === 'dark')
  }, [branding.palette, effectiveTheme])

  // ── Derived data ─────────────────────────────────────────────────────────────
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
  const reviewCount = useMemo(
    () => transactions.filter((t) => !t.isTransfer && !t.category).length,
    [transactions],
  )

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const handleSaveSettings = useCallback((v) => saveSettings(v), [saveSettings])
  const handleSaveBranding = useCallback((v) => saveBranding(v), [saveBranding])
  const toggleTheme = useCallback(() => {
    saveSettings({ ...settings, theme: effectiveTheme === 'dark' ? 'light' : 'dark' })
  }, [effectiveTheme, settings, saveSettings])

  const handleClearAll = useCallback(() => {
    clearAll()
    clearTransactions()
    clearBudgets()
    clearDebts()
    useSettingsStore.getState().hydrate()
  }, [clearAll, clearTransactions, clearBudgets, clearDebts])

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const handleLogin = useCallback(() => {
    // session is now set inside the store; nothing extra needed
  }, [])

  // ── Not authenticated ─────────────────────────────────────────────────────────
  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <PageTitle />
      <StorageWarning />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar
          reviewCount={reviewCount}
          user={session}
          onLogout={handleLogout}
          branding={branding}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          theme={effectiveTheme}
          toggleTheme={toggleTheme}
          onMenuClick={() => setSidebarOpen((o) => !o)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    summary={summary}
                    prevSummary={prevSummary}
                    transactions={filteredTx}
                    dateRange={dateRange}
                    reviewCount={reviewCount}
                    user={session}
                  />
                }
              />
              <Route
                path="/transactions"
                element={
                  <Transactions
                    transactions={filteredTx}
                    onUpdateCategory={updateCategory}
                  />
                }
              />
              <Route
                path="/review"
                element={
                  <ReviewPage
                    transactions={transactions}
                    settings={settings}
                    onUpdateCategory={updateCategory}
                    onSaveTransactions={(v) => useTransactionStore.getState().setTransactions(v)}
                  />
                }
              />
              <Route
                path="/budget"
                element={
                  <BudgetPage
                    budgets={budgets}
                    onSave={setBudgets}
                    summary={summary}
                    settings={settings}
                    rentalProperties={rentalProperties}
                  />
                }
              />
              <Route
                path="/debt"
                element={<DebtTracker debts={debts} onSave={setDebts} settings={settings} />}
              />
              <Route
                path="/advisor"
                element={
                  <AIAdvisor summary={summary} debts={debts} settings={settings} rentalProperties={rentalProperties} />
                }
              />
              <Route
                path="/import"
                element={
                  <ImportPage
                    transactions={transactions}
                    onImport={importTransactions}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    settings={settings}
                    onSave={handleSaveSettings}
                    onClearData={handleClearAll}
                    onOpenWizard={() => setWizardOpen(true)}
                    themeSetting={themeSetting}
                    branding={branding}
                    onSaveBranding={handleSaveBranding}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <ThemeSwitcherPill />

      <FloatingChat
        summary={summary}
        debts={debts}
        settings={settings}
        onOpenWizard={() => setWizardOpen(true)}
      />

      {wizardOpen && (
        <SetupWizard
          onClose={() => { saveWizard({ completed: true }); setWizardOpen(false) }}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          summary={summary}
          rentalProperties={rentalProperties}
          onSaveRentalProperties={saveRentalProperties}
          onSaveBudgets={setBudgets}
          budgets={budgets}
        />
      )}
    </div>
  )
}
