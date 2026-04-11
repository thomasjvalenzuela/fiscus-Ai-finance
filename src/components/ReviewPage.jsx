import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { categorizeAllGroups } from '../lib/openai.js'
import { catMeta } from '../lib/categories.js'
import { CategoryPicker } from './CategoryChip.jsx'
import { findPossibleDuplicates } from '../lib/dedup.js'
import { extractKeyword } from '../lib/transferDetect.js'
import { useSettingsStore } from '../stores/useSettingsStore.js'
import {
  Sparkles, CheckCircle, X, AlertTriangle,
  ChevronDown, ChevronUp, Clock, RotateCcw, Tag,
} from 'lucide-react'

const fmt = n => {
  const abs = Math.abs(n || 0)
  return '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtEta = s => {
  if (s == null || s <= 0) return ''
  if (s < 60) return `~${s}s`
  return `~${Math.floor(s / 60)}m ${s % 60}s`
}

const CONF_COLOR = { high: 'var(--success)', medium: 'var(--warning)', low: 'var(--danger)' }
const CONF_BG    = {
  high:   'rgba(59,197,122,0.12)',
  medium: 'rgba(247,183,49,0.12)',
  low:    'rgba(255,107,107,0.12)',
}

/**
 * Group uncategorized transactions by cleaned keyword.
 * Sort by frequency descending (most common merchant first).
 */
function buildGroups(transactions) {
  const map = {}
  for (const tx of transactions) {
    const kw = (extractKeyword(tx.description) || tx.description.substring(0, 40))
      .toUpperCase()
      .trim()
      .substring(0, 50)
    if (!map[kw]) map[kw] = []
    map[kw].push(tx)
  }
  return Object.entries(map)
    .map(([keyword, txs]) => ({
      keyword,
      txs,
      count:       txs.length,
      total:       txs.reduce((s, t) => s + Math.abs(t.amount || 0), 0),
      // use the highest-value tx as representative for the API call
      representative: txs.reduce((best, t) =>
        Math.abs(t.amount || 0) > Math.abs(best.amount || 0) ? t : best, txs[0]),
    }))
    .sort((a, b) => b.count - a.count)
}

