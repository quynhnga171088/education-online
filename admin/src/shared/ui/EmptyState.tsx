export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-5">
      <div style={{ fontSize: '3rem' }}>{icon}</div>
      <h6 className="mt-3 fw-semibold text-secondary">{title}</h6>
      {description && <p className="text-muted small">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
