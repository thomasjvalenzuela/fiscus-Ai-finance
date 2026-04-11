import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowUpRight } from 'lucide-react'
import { catMeta } from '../../lib/categories.js'

const fmtFull = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function RecentTransactions({ transactions = [] }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const recentTx = useMemo(() => {
    let list = [...transactions].filter((t) => !t.isTransfer).sort((a, b) => b.date.localeCompare(a.date))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.description.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
    }
    return list.slice(0, 10)
  }, [transactions, search])

  return (
    <div className="card p-5 lg:col-span-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h3>
        <button onClick={() => navigate('/transactions')} className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
          View all <ArrowUpRight size={11} />
        </button>
      </div>
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-8 text-xs py-2" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: 300 }}>
        {recentTx.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg)] transition-colors">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0" style={{ background: 'var(--bg)' }}>
              {catMeta(t.category).icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.description}</div>
              <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <span>{t.date}</span>
                {t.category && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    {t.category}
                  </span>
                )}
              </div>
            </div>
            <div className="font-mono text-xs font-semibold shrink-0" style={{ color: t.isIncome ? 'var(--success)' : 'var(--text-secondary)' }}>
              {t.isIncome ? '+' : '−'}{fmtFull(t.amount)}
            </div>
          </div>
        ))}
        {recentTx.length === 0 && (
          <p className="text-xs text-center py-10" style={{ color: 'var(--text-muted)' }}>No transactions found</p>
        )}
      </div>
    </div>
  )
}
