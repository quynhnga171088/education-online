interface Props {
  value: number      // 0 – 100
  label?: string
  showLabel?: boolean
  height?: number
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export function ProgressBar({
  value,
  label,
  showLabel = true,
  height = 8,
  variant = 'primary',
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div>
      {showLabel && (
        <div className="d-flex justify-content-between mb-1">
          <small className="text-muted">{label ?? 'Tiến độ'}</small>
          <small className="fw-semibold">{pct}%</small>
        </div>
      )}
      <div className="progress" style={{ height }}>
        <div
          className={`progress-bar bg-${variant}`}
          role="progressbar"
          style={{ width: `${pct}%` }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
