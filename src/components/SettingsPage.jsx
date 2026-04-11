import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Save, Trash2, Plus, X, Tag, Sparkles, Palette, Image } from 'lucide-react'
import { CATEGORIES } from '../lib/categories.js'
import { PALETTES } from '../lib/palettes.js'
import { useSettingsStore } from '../stores/useSettingsStore.js'
import { ThemeStylePicker } from './ThemeSwitcher.jsx'

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']

export default function SettingsPage({
  settings, onSave, onClearData, onOpenWizard, themeSetting,
  branding = {}, onSaveBranding,
}) {
  const [form,         setForm]         = useState(settings)
  const [showKey,      setShowKey]      = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  // Branding form
  const [brand, setBrand] = useState({
    appName: 'Fiscus',
    tagline: 'AI-Powered Finance',
    logoUrl: '',
    palette: 'forest',
    ...branding,
  })

  // Custom rules
  const [newRule,     setNewRule]     = useState({ keyword: '', category: 'Debt Payment' })
  const [showAddRule, setShowAddRule] = useState(false)

  const { getMerchantRules, saveMerchantRules } = useSettingsStore()
  // Merchant rules
  const [merchantRules, setMerchantRules] = useState(() => getMerchantRules())
  useEffect(() => { setMerchantRules(getMerchantRules()) }, [getMerchantRules])

  const save = () => {
    const safeBrand = {
      ...brand,
      logoUrl: brand.logoUrl && brand.logoUrl.startsWith('https://') ? brand.logoUrl : '',
    }
    onSave(form)
    onSaveBranding?.(safeBrand)
    setBrand(safeBrand)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addRule = () => {
    if (!newRule.keyword.trim()) return
    setForm(f => ({ ...f, customRules: [...(f.customRules || []), { keyword: newRule.keyword.trim().toUpperCase(), category: newRule.category }] }))
    setNewRule({ keyword: '', category: 'Debt Payment' })
    setShowAddRule(false)
  }
  const removeCustomRule = i => setForm(f => ({ ...f, customRules: f.customRules.filter((_, idx) => idx !== i) }))

  const removeMerchantRule = keyword => {
    const updated = merchantRules.filter(r => r.keyword !== keyword)
    saveMerchantRules(updated)
    setMerchantRules(updated)
  }
  const updateMerchantRuleCategory = (keyword, newCat) => {
    const updated = merchantRules.map(r => r.keyword === keyword ? { ...r, category: newCat } : r)
    saveMerchantRules(updated)
    setMerchantRules(updated)
  }

  const PAGE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.18 } }
  return (
    <motion.div {...PAGE} className="p-4 sm:p-6 max-w-xl space-y-6">

      {/* ── Branding ─────────────────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Palette size={14} style={{ color: 'var(--primary)' }} />
          Branding
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>App Name</label>
            <input
              className="input"
              placeholder="Fiscus"
              value={brand.appName}
              onChange={e => setBrand(b => ({ ...b, appName: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Tagline</label>
            <input
              className="input"
              placeholder="AI-Powered Finance"
              value={brand.tagline}
              onChange={e => setBrand(b => ({ ...b, tagline: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
            Logo URL <span style={{ opacity: 0.5 }}>(optional — leave blank for default icon)</span>
          </label>
          <div className="flex gap-2 items-center">
            <input
              className="input flex-1"
              placeholder="https://example.com/logo.png"
              value={brand.logoUrl}
              onChange={e => setBrand(b => ({ ...b, logoUrl: e.target.value }))}
            />
            {brand.logoUrl && brand.logoUrl.startsWith('https://') && (
              <img
                src={brand.logoUrl}
                alt="Logo preview"
                className="w-8 h-8 rounded-lg object-cover shrink-0 border"
                style={{ borderColor: 'var(--border)' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
          </div>
          {brand.logoUrl && !brand.logoUrl.startsWith('https://') && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>
              Logo URL must start with https://
            </p>
          )}
        </div>

        <div>
          <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Color Palette</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PALETTES.map(p => (
              <button
                key={p.id}
                title={p.name}
                onClick={() => setBrand(b => ({ ...b, palette: p.id }))}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className="w-8 h-8 rounded-xl transition-all"
                  style={{
                    background: p.swatch,
                    outline: brand.palette === p.id ? `3px solid ${p.swatch}` : '3px solid transparent',
                    outlineOffset: 2,
                    transform: brand.palette === p.id ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
                <span className="text-[10px] leading-none" style={{ color: 'var(--text-muted)' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── OpenAI ───────────────────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>OpenAI Integration</h3>

        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>API Key</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={form.openaiKey}
              onChange={e => setForm(f => ({ ...f, openaiKey: e.target.value }))}
            />
            <button
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Stored locally in your browser. Only sent directly to OpenAI. Use a key with a spend limit and regenerate it periodically.
          </p>
        </div>

        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Model</label>
          <select className="input" value={form.openaiModel} onChange={e => setForm(f => ({ ...f, openaiModel: e.target.value }))}>
            {MODELS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── Theme Style ──────────────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          Theme Style
        </h3>
        <ThemeStylePicker />
      </div>

      {/* ── Display ──────────────────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Display</h3>
        <div>
          <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Transactions per page</label>
          <select className="input w-32" value={form.pageSize} onChange={e => setForm(f => ({ ...f, pageSize: parseInt(e.target.value) }))}>
            {[25, 50, 100, 200].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* ── Custom Keyword Rules ──────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Tag size={14} style={{ color: 'var(--primary)' }} />
              Custom Keyword Rules
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Applied on every import, before AI categorization.
            </p>
          </div>
          <button onClick={() => setShowAddRule(v => !v)} className="btn-ghost text-xs flex items-center gap-1">
            <Plus size={13} /> Add Rule
          </button>
        </div>

        <div className="text-xs rounded-xl px-3 py-2 flex items-start gap-2" style={{ background: 'var(--accent-light)', color: 'var(--primary)' }}>
          <Sparkles size={12} className="mt-0.5 shrink-0" />
          <span>
            Example: keyword <strong>ZELLE RENT</strong> → <strong>Housing</strong> will auto-tag all Zelle rent transfers as a housing expense.
          </span>
        </div>

        {showAddRule && (
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[11px] mb-1 block" style={{ color: 'var(--text-muted)' }}>Keyword</label>
              <input
                className="input text-xs"
                placeholder="e.g. ZELLE MADISON"
                value={newRule.keyword}
                onChange={e => setNewRule(v => ({ ...v, keyword: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addRule()}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[11px] mb-1 block" style={{ color: 'var(--text-muted)' }}>Assign Category</label>
              <select className="input text-xs" value={newRule.category} onChange={e => setNewRule(v => ({ ...v, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={addRule} className="btn-primary text-xs py-2">Save</button>
            <button onClick={() => setShowAddRule(false)} className="btn-ghost text-xs py-2"><X size={13} /></button>
          </div>
        )}

        {(form.customRules || []).length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>No custom rules yet.</p>
        ) : (
          <div className="space-y-1.5">
            {(form.customRules || []).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs rounded-xl px-3 py-2" style={{ background: 'var(--bg)' }}>
                <code className="flex-1 font-mono" style={{ color: 'var(--primary)' }}>{r.keyword}</code>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--text-secondary)' }}>{r.category}</span>
                <button onClick={() => removeCustomRule(i)} style={{ color: 'var(--text-muted)' }}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Merchant Rules ────────────────────────────────────────────────────── */}
      {merchantRules.length > 0 && (
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sparkles size={14} style={{ color: 'var(--primary)' }} />
              Learned Merchant Rules
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Saved when you approved AI categories in the Review tab. Auto-applied on future imports.
            </p>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {merchantRules.map(r => (
              <div key={r.keyword} className="flex items-center gap-2 text-xs rounded-xl px-3 py-2" style={{ background: 'var(--bg)' }}>
                <code className="font-mono truncate flex-1" style={{ color: 'var(--primary)' }}>{r.keyword}</code>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <select
                  className="text-xs border-0 bg-transparent font-medium pr-1"
                  style={{ color: 'var(--text-secondary)', outline: 'none' }}
                  value={r.category}
                  onChange={e => updateMerchantRuleCategory(r.keyword, e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button onClick={() => removeMerchantRule(r.keyword)} style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Setup Wizard ─────────────────────────────────────────────────────── */}
      {onOpenWizard && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Setup Wizard</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Re-run the wizard to update rental properties, budget suggestions, or your API key.
          </p>
          <button onClick={onOpenWizard} className="btn-ghost text-sm flex items-center gap-2">
            <Sparkles size={14} /> Run Setup Wizard
          </button>
        </div>
      )}

      {/* ── Save ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button onClick={save} className="btn-primary flex items-center gap-2">
          <Save size={14} /> {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>

      {/* ── Danger zone ──────────────────────────────────────────────────────── */}
      <div className="card p-5" style={{ borderColor: 'rgba(255,107,107,0.2)' }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--danger)' }}>Danger Zone</h3>
        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)} className="text-sm flex items-center gap-2" style={{ color: 'var(--danger)' }}>
            <Trash2 size={14} /> Clear all data
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This deletes all transactions, budgets, and debts. Are you sure?
            </p>
            <button onClick={() => { onClearData(); setConfirmClear(false) }} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
              Yes, clear
            </button>
            <button onClick={() => setConfirmClear(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        )}
      </div>

    </motion.div>
  )
}
