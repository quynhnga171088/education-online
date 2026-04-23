interface Props { size?: 'sm' | 'md'; className?: string }

export function Spinner({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={`spinner-border text-primary ${size === 'sm' ? 'spinner-border-sm' : ''} ${className}`}
      role="status"
    >
      <span className="visually-hidden">Đang tải...</span>
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <Spinner />
    </div>
  )
}
