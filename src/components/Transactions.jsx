import { useState, useMemo, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Download, Eye, EyeOff } from 'lucide-react'
import { CategoryPicker } from './CategoryChip.jsx'
import { catMeta, CATEGORIES } from '../lib/categories.js'

const fmt = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Transactions({ transactions, onUpdateCategory }) {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [showTransfers, setShowTransfers] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [bulkCat, setBulkCat] = useState('')
  const PAGE_SIZE = 50

  const accounts = useMemo(() => [...new Set(transactions.map(t => t.account).filter(Boolean))].sort(), [transactions])

  const filtered = useMemo(() => {
    let list = transactions
    if (!showTransfers) list = list.filter(t => !t.isTransfer)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.account.toLowerCase().includes(q))
    }
    if (filterCat) list = list.filter(t => t.category === filterCat)
    if (filterAccount) list = list.filter(t => t.account === filterAccount)
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, search, filterCat, filterAccount, showTransfers])

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === paginated.length ? new Set() : new Set(paginated.map(t => t.id)))

  const applyBulk = useCallback(() => {
    if (!bulkCat) return
    selected.forEach(id => onUpdateCategory(id, bulkCat))
    setSelected(new Set())
    setBulkCat('')
  }, [selected, bulkCat, onUpdateCategory])

  const exportCSV = () => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account'],
      ...filtered.map(t => [t.date, t.description, t.isIncome ? t.amount : -t.amount, t.type, t.category, t.account])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'transactions.csv'
    a.click()
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="input pl-8"
            placeholder="Search transactions…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="input w-44" value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input w-44" value={filterAccount} onChange={e => { setFilterAccount(e.target.value); setPage(1) }}>
          <option value="">All accounts</option>
          {accounts.map(a => <option key={a}>{a}</option>)}
        </select>
        <button onClick={() => setShowTransfers(v => !v)} className="btn-ghost flex items-center gap-2">
          {showTransfers ? <Eye size={14} /> : <EyeOff size={14} />}
          {showTransfers ? 'Hide' : 'Show'} transfers
        </button>
        <button onClick={exportCSV} className="btn-ghost flex items-center gap-2">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-xl">
          <span className="text-sm text-accent font-medium">{selected.size} selected</span>
          <select className="input w-48 py-1" value={bulkCat} onChange={e => setBulkCat(e.target.value)}>
            <option value="">Choose category…</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={applyBulk} disabled={!bulkCat} className="btn-primary py-1">Apply</button>
          <button onClick={() => setSelected(new Set())} className="btn-ghost py-1 ml-auto">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="w-10 p-3 text-left">
                <input type="checkbox" checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} className="accent-[#7c6af7]" />
              </th>
              <th className="p-3 text-left text-xs font-medium text-white/40 w-28">Date</th>
              <th className="p-3 text-left text-xs font-medium text-white/40">Description</th>
              <th className="p-3 text-left text-xs font-medium text-white/40 w-40">Account</th>
              <th className="p-3 text-left text-xs font-medium text-white/40 w-44">Category</th>
              <th className="p-3 text-right text-xs font-medium text-white/40 w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, i) => (
              <tr key={t.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${selected.has(t.id) ? 'bg-accent/5' : ''} ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} className="accent-[#7c6af7]" />
                </td>
                <td className="p-3 font-mono text-xs text-white/50">{t.date}</td>
                <td className="p-3 text-xs text-white/80 max-w-xs truncate" title={t.description}>{t.description}</td>
                <td className="p-3 text-xs text-white/40 truncate">{t.account}</td>
                <td className="p-3">
                  <CategoryPicker value={t.category || 'Skip / Uncategorized'} onChange={cat => onUpdateCategory(t.id, cat)} />
                </td>
                <td className={`p-3 text-right font-mono text-xs font-medium ${t.isIncome ? 'text-[#2dd4a0]' : 'text-white/70'}`}>
                  {t.isIncome ? '+' : '-'}{fmt(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginated.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">No transactions match your filters.</div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/40">{filtered.length} transactions</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="text-white/50">{page} / {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="btn-ghost p-2 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
