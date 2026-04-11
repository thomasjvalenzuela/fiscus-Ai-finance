export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="p-4 rounded-full" style={{ background: 'var(--accent-light)' }}>
        <Icon className="w-8 h-8" style={{ color: 'var(--primary)' }} />
      </div>
      <div>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      {action}
    </div>
  )
}
