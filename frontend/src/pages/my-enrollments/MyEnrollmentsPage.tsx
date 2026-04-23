import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { enrollmentApi, type EnrollmentDto } from 'src/shared/api/enrollments'
import { PageSpinner } from 'src/shared/ui/Spinner'
import { EmptyState } from 'src/shared/ui/EmptyState'
import { formatDate, formatPrice } from 'src/shared/lib/format'

function statusConfig(status: string) {
  const map: Record<string, { bg: string; color: string; label: string; icon: string }> = {
    PENDING:  { bg: '#fef9c3', color: '#92400e', label: 'Chờ duyệt',  icon: '⏳' },
    APPROVED: { bg: '#d1fae5', color: '#065f46', label: 'Đã duyệt',   icon: '✅' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Từ chối',    icon: '❌' },
  }
  return map[status] ?? { bg: '#f1f5f9', color: '#475569', label: status, icon: '❓' }
}

function EnrollmentRow({ e }: { e: EnrollmentDto }) {
  const s = statusConfig(e.status)
  const thumbnail =
    e.courseThumbnailUrl ||
    `https://placehold.co/64x36/4f46e5/fff?text=LMS`

  return (
    <div
      className="card border-0 shadow-sm mb-3 p-3"
      style={{ borderRadius: 12 }}
    >
      <div className="row g-3 align-items-center">
        {/* Thumbnail */}
        <div className="col-auto">
          <img
            src={thumbnail}
            alt={e.courseTitle}
            style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 8 }}
          />
        </div>

        {/* Info */}
        <div className="col">
          <div className="fw-semibold mb-1">{e.courseTitle}</div>
          <div className="d-flex flex-wrap gap-2 small text-muted">
            <span>📅 {formatDate(e.createdAt)}</span>
            <span>💰 {formatPrice(e.coursePrice)}</span>
          </div>
          {e.status === 'REJECTED' && e.note && (
            <div className="small text-danger mt-1">
              Lý do: {e.note}
            </div>
          )}
        </div>

        {/* Status + Actions */}
        <div className="col-auto d-flex flex-column align-items-end gap-2">
          <span
            className="badge rounded-pill fw-semibold"
            style={{ background: s.bg, color: s.color, fontSize: '0.8rem', padding: '4px 12px' }}
          >
            {s.icon} {s.label}
          </span>

          <div className="d-flex gap-2">
            {e.status === 'PENDING' && !e.paymentProof && (
              <Link
                to={`/courses/${e.courseSlug}/payment`}
                className="btn btn-sm btn-warning"
                style={{ borderRadius: 8, fontSize: '0.8rem' }}
              >
                📎 Tải ảnh TT
              </Link>
            )}
            {e.status === 'APPROVED' && (
              <Link
                to={`/courses/${e.courseSlug}`}
                className="btn btn-sm btn-primary"
                style={{ borderRadius: 8, fontSize: '0.8rem' }}
              >
                ▶ Vào học
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Payment proof */}
      {e.paymentProof && (
        <div className="mt-2 pt-2 border-top">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">📸 Ảnh thanh toán:</span>
            <a
              href={e.paymentProof.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="small text-primary"
            >
              Xem ảnh
            </a>
            <span className="text-muted small">• {formatDate(e.paymentProof.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// S-08: Đăng ký của tôi
export function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: () => enrollmentApi.list({ size: 50 }).then((r) => r.data),
  })

  if (isLoading) return <PageSpinner />

  const enrollments = data?.content ?? []
  const pending = enrollments.filter((e) => e.status === 'PENDING').length
  const approved = enrollments.filter((e) => e.status === 'APPROVED').length

  return (
    <div className="py-5" style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1">📋 Đăng ký của tôi</h2>
            <p className="text-muted mb-0 small">
              {approved} đã duyệt • {pending} chờ duyệt
            </p>
          </div>
          <Link to="/courses" className="btn btn-outline-primary btn-sm" style={{ borderRadius: 8 }}>
            + Thêm đăng ký
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Bạn chưa đăng ký khóa học nào"
            action={
              <Link to="/courses" className="btn btn-primary btn-sm">
                Khám phá khóa học
              </Link>
            }
          />
        ) : (
          enrollments.map((e) => <EnrollmentRow key={e.id} e={e} />)
        )}
      </div>
    </div>
  )
}
