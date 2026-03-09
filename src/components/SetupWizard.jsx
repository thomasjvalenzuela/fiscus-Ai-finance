import { useState, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Plus, Trash2, Sparkles, Home, Building2, Eye, EyeOff, Wand2, AlertCircle } from 'lucide-react'
import { suggestBudgets } from '../lib/openai.js'
import { catMeta } from '../lib/categories.js'

const STEPS = [
  { id: 'welcome',    label: 'Welcome' },
  { id: 'api',        label: 'AI Setup' },
  { id: 'rental',     label: 'Properties' },
  { id: 'budget',     label: 'Budget' },
  { id: 'done',       label: 'Done' },
]

const BLANK_PROPERTY = { id: '', address: '', tenant: '', monthlyRent: '', mortgage: '', purchasePrice: '', notes: '' }

export default function SetupWizard({ onClose, settings, onSaveSettings, summary, rentalProperties, onSaveRentalProperties, onSaveBudgets, budgets }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...settings })
  const [showKey, setShowKey] = useState(false)
  const [properties, setProperties] = useState(rentalProperties)
  const [showAddProp, setShowAddProp] = useState(false)
  const [propForm, setPropForm] = useState(BLANK_PROPERTY)
  const [editPropId, setEditPropId] = useState(null)

  // Budget suggestion state
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState(null) // null = not loaded, [] = loaded
  const [suggestError, setSuggestError] = useState('')
  const [pendingBudgets, setPendingBudgets] = useState([]) // { category, suggested, reasoning, approved, edited }

  const hasTxData = (summary?.txCount ?? 0) > 0

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1))
  const prev = () => setStep(s => Math.max(0, s - 1))

  const saveAndNext = () => {
    onSaveSettings(form)
    next()
  }

  // ── Rental properties ──────────────────────────────────────────────────────
  const addOrUpdateProp = () => {
    if (!propForm.address) return
    const prop = {
      ...propForm,
      id: editPropId ?? Date.now().toString(),
      monthlyRent: parseFloat(propForm.monthlyRent) || 0,
      mortgage: parseFloat(propForm.mortgage) || 0,
      purchasePrice: parseFloat(propForm.purchasePrice) || 0,
    }
    if (editPropId) {
      setProperties(ps => ps.map(p => p.id === editPropId ? prop : p))
      setEditPropId(null)
    } else {
      setProperties(ps => [...ps, prop])
    }
    setPropForm(BLANK_PROPERTY)
    setShowAddProp(false)
  }

  const startEditProp = (p) => {
    setPropForm({ ...p, monthlyRent: p.monthlyRent.toString(), mortgage: p.mortgage.toString(), purchasePrice: (p.purchasePrice || '').toString() })
    setEditPropId(p.id)
    setShowAddProp(true)
  }

  const deleteProp = (id) => setProperties(ps => ps.filter(p => p.id !== id))

  const saveRentalAndNext = () => {
    onSaveRentalProperties(properties)
    next()
  }

  // ── Budget suggestions ─────────────────────────────────────────────────────
  const loadSuggestions = useCallback(async () => {
    if (!form.openaiKey) { setSuggestError('No API key — enter it in the AI Setup step.'); return }
    if (!hasTxData) { setSuggestError('No transaction data yet — import your CSV first, then re-run the wizard.'); return }
    setLoadingSuggestions(true); setSuggestError('')
    try {
      const results = await suggestBudgets(summary, properties, form.openaiKey, form.openaiModel || 'gpt-4o-mini')
      setSuggestions(results)
      setPendingBudgets(results.map(r => ({ ...r, approved: false, edited: r.suggested })))
    } catch (e) {
      setSuggestError(e.message)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [form.openaiKey, form.openaiModel, summary, properties, hasTxData])

  const approveBudget = (i, approved) => setPendingBudgets(prev => prev.map((b, idx) => idx === i ? { ...b, approved } : b))
  const approveAll = () => setPendingBudgets(prev => prev.map(b => ({ ...b, approved: true })))
  const editLimit = (i, val) => setPendingBudgets(prev => prev.map((b, idx) => idx === i ? { ...b, edited: parseFloat(val) || 0 } : b))

  const saveBudgetsAndFinish = () => {
    const approved = pendingBudgets.filter(b => b.approved)
    if (approved.length) {
      const existing = budgets.filter(b => !approved.find(a => a.category === b.category))
      onSaveBudgets([...existing, ...approved.map(b => ({ category: b.category, limit: b.edited }))])
    }
    next()
  }

  const CONF_COLOR = { high: '#2dd4a0', medium: '#f0a040', low: '#f06080' }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-xl bg-[#111118] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
              <Wand2 size={16} className="text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Setup Wizard</h2>
              <p className="text-[11px] text-white/35">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.04] shrink-0">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── STEP 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">👋</div>
              <div>
                <h3 className="text-xl font-semibold">Welcome to Fiscus</h3>
                <p className="text-sm text-white/50 mt-2 max-w-sm mx-auto">
                  This wizard helps you set up your dashboard in a few minutes. You can re-run it anytime from Settings to update your configuration.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left mt-6">
                {[
                  ['🔑', 'Connect OpenAI', 'For AI categorization, budget suggestions, and your finance advisor'],
                  ['🏠', 'Rental Properties', 'Track rental income, mortgages, and property financials'],
                  ['💰', 'Smart Budgets', 'AI analyzes your history and suggests realistic monthly limits'],
                  ['💬', 'Floating Advisor', 'Ask questions anytime from the chat button (bottom right)'],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                    <div className="text-lg mb-1.5">{icon}</div>
                    <div className="text-xs font-medium text-white/80">{title}</div>
                    <div className="text-[11px] text-white/35 mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: API Key ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-base mb-1">Connect OpenAI</h3>
                <p className="text-sm text-white/45">Required for AI categorization, budget suggestions, and the advisor chat. Your key is stored only in your browser — never sent anywhere except OpenAI.</p>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">OpenAI API Key</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={form.openaiKey}
                    onChange={e => setForm(f => ({ ...f, openaiKey: e.target.value }))}
                    autoComplete="off"
                  />
                  <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-white/25 mt-1.5">
                  Get yours at <span className="text-accent">platform.openai.com/api-keys</span>
                </p>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Model</label>
                <select className="input" value={form.openaiModel} onChange={e => setForm(f => ({ ...f, openaiModel: e.target.value }))}>
                  <option value="gpt-4o-mini">gpt-4o-mini (fast, cheap — recommended)</option>
                  <option value="gpt-4o">gpt-4o (smarter, costs more)</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                </select>
              </div>
              {form.openaiKey && (
                <div className="flex items-center gap-2 text-[#2dd4a0] text-xs bg-[#2dd4a0]/10 border border-[#2dd4a0]/20 rounded-xl p-3">
                  <Check size={13} /> API key entered — you can skip if you'll add it later
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Rental Properties ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base mb-1">Rental Properties</h3>
                <p className="text-sm text-white/45">Add your rental properties to track income, mortgage, and expenses per property. Skip if you don't have any.</p>
              </div>

              {/* Add/edit form */}
              {showAddProp && (
                <div className="card p-4 space-y-3">
                  <h4 className="text-sm font-medium">{editPropId ? 'Edit Property' : 'Add Property'}</h4>
                  <div>
                    <label className="text-[11px] text-white/40 mb-1 block">Address / Label *</label>
                    <input className="input text-sm" placeholder="e.g. 123 Oak St, Minneapolis MN" value={propForm.address} onChange={e => setPropForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/40 mb-1 block">Tenant Name</label>
                      <input className="input text-sm" placeholder="Optional" value={propForm.tenant} onChange={e => setPropForm(f => ({ ...f, tenant: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 mb-1 block">Monthly Rent ($)</label>
                      <input className="input text-sm" type="number" placeholder="1200" value={propForm.monthlyRent} onChange={e => setPropForm(f => ({ ...f, monthlyRent: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 mb-1 block">Mortgage Payment ($)</label>
                      <input className="input text-sm" type="number" placeholder="850" value={propForm.mortgage} onChange={e => setPropForm(f => ({ ...f, mortgage: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/40 mb-1 block">Purchase Price ($)</label>
                      <input className="input text-sm" type="number" placeholder="180000" value={propForm.purchasePrice} onChange={e => setPropForm(f => ({ ...f, purchasePrice: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/40 mb-1 block">Notes</label>
                    <input className="input text-sm" placeholder="Optional notes" value={propForm.notes} onChange={e => setPropForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addOrUpdateProp} disabled={!propForm.address} className="btn-primary text-xs disabled:opacity-40">{editPropId ? 'Save' : 'Add Property'}</button>
                    <button onClick={() => { setShowAddProp(false); setEditPropId(null); setPropForm(BLANK_PROPERTY) }} className="btn-ghost text-xs">Cancel</button>
                  </div>
                </div>
              )}

              {/* Property list */}
              {properties.length === 0 && !showAddProp ? (
                <div className="text-center py-8 text-white/25 text-sm flex flex-col items-center gap-3">
                  <Building2 size={32} className="opacity-30" />
                  No rental properties added yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {properties.map(p => (
                    <div key={p.id} className="card p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Home size={15} className="text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white/90 truncate">{p.address}</div>
                        {p.tenant && <div className="text-xs text-white/40 mt-0.5">Tenant: {p.tenant}</div>}
                        <div className="flex gap-4 mt-1.5 text-[11px]">
                          {p.monthlyRent > 0 && <span className="text-[#2dd4a0]">Rent: ${p.monthlyRent}/mo</span>}
                          {p.mortgage > 0 && <span className="text-[#f06080]">Mortgage: ${p.mortgage}/mo</span>}
                          {p.monthlyRent > 0 && p.mortgage > 0 && (
                            <span className={p.monthlyRent >= p.mortgage ? 'text-[#2dd4a0]' : 'text-[#f06080]'}>
                              CF: ${p.monthlyRent - p.mortgage}/mo
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditProp(p)} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white transition-colors">
                          <Plus size={12} className="rotate-45" />
                        </button>
                        <button onClick={() => deleteProp(p.id)} className="w-7 h-7 rounded-lg hover:bg-[#f06080]/10 flex items-center justify-center text-white/30 hover:text-[#f06080] transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!showAddProp && (
                <button onClick={() => { setShowAddProp(true); setEditPropId(null); setPropForm(BLANK_PROPERTY) }}
                  className="w-full py-3 rounded-xl border border-dashed border-white/[0.1] hover:border-accent/40 text-sm text-white/40 hover:text-accent transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} /> Add a rental property
                </button>
              )}
            </div>
          )}

          {/* ── STEP 3: Budget Suggestions ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base mb-1">AI Budget Suggestions</h3>
                <p className="text-sm text-white/45">
                  {hasTxData
                    ? `Based on your ${summary.txCount} transactions, AI will suggest realistic monthly limits. Approve the ones you want.`
                    : 'No transaction data yet — import your CSV first to get AI-powered budget suggestions.'}
                </p>
              </div>

              {!hasTxData && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f0a040]/10 border border-[#f0a040]/20">
                  <AlertCircle size={15} className="text-[#f0a040] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#f0a040]">Import your Firefly III CSV first, then re-run this wizard to get personalized budget suggestions.</p>
                </div>
              )}

              {hasTxData && !suggestions && (
                <button
                  onClick={loadSuggestions}
                  disabled={loadingSuggestions || !form.openaiKey}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {loadingSuggestions
                    ? <><span className="animate-spin">⚙</span> Analyzing your spending…</>
                    : <><Sparkles size={15} /> Generate Budget Suggestions</>
                  }
                </button>
              )}

              {!form.openaiKey && hasTxData && (
                <p className="text-xs text-[#f0a040]">Go back to AI Setup and add your OpenAI key first.</p>
              )}

              {suggestError && <p className="text-xs text-[#f06080] bg-[#f06080]/10 border border-[#f06080]/20 rounded-xl p-3">{suggestError}</p>}

              {suggestions && pendingBudgets.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{pendingBudgets.filter(b => b.approved).length} / {pendingBudgets.length} approved</span>
                    <button onClick={approveAll} className="text-xs text-accent hover:opacity-80 flex items-center gap-1"><Check size={12} /> Approve all</button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {pendingBudgets.map((b, i) => {
                      const meta = catMeta(b.category)
                      return (
                        <div key={b.category} className={`card p-3 flex items-center gap-3 transition-colors ${b.approved ? 'border-[#2dd4a0]/20 bg-[#2dd4a0]/5' : ''}`}>
                          <span className="text-base shrink-0">{meta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white/80">{b.category}</div>
                            <div className="text-[10px] text-white/35 mt-0.5 truncate" title={b.reasoning}>{b.reasoning}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: (CONF_COLOR[b.confidence] || '#64748b') + '20', color: CONF_COLOR[b.confidence] || '#64748b' }}>
                              {b.confidence}
                            </span>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40">$</span>
                              <input
                                type="number"
                                className="input w-20 pl-5 py-1 text-xs"
                                value={b.edited}
                                onChange={e => editLimit(i, e.target.value)}
                              />
                            </div>
                            <button
                              onClick={() => approveBudget(i, !b.approved)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                b.approved ? 'bg-[#2dd4a0]/20 text-[#2dd4a0]' : 'bg-white/[0.05] text-white/30 hover:text-white'
                              }`}
                            >
                              <Check size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 4 && (
            <div className="text-center space-y-5 py-4">
              <div className="text-5xl">🎉</div>
              <div>
                <h3 className="text-xl font-semibold">You're all set!</h3>
                <p className="text-sm text-white/50 mt-2 max-w-sm mx-auto">
                  Your dashboard is configured. You can always re-run this wizard from Settings, or update any values directly in the relevant pages.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 text-left max-w-xs mx-auto">
                {[
                  ['Import Data', 'Drop your Firefly III CSV to load transactions'],
                  ['Review', 'AI-categorize and approve transactions'],
                  ['💬 Chat button', 'Ask your advisor anything, anytime'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-2 text-xs text-white/50">
                    <Check size={12} className="text-[#2dd4a0] shrink-0 mt-0.5" />
                    <span><span className="text-white/70 font-medium">{title}</span> — {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer navigation */}
        <div className="border-t border-white/[0.06] px-6 py-4 flex items-center justify-between shrink-0">
          <button onClick={prev} disabled={step === 0} className="btn-ghost flex items-center gap-1.5 disabled:opacity-0">
            <ChevronLeft size={15} /> Back
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-accent' : i < step ? 'bg-accent/40' : 'bg-white/[0.1]'}`} />
            ))}
          </div>

          {step === 0 && <button onClick={next} className="btn-primary flex items-center gap-1.5">Get Started <ChevronRight size={15} /></button>}
          {step === 1 && <button onClick={saveAndNext} className="btn-primary flex items-center gap-1.5">{form.openaiKey ? 'Save & Continue' : 'Skip'} <ChevronRight size={15} /></button>}
          {step === 2 && <button onClick={saveRentalAndNext} className="btn-primary flex items-center gap-1.5">{properties.length ? 'Save & Continue' : 'Skip'} <ChevronRight size={15} /></button>}
          {step === 3 && (
            <button onClick={saveBudgetsAndFinish} className="btn-primary flex items-center gap-1.5">
              {pendingBudgets.some(b => b.approved) ? `Save ${pendingBudgets.filter(b => b.approved).length} Budgets` : 'Skip'} <ChevronRight size={15} />
            </button>
          )}
          {step === 4 && <button onClick={onClose} className="btn-primary flex items-center gap-1.5">Open Dashboard <ChevronRight size={15} /></button>}
        </div>
      </div>
    </div>
  )
}
