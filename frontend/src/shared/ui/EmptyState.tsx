interface Props {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="text-center py-5">
      <div style={{ fontSize: '3rem' }}>{icon}</div>
      <h5 className="mt-3 fw-semibold text-secondary">{title}</h5>
      {description && <p className="text-muted small">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
