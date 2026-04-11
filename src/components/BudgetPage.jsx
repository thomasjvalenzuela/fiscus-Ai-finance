import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Check, X, Sparkles, Loader, ChevronDown, ChevronUp } from 'lucide-react'
import { catMeta, CATEGORIES } from '../lib/categories.js'
import { suggestBudgets } from '../lib/openai.js'

const fmt      = n => '$' + Math.abs(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = n => '$' + Math.abs(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

const CONF_COLOR = { high: 'var(--success)', medium: 'var(--warning)', low: 'var(--danger)' }
const CONF_BG    = { high: 'rgba(59,197,122,0.12)', medium: 'rgba(247,183,49,0.12)', low: 'rgba(255,107,107,0.12)' }

export default function BudgetPage({ budgets, onSave, summary, settings, rentalProperties = [] }) {
  const [editing,   setEditing]   = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [newBudget, setNewBudget] = useState({ category: 'Groceries', limit: '' })

  // AI Generate state
  const [generating,  setGenerating]  = useState(false)
  const [aiError,     setAiError]     = useState('')
  const [suggestions, setSuggestions] = useState(null)   // [{ category, suggested, reasoning, confidence }]
  const [expanded,    setExpanded]    = useState(null)   // expanded reasoning card
  const [editAmounts, setEditAmounts] = useState({})     // category → overridden amount

  const spent = cat => summary.byCat?.[cat] ?? 0

  // ── Manual CRUD ─────────────────────────────────────────────────────────────
  const addBudget = () => {
    if (!newBudget.limit) return
    onSave([...budgets.filter(b => b.category !== newBudget.category), { category: newBudget.category, limit: parseFloat(newBudget.limit) }])
    setShowAdd(false)
    setNewBudget({ category: 'Groceries', limit: '' })
  }
  const deleteBudget = cat => onSave(budgets.filter(b => b.category !== cat))
  const saveEdit = () => {
    if (!editing?.limit) return
    onSave(budgets.map(b => b.category === editing.category ? { ...b, limit: parseFloat(editing.limit) } : b))
    setEditing(null)
  }

  // ── AI Generate ──────────────────────────────────────────────────────────────
  const runAI = useCallback(async () => {
    if (!settings?.openaiKey) { setAiError('Add your OpenAI API key in Settings first.'); return }
    setAiError(''); setGenerating(true); setSuggestions(null)
    try {
      const results = await suggestBudgets(summary, rentalProperties, settings.openaiKey, settings.openaiModel || 'gpt-4o-mini')
      const amounts = {}
      results.forEach(r => { amounts[r.category] = r.suggested })
      setEditAmounts(amounts)
      setSuggestions(results)
    } catch (e) {
      setAiError(e.message)
    } finally {
      setGenerating(false)
    }
  }, [settings, summary, rentalProperties])

  const applyOne = cat => {
    const amt = parseFloat(editAmounts[cat] || 0)
    if (!amt) return
    onSave([...budgets.filter(b => b.category !== cat), { category: cat, limit: amt }])
    setSuggestions(prev => prev?.filter(s => s.category !== cat))
  }

  const applyAll = () => {
    const map = Object.fromEntries(budgets.map(b => [b.category, b.limit]))
    suggestions?.forEach(s => { const a = parseFloat(editAmounts[s.category] || s.suggested); if (a) map[s.category] = a })
    onSave(Object.entries(map).map(([category, limit]) => ({ category, limit })))
    setSuggestions(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const PAGE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.18 } }
  return (
    <motion.div {...PAGE} className="p-4 sm:p-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Budget Tracker</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Set monthly limits per category</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={runAI}
            disabled={generating}
            className="btn-ghost flex items-center gap-1.5 text-sm disabled:opacity-50"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
          >
            {generating ? <Loader size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating…' : 'AI Generate'}
          </button>
          <button onClick={() => setShowAdd(v => !v)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={13} /> Add Budget
          </button>
        </div>
      </div>

      {/* AI error */}
      {aiError && (
        <p className="text-sm rounded-xl p-3 mb-4" style={{ color: 'var(--danger)', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}>
          {aiError}
        </p>
      )}

      {/* AI Suggestions panel */}
      {suggestions && suggestions.length > 0 && (
        <div className="card p-5 mb-5" style={{ border: '1px solid var(--primary)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} /> AI Budget Suggestions
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Based on your historical spending — edit any amount before applying
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={applyAll} className="btn-primary text-xs">Apply All</button>
              <button onClick={() => setSuggestions(null)} className="btn-ghost text-xs"><X size={13} /></button>
            </div>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {suggestions.map(s => {
              const meta       = catMeta(s.category)
              const isExpanded = expanded === s.category
              return (
                <div key={s.category} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.category}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Historical avg: {fmtShort(spent(s.category))}/mo
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: CONF_BG[s.confidence], color: CONF_COLOR[s.confidence] }}>
                      {s.confidence}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        className="input w-20 text-xs py-1 text-right"
                        value={editAmounts[s.category] ?? s.suggested}
                        onChange={e => setEditAmounts(prev => ({ ...prev, [s.category]: e.target.value }))}
                      />
                    </div>
                    <button onClick={() => applyOne(s.category)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(59,197,122,0.12)', color: 'var(--success)' }}>
                      <Check size={13} />
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : s.category)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 text-xs italic" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      💡 {s.reasoning}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Manual add form */}
      {showAdd && (
        <div className="card p-4 mb-4 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Category</label>
            <select className="input" value={newBudget.category} onChange={e => setNewBudget(v => ({ ...v, category: e.target.value }))}>
              {CATEGORIES.filter(c => !['Transfer / Internal','Skip / Uncategorized'].includes(c)).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Monthly Limit ($)</label>
            <input className="input" type="number" placeholder="500" value={newBudget.limit} onChange={e => setNewBudget(v => ({ ...v, limit: e.target.value }))} />
          </div>
          <button onClick={addBudget} className="btn-primary"><Check size={16} /></button>
          <button onClick={() => setShowAdd(false)} className="btn-ghost"><X size={16} /></button>
        </div>
      )}

      {/* Empty state */}
      {budgets.length === 0 && !suggestions && (
        <div className="card p-12 text-center">
          <Sparkles size={28} className="mx-auto mb-3" style={{ color: 'var(--primary)', opacity: 0.5 }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No budgets yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Let AI suggest limits based on your spending history, or add one manually.
          </p>
          <button onClick={runAI} disabled={generating} className="btn-primary mx-auto flex items-center gap-2 disabled:opacity-50">
            {generating ? <Loader size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating…' : 'AI Generate Budgets'}
          </button>
        </div>
      )}

      {/* Budget list */}
      {budgets.length > 0 && (
        <div className="space-y-3">
          {budgets.map(b => {
            const meta     = catMeta(b.category)
            const spentAmt = spent(b.category)
            const pct      = Math.min((spentAmt / b.limit) * 100, 100)
            const over     = spentAmt > b.limit
            const isEditing= editing?.category === b.category
            return (
              <div key={b.category} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input className="input w-24 py-1 text-xs" type="number" value={editing.limit}
                          onChange={e => setEditing(v => ({ ...v, limit: e.target.value }))} />
                        <button onClick={saveEdit} style={{ color: 'var(--success)' }}><Check size={14} /></button>
                        <button onClick={() => setEditing(null)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-mono font-semibold" style={{ color: over ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {fmtShort(spentAmt)} / {fmtShort(b.limit)}
                        </span>
                        <button onClick={() => setEditing({ category: b.category, limit: b.limit })} style={{ color: 'var(--text-muted)' }}><Edit2 size={13} /></button>
                        <button onClick={() => deleteBudget(b.category)} style={{ color: 'var(--text-muted)' }}><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: over ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : meta.color }} />
                </div>
                <div className="flex justify-between mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{pct.toFixed(0)}% used</span>
                  <span style={{ color: over ? 'var(--danger)' : 'var(--success)' }}>
                    {over ? `${fmt(spentAmt - b.limit)} over` : `${fmt(b.limit - spentAmt)} remaining`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
