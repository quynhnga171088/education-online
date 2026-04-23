type Variant = 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'info'

interface Props {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

export function Badge({ children, variant = 'secondary', className = '' }: Props) {
  return (
    <span className={`badge bg-${variant} ${className}`}>{children}</span>
  )
}

export function enrollmentStatusBadge(status: string) {
  const map: Record<string, { variant: Variant; label: string }> = {
    PENDING:  { variant: 'warning',   label: 'Chờ duyệt' },
    APPROVED: { variant: 'success',   label: 'Đã duyệt' },
    REJECTED: { variant: 'danger',    label: 'Từ chối' },
  }
  const { variant, label } = map[status] ?? { variant: 'secondary', label: status }
  return <Badge variant={variant}>{label}</Badge>
}

export function courseStatusBadge(status: string) {
  const map: Record<string, { variant: Variant; label: string }> = {
    DRAFT:     { variant: 'secondary', label: 'Nháp' },
    PUBLISHED: { variant: 'success',   label: 'Đã xuất bản' },
    ARCHIVED:  { variant: 'warning',   label: 'Lưu trữ' },
  }
  const { variant, label } = map[status] ?? { variant: 'secondary', label: status }
  return <Badge variant={variant}>{label}</Badge>
}