export default function ReviewPage({
  transactions,
  settings,
  onUpdateCategory,
  onSaveTransactions,
}) {
  const {
    getReviewProgress, saveReviewProgress, clearReviewProgress,
    getMerchantRules, saveMerchantRules,
  } = useSettingsStore()
  const [tab,       setTab]     = useState('ai')  // 'ai' | 'duplicates'
  const [phase,     setPhase]   = useState('idle') // 'idle' | 'running' | 'done'
  const [sugg,      setSugg]    = useState({})     // keyword → { category, confidence, approved }
  const [progress,  setProgress]= useState(null)   // { done, total, pct, eta }
  const [expanded,  setExpanded]= useState(null)   // keyword of open tx drawer
  const [error,     setError]   = useState('')
  const [resume,    setResume]  = useState(null)   // saved session to potentially restore
  const abortRef    = useRef()
  const emaRef      = useRef(null)   // EMA of batch duration in ms
  const partialRef  = useRef({})     // accumulates results batch-by-batch (safe across unmounts)

  // ── Derived data ───────────────────────────────────────────────────────────
  const uncategorized = useMemo(
    () => transactions.filter(t => !t.isTransfer && !t.category),
    [transactions],
  )
  const duplicates = useMemo(
    () => findPossibleDuplicates(transactions.filter(t => !t.isTransfer)),
    [transactions],
  )
  const groups = useMemo(() => buildGroups(uncategorized), [uncategorized])

  const pending      = useMemo(() => Object.entries(sugg).filter(([, s]) => !s.approved), [sugg])
  const approvedCount= useMemo(() => Object.values(sugg).filter(s => s.approved).length, [sugg])
  const pct          = progress?.pct ?? (phase === 'done' ? 1 : 0)
  const unlocked     = pct >= 0.8 || phase === 'done'

  // ── Resume saved progress on mount ─────────────────────────────────────────
  useEffect(() => {
    const saved = getReviewProgress()
    if (
      saved?.txCount === uncategorized.length &&
      Object.keys(saved.suggestions || {}).length > 0
    ) {
      setResume(saved)
    }
  }, []) // only on mount

  const applyResume = () => {
    setSugg(resume.suggestions)
    setPhase('done')
    setResume(null)
  }
  const discardResume = () => {
    clearReviewProgress()
    setResume(null)
  }

  // ── Run analysis ───────────────────────────────────────────────────────────
  const run = useCallback(async () => {
    if (!settings.openaiKey) {
      setError('Add your OpenAI API key in Settings first.')
      return
    }
    setError('')
    setPhase('running')
    setSugg({})
    emaRef.current   = null
    partialRef.current = {}
    abortRef.current = new AbortController()

    try {
      const results = await categorizeAllGroups(
        groups,
        settings.openaiKey,
        settings.openaiModel || 'gpt-4o-mini',
        // onProgress — update ETA bar
        (done, total, elapsed) => {
          emaRef.current = emaRef.current
            ? 0.3 * elapsed + 0.7 * emaRef.current
            : elapsed
          const etaSec = emaRef.current
            ? Math.round(emaRef.current * (total - done) / 1000)
            : null
          setProgress({ done, total, pct: done / total, eta: etaSec })
        },
        // onBatchComplete — stream suggestions into state + save progress after every batch
        // Uses a ref so localStorage save works even if user navigated away (component unmounted)
        (partial) => {
          // Accumulate into ref (always runs, even if component is unmounted)
          for (const [kw, v] of Object.entries(partial)) {
            if (!partialRef.current[kw]) partialRef.current[kw] = { ...v, approved: false }
          }
          // Persist to localStorage — works regardless of mount state
          saveReviewProgress({
            txCount: uncategorized.length,
            suggestions: { ...partialRef.current },
          })
          // Update state (no-op if unmounted — will resume from localStorage on next visit)
          setSugg({ ...partialRef.current })
        },
        abortRef.current.signal,
      )

      // Final pass: ensure any groups not yet in partialRef are added (e.g. if signal was aborted mid-batch)
      for (const [kw, v] of Object.entries(results)) {
        if (!partialRef.current[kw]) partialRef.current[kw] = { ...v, approved: false }
      }
      const finalSugg = { ...partialRef.current }
      setSugg(finalSugg)
      saveReviewProgress({ txCount: uncategorized.length, suggestions: finalSugg })
      setPhase('done')
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
      setPhase('idle')
    } finally {
      setProgress(null)
    }
  }, [groups, settings, uncategorized.length])

  // ── Approve / dismiss ──────────────────────────────────────────────────────
  const approveGroup = useCallback((keyword) => {
    const s     = sugg[keyword]
    const group = groups.find(g => g.keyword === keyword)
    if (!s || !group) return

    // Bulk-update all transactions in this keyword group
    const ids = new Set(group.txs.map(t => t.id))
    onSaveTransactions(
      transactions.map(t => ids.has(t.id) ? { ...t, category: s.category } : t),
    )

    // Persist merchant rule so future imports auto-categorize
    const rules = getMerchantRules()
    if (!rules.find(r => r.keyword === keyword)) {
      saveMerchantRules([
        ...rules,
        { keyword, category: s.category, createdAt: new Date().toISOString() },
      ])
    }

    const updated = { ...sugg, [keyword]: { ...s, approved: true } }
    setSugg(updated)
    saveReviewProgress({ txCount: uncategorized.length, suggestions: updated })
    if (expanded === keyword) setExpanded(null)
  }, [sugg, groups, transactions, onSaveTransactions, uncategorized.length, expanded])

  const approveAll = useCallback(() => {
    const pendingList = Object.entries(sugg).filter(([, s]) => !s.approved)
    if (!pendingList.length) return

    // Build a single id→category map then do one batch update
    const catMap = {}
    pendingList.forEach(([kw, s]) => {
      const group = groups.find(g => g.keyword === kw)
      if (group) group.txs.forEach(tx => { catMap[tx.id] = s.category })
    })
    onSaveTransactions(
      transactions.map(t => catMap[t.id] ? { ...t, category: catMap[t.id] } : t),
    )

    // Save all new merchant rules at once
    const rules    = getMerchantRules()
    const newRules = [...rules]
    pendingList.forEach(([kw, s]) => {
      if (!newRules.find(r => r.keyword === kw)) {
        newRules.push({ keyword: kw, category: s.category, createdAt: new Date().toISOString() })
      }
    })
    saveMerchantRules(newRules)

    const updated = Object.fromEntries(
      Object.entries(sugg).map(([kw, s]) => [kw, { ...s, approved: true }]),
    )
    setSugg(updated)
    saveReviewProgress({ txCount: uncategorized.length, suggestions: updated })
    setExpanded(null)
  }, [sugg, groups, transactions, onSaveTransactions, uncategorized.length])

  const dismiss = useCallback((keyword) => {
    const n = { ...sugg }
    delete n[keyword]
    setSugg(n)
    saveReviewProgress({ txCount: uncategorized.length, suggestions: n })
    if (expanded === keyword) setExpanded(null)
  }, [sugg, uncategorized.length, expanded])

  const changeCategory = (keyword, cat) => {
    setSugg(prev => ({ ...prev, [keyword]: { ...prev[keyword], category: cat } }))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const PAGE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.18 } }
  return (
    <motion.div {...PAGE} className="p-4 sm:p-6">

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg)' }}>
        {[
          ['ai',         `AI Categorize (${uncategorized.length})`],
          ['duplicates', `Duplicates (${duplicates.length})`],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              tab === id
                ? { background: 'var(--primary)', color: '#fff' }
                : { color: 'var(--text-muted)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── AI TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'ai' && (
        <div className="space-y-4 max-w-3xl">

          {/* Resume banner */}
          {resume && (
            <div
              className="card p-4 flex items-center gap-4"
              style={{ border: '1px solid var(--primary)' }}
            >
              <RotateCcw size={18} style={{ color: 'var(--primary)' }} className="shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Resume previous session?
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {Object.keys(resume.suggestions).length} keyword groups already analyzed ·{' '}
                  {uncategorized.length} uncategorized transactions
                </p>
              </div>
              <button onClick={applyResume}   className="btn-primary text-xs">Resume</button>
              <button onClick={discardResume} className="btn-ghost text-xs">Start over</button>
            </div>
          )}

          {/* Control panel */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  AI Batch Categorization
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{groups.length}</strong> unique
                  merchants · {uncategorized.length} transactions · sorted most-common first ·
                  approve in bulk or one-by-one
                </p>
              </div>
              {phase === 'running' ? (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="btn-ghost shrink-0"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={run}
                  disabled={!uncategorized.length || !!resume}
                  className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-40"
                >
                  <Sparkles size={14} /> Analyze
                </button>
              )}
            </div>

            {/* Progress bar + ETA */}
            {phase === 'running' && progress && (
              <div className="mt-4">
                <div
                  className="flex justify-between text-xs mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} />
                    Batch {progress.done}/{progress.total} &middot; {groups.length} merchant groups
                  </span>
                  <span className="flex items-center gap-2">
                    {progress.eta != null && (
                      <span style={{ color: 'var(--warning)' }}>{fmtEta(progress.eta)} remaining</span>
                    )}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {Math.round(pct * 100)}%
                    </span>
                  </span>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ height: 6, background: 'var(--border)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct * 100}%`, background: 'var(--primary)' }}
                  />
                </div>
                {!unlocked ? (
                  <p
                    className="text-[11px] mt-2 text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    🔒 Review unlocks at 80% — {Math.round(pct * 100)}% done
                  </p>
                ) : (
                  <p
                    className="text-[11px] mt-2 text-center"
                    style={{ color: 'var(--success)' }}
                  >
                    ✓ Review unlocked — you can approve suggestions while analysis finishes
                  </p>
                )}
              </div>
            )}

            {/* Stats row when done */}
            {phase === 'done' && Object.keys(sugg).length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ['Pending',   pending.length,             'var(--primary)'],
                  ['Approved',  approvedCount,               'var(--success)'],
                  ['Groups',    Object.keys(sugg).length,   'var(--text-primary)'],
                ].map(([label, val, color]) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--bg)' }}
                  >
                    <div
                      className="font-mono text-sm font-bold"
                      style={{ color }}
                    >
                      {val}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-sm rounded-xl p-3"
              style={{
                color:      'var(--danger)',
                background: 'rgba(255,107,107,0.08)',
                border:     '1px solid rgba(255,107,107,0.2)',
              }}
            >
              {error}
            </p>
          )}

          {/* Locked: running but < 80% */}
          {phase === 'running' && !unlocked && (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Review unlocks at 80%
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Analysis is running — keep this tab open to save progress automatically
              </p>
            </div>
          )}

          {/* Suggestions list (unlocked at 80% or done) */}
          {unlocked && pending.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {pending.length} group{pending.length !== 1 ? 's' : ''} pending ·{' '}
                  click ↓ to see all affected transactions
                </span>
                <button
                  onClick={approveAll}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <CheckCircle size={12} /> Approve All
                </button>
              </div>

              {pending.map(([keyword, s]) => {
                const group = groups.find(g => g.keyword === keyword)
                if (!group) return null
                const meta       = catMeta(s.category)
                const isExpanded = expanded === keyword

                return (
                  <div key={keyword} className="card overflow-hidden">

                    {/* ── Group header ── */}
                    <div className="p-4 flex items-center gap-3">
                      {/* Category icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: meta.color + '20' }}
                      >
                        {meta.icon}
                      </div>

                      {/* Keyword + badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[13px] font-semibold font-mono"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {keyword}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                            style={{ background: 'var(--primary)' }}
                          >
                            {group.count} tx
                          </span>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: CONF_BG[s.confidence],
                              color:      CONF_COLOR[s.confidence],
                            }}
                          >
                            {s.confidence}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Total: {fmt(group.total)} ·
                          avg {fmt(group.total / group.count)}/tx
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <CategoryPicker
                          value={s.category}
                          onChange={cat => changeCategory(keyword, cat)}
                        />
                        <button
                          onClick={() => approveGroup(keyword)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(59,197,122,0.12)', color: 'var(--success)' }}
                          title={`Approve "${s.category}" for all ${group.count} transactions`}
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button
                          onClick={() => dismiss(keyword)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                          style={{ color: 'var(--text-muted)' }}
                          title="Dismiss"
                        >
                          <X size={15} />
                        </button>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : keyword)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                          style={{ color: 'var(--text-muted)' }}
                          title={isExpanded ? 'Collapse' : 'Show affected transactions'}
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* ── Expanded: full transaction list ── */}
                    {isExpanded && (
                      <div
                        className="border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                      >
                        {/* Section label */}
                        <div className="px-4 py-2.5">
                          <span
                            className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Tag size={10} />
                            All {group.count} transactions that will be tagged as &ldquo;{s.category}&rdquo;
                          </span>
                        </div>

                        {/* Transaction rows */}
                        <div
                          className="overflow-y-auto"
                          style={{ maxHeight: 220 }}
                        >
                          {group.txs.map(tx => (
                            <div
                              key={tx.id}
                              className="flex items-center gap-3 px-4 py-2 border-b last:border-0"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-xs truncate"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {tx.description}
                                </div>
                                <div
                                  className="text-[10px] mt-0.5"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {tx.date} · {tx.account}
                                </div>
                              </div>
                              <span
                                className="font-mono text-xs shrink-0"
                                style={{
                                  color: tx.amount < 0 ? 'var(--danger)' : 'var(--success)',
                                }}
                              >
                                {tx.amount < 0 ? '−' : '+'}{fmt(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Approve button inside drawer */}
                        <div className="px-4 py-3">
                          <button
                            onClick={() => approveGroup(keyword)}
                            className="btn-primary text-xs w-full flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle size={12} />
                            Approve &ldquo;{s.category}&rdquo; for all {group.count} transactions · save rule
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* All approved */}
          {phase === 'done' && pending.length === 0 && Object.keys(sugg).length > 0 && (
            <div className="card p-10 text-center">
              <CheckCircle
                size={36}
                className="mx-auto mb-3"
                style={{ color: 'var(--success)' }}
              />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                All {approvedCount} groups approved!
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Merchant rules saved — future imports will be auto-categorized
              </p>
              <button
                onClick={() => {
                  setSugg({})
                  setPhase('idle')
                  clearReviewProgress()
                }}
                className="btn-ghost text-xs mt-5"
              >
                Clear &amp; start new session
              </button>
            </div>
          )}

          {/* Idle, nothing to review */}
          {phase === 'idle' && !Object.keys(sugg).length && !resume && uncategorized.length === 0 && (
            <div className="card p-10 text-center">
              <CheckCircle
                size={36}
                className="mx-auto mb-3"
                style={{ color: 'var(--success)' }}
              />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                All transactions categorized!
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Nothing left to review.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── DUPLICATES TAB ─────────────────────────────────────────────────── */}
      {tab === 'duplicates' && (
        <div className="space-y-3 max-w-2xl">
          {duplicates.length === 0 ? (
            <div
              className="card p-10 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              No possible duplicates detected.
            </div>
          ) : duplicates.map(([a, b], i) => (
            <div key={i} className="card p-4">
              <div
                className="flex items-center gap-2 mb-3 text-xs font-medium"
                style={{ color: 'var(--warning)' }}
              >
                <AlertTriangle size={13} /> Possible duplicate — same date &amp; amount
              </div>
              {[a, b].map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t.description}
                    </div>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {t.date} · {t.account}
                    </div>
                  </div>
                  <span
                    className="font-mono text-xs shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
