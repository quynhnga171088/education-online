type Variant = 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'info'

export function Badge({ children, variant = 'secondary' }: { children: React.ReactNode; variant?: Variant }) {
  return <span className={`badge bg-${variant}`}>{children}</span>
}

export function statusBadge(status: string): React.ReactNode {
  const map: Record<string, { v: Variant; l: string }> = {
    PENDING:   { v: 'warning',   l: '⏳ Chờ duyệt' },
    APPROVED:  { v: 'success',   l: '✅ Đã duyệt' },
    REJECTED:  { v: 'danger',    l: '❌ Từ chối' },
    ACTIVE:    { v: 'success',   l: '✅ Đang hoạt động' },
    BLOCKED:   { v: 'danger',    l: '🚫 Đã khóa' },
    DRAFT:     { v: 'secondary', l: '📝 Nháp' },
    PUBLISHED: { v: 'success',   l: '✅ Đã xuất bản' },
    ARCHIVED:  { v: 'warning',   l: '📦 Lưu trữ' },
    STUDENT:   { v: 'info',      l: '🎓 Học viên' },
    TEACHER:   { v: 'primary',   l: '👨‍🏫 Giáo viên' },
    ADMIN:     { v: 'danger',    l: '⚙️ Admin' },
  }
  const item = map[status] ?? { v: 'secondary' as Variant, l: status }
  return <Badge variant={item.v}>{item.l}</Badge>
}
