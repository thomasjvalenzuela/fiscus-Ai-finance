import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, CheckCircle, PiggyBank,
  CreditCard, Bot, Upload, Settings, LogOut,
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/review',       label: 'Review',       icon: CheckCircle },
  { to: '/budget',       label: 'Budget',       icon: PiggyBank },
  { to: '/debt',         label: 'Debt Tracker', icon: CreditCard },
  { to: '/advisor',      label: 'AI Advisor',   icon: Bot },
  { to: '/import',       label: 'Import Data',  icon: Upload },
  { to: '/settings',     label: 'Settings',     icon: Settings },
]

export default function Sidebar({ reviewCount = 0, user, onLogout, branding = {}, onCloseMobile }) {
  const appName = branding.appName || 'Fiscus'
  const tagline = branding.tagline || 'Personal Finance'
  const logoUrl = branding.logoUrl || ''

  return (
    <aside
      className="w-[240px] sm:w-[260px] shrink-0 flex flex-col h-screen sticky top-0 select-none"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {logoUrl ? (
          <img src={logoUrl} alt={appName} className="w-7 h-7 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="grid grid-cols-2 gap-0.5 w-7 h-7 rotate-45 overflow-hidden rounded-sm shrink-0">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[2px]"
                style={{ background: i % 2 === 0 ? 'var(--primary)' : 'var(--accent)' }}
              />
            ))}
          </div>
        )}
        <div>
          <div className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {appName}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{tagline}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/review' && reviewCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                {reviewCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className="p-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            {user.displayName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user.displayName}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Stored locally</div>
          </div>
          <button onClick={onLogout} title="Sign out" className="btn-icon !w-7 !h-7 shrink-0">
            <LogOut size={13} />
          </button>
        </div>
      )}
    </aside>
  )
}
