import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enrollmentApi, type EnrollmentItem } from '../../shared/api/enrollments'
import { PageSpinner } from '../../shared/ui/Spinner'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Pagination } from '../../shared/ui/Pagination'
import { statusBadge } from '../../shared/ui/Badge'
import { ConfirmModal } from '../../shared/ui/ConfirmModal'
import { formatDate, formatPrice } from '../../shared/lib/format'

type FilterStatus = '' | 'PENDING' | 'APPROVED' | 'REJECTED'

// A-09: Quản lý đăng ký học
export function Component() {
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('PENDING')
  const [approveId, setApproveId] = useState<number | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [viewProof, setViewProof] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['enrollments-admin'] })

  const { data, isLoading } = useQuery({
    queryKey: ['enrollments-admin', page, filterStatus],
    queryFn: () =>
      enrollmentApi
        .list({ status: filterStatus || undefined, page, size: 15 })
        .then((r) => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => enrollmentApi.approve(id),
    onSuccess: () => { invalidate(); setApproveId(null) },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      enrollmentApi.reject(id, note),
    onSuccess: () => { invalidate(); setRejectId(null); setRejectNote('') },
  })

  const statusTabs: { value: FilterStatus; label: string }[] = [
    { value: 'PENDING', label: '⏳ Chờ duyệt' },
    { value: 'APPROVED', label: '✅ Đã duyệt' },
    { value: 'REJECTED', label: '❌ Từ chối' },
    { value: '', label: '🗂️ Tất cả' },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">📋 Quản lý đăng ký học</h4>
          <p className="text-muted small mb-0">
            {data?.totalElements ?? '...'} đăng ký
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {statusTabs.map((t) => (
          <button
            key={t.value}
            className={`btn btn-sm ${filterStatus === t.value ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 20 }}
            onClick={() => { setFilterStatus(t.value); setPage(0) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data?.content.length ? (
        <EmptyState icon="📋" title="Không có đăng ký nào" />
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th className="ps-4 small text-muted fw-medium py-3">Học viên</th>
                  <th className="small text-muted fw-medium py-3">Khóa học</th>
                  <th className="small text-muted fw-medium py-3">Giá</th>
                  <th className="small text-muted fw-medium py-3">Ngày đăng ký</th>
                  <th className="small text-muted fw-medium py-3">Trạng thái</th>
                  <th className="small text-muted fw-medium py-3">Biên lai</th>
                  <th className="small text-muted fw-medium py-3 pe-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((e) => (
                  <EnrollmentRow
                    key={e.id}
                    enrollment={e}
                    onApprove={() => setApproveId(e.id)}
                    onReject={() => { setRejectId(e.id); setRejectNote('') }}
                    onViewProof={(url) => setViewProof(url)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="p-3 border-top">
              <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Approve confirm */}
      {approveId && (
        <ConfirmModal
          title="Duyệt đăng ký"
          message="Xác nhận duyệt đăng ký này? Học viên sẽ có quyền truy cập khóa học."
          confirmLabel="Duyệt"
          onConfirm={() => approveMutation.mutateAsync(approveId)}
          onCancel={() => setApproveId(null)}
        />
      )}

      {/* Reject confirm */}
      {rejectId && (
        <ConfirmModal
          title="Từ chối đăng ký"
          message="Nhập lý do từ chối (tùy chọn):"
          confirmLabel="Từ chối"
          danger
          extraField={{
            label: 'Lý do từ chối',
            placeholder: 'Vd: Biên lai không hợp lệ...',
            value: rejectNote,
            onChange: setRejectNote,
          }}
          onConfirm={() => rejectMutation.mutateAsync({ id: rejectId, note: rejectNote })}
          onCancel={() => { setRejectId(null); setRejectNote('') }}
        />
      )}

      {/* View proof modal */}
      {viewProof && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => setViewProof(null)} />
          <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12 }}>
                <div className="modal-header border-0">
                  <h6 className="modal-title fw-bold">📸 Biên lai thanh toán</h6>
                  <button className="btn-close" onClick={() => setViewProof(null)} />
                </div>
                <div className="modal-body text-center">
                  <img
                    src={viewProof}
                    alt="Payment proof"
                    style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 8 }}
                  />
                </div>
                <div className="modal-footer border-0">
                  <a href={viewProof} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                    Mở ảnh gốc
                  </a>
                  <button className="btn btn-sm btn-secondary" onClick={() => setViewProof(null)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EnrollmentRow({
  enrollment: e,
  onApprove,
  onReject,
  onViewProof,
}: {
  enrollment: EnrollmentItem
  onApprove: () => void
  onReject: () => void
  onViewProof: (url: string) => void
}) {
  return (
    <tr>
      <td className="ps-4">
        <div className="fw-medium small">{e.studentName}</div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{e.studentEmail}</div>
      </td>
      <td>
        <div className="fw-medium small" style={{ maxWidth: 200 }}>{e.courseTitle}</div>
      </td>
      <td className="small fw-medium">{formatPrice(e.coursePrice)}</td>
      <td className="small text-muted">{formatDate(e.createdAt)}</td>
      <td>{statusBadge(e.status)}</td>
      <td>
        {e.paymentProof ? (
          <button
            className="btn btn-sm btn-outline-info"
            style={{ fontSize: '0.75rem', borderRadius: 6 }}
            onClick={() => onViewProof(e.paymentProof!.imageUrl)}
          >
            👁️ Xem
          </button>
        ) : (
          <span className="text-muted small">Chưa có</span>
        )}
      </td>
      <td className="pe-4">
        {e.status === 'PENDING' && (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-success"
              style={{ fontSize: '0.75rem', borderRadius: 6 }}
              onClick={onApprove}
            >
              ✅ Duyệt
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              style={{ fontSize: '0.75rem', borderRadius: 6 }}
              onClick={onReject}
            >
              ❌ Từ chối
            </button>
          </div>
        )}
        {e.status !== 'PENDING' && (
          <span className="text-muted small">
            {e.reviewedAt ? formatDate(e.reviewedAt) : '—'}
          </span>
        )}
      </td>
    </tr>
  )
}
