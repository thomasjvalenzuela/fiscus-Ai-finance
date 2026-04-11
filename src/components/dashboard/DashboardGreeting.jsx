import { useNavigate } from 'react-router-dom'
import { Upload, RefreshCw, Plus } from 'lucide-react'

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function DashboardGreeting({ user, reviewCount }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {getGreeting()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Here is your financial overview
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate('/import')} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
          <Upload size={12} /> Import
        </button>
        <button onClick={() => navigate('/review')} className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
          <RefreshCw size={12} /> Review
          {reviewCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--primary)' }}>
              {reviewCount}
            </span>
          )}
        </button>
        <button onClick={() => navigate('/transactions')} className="btn-primary text-xs flex items-center gap-1.5 py-1.5">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  )
}
