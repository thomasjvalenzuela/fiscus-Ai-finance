import { catMeta } from '../lib/categories.js'
import { CAT_GROUPS, CATEGORIES } from '../lib/categories.js'
import { useState, useRef, useEffect } from 'react'

export function CategoryChip({ category, onClick }) {
  const meta = catMeta(category)
  return (
    <button
      onClick={onClick}
      title={onClick ? 'Click to change' : undefined}
      className="badge transition-opacity hover:opacity-80"
      style={{ background: meta.color + '20', color: meta.color, cursor: onClick ? 'pointer' : 'default' }}
    >
      {meta.icon} {category}
    </button>
  )
}

export function CategoryPicker({ value, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const meta = catMeta(value)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="badge transition-opacity hover:opacity-80 cursor-pointer"
        style={{ background: meta.color + '20', color: meta.color }}
      >
        {meta.icon} {value || 'Uncategorized'} ▾
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 card shadow-xl overflow-auto max-h-72 p-1">
          {Object.entries(CAT_GROUPS).map(([group, cats]) => (
            <div key={group}>
              <div className="px-2 py-1 text-[10px] font-semibold text-white/30 uppercase tracking-wider">{group}</div>
              {cats.map(cat => {
                const m = catMeta(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => { onChange(cat); setOpen(false) }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                    style={{ color: cat === value ? m.color : 'rgba(255,255,255,0.7)' }}
                  >
                    <span>{m.icon}</span> {cat}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
