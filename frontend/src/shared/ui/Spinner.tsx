interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: Props) {
  const sizeClass = size === 'sm' ? 'spinner-border-sm' : size === 'lg' ? '' : ''
  return (
    <div
      className={`spinner-border text-primary ${sizeClass} ${className}`}
      role="status"
    >
      <span className="visually-hidden">Đang tải...</span>
    </div>
  )
}

export function PageSpinner() {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '40vh' }}
    >
      <Spinner size="lg" />
    </div>
  )
}
