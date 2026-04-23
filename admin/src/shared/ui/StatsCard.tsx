interface Props {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
}

export function StatsCard({ icon, label, value, sub, color = '#4f46e5' }: Props) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
      <div className="card-body d-flex align-items-center gap-3 p-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{ width: 52, height: 52, background: `${color}18`, fontSize: '1.5rem', flexShrink: 0 }}
        >
          {icon}
        </div>
        <div>
          <div className="text-muted small mb-1">{label}</div>
          <div className="fw-bold" style={{ fontSize: '1.6rem', lineHeight: 1, color }}>
            {value}
          </div>
          {sub && <div className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}
