import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseApi } from '../../shared/api/courses'
import { PageSpinner } from '../../shared/ui/Spinner'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Pagination } from '../../shared/ui/Pagination'
import { statusBadge } from '../../shared/ui/Badge'
import { ConfirmModal } from '../../shared/ui/ConfirmModal'
import { formatPrice, formatDate } from '../../shared/lib/format'

// A-03: Danh sách khóa học
export function Component() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', page, search],
    queryFn: () =>
      courseApi.list({ page, size: 15, search: search || undefined }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => courseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      setDeleteId(null)
    },
  })

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">📚 Quản lý khóa học</h4>
          <p className="text-muted small mb-0">
            {data?.totalElements ?? '...'} khóa học trong hệ thống
          </p>
        </div>
        <Link
          to="/courses/new"
          className="btn btn-primary btn-sm fw-semibold"
          style={{ borderRadius: 8 }}
        >
          + Tạo khóa học
        </Link>
      </div>

      {/* Filter */}
      <div className="card border-0 shadow-sm mb-4 p-3" style={{ borderRadius: 12 }}>
        <div className="row g-2">
          <div className="col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm kiếm khóa học..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <PageSpinner />
      ) : !data?.content.length ? (
        <EmptyState icon="📚" title="Chưa có khóa học nào" />
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th className="ps-4 small text-muted fw-medium py-3" style={{ width: 60 }}>ID</th>
                  <th className="small text-muted fw-medium py-3">Tên khóa học</th>
                  <th className="small text-muted fw-medium py-3">Giáo viên</th>
                  <th className="small text-muted fw-medium py-3">Giá</th>
                  <th className="small text-muted fw-medium py-3">Trạng thái</th>
                  <th className="small text-muted fw-medium py-3">Bài học</th>
                  <th className="small text-muted fw-medium py-3">Ngày tạo</th>
                  <th className="small text-muted fw-medium py-3 pe-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((course) => (
                  <tr key={course.id}>
                    <td className="ps-4 text-muted small">{course.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt=""
                            style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 28,
                              background: '#e2e8f0',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                            }}
                          >
                            📚
                          </div>
                        )}
                        <div>
                          <div className="fw-medium small" style={{ maxWidth: 200 }}>
                            {course.title}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {course.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="small">{course.teacher.fullName}</td>
                    <td className="small fw-medium">{formatPrice(course.price)}</td>
                    <td>{statusBadge(course.status)}</td>
                    <td className="small text-muted">{course.lessonCount}</td>
                    <td className="small text-muted">{formatDate(course.createdAt)}</td>
                    <td className="pe-4">
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          style={{ fontSize: '0.75rem', borderRadius: 6 }}
                          onClick={() => navigate(`/courses/${course.id}/curriculum`)}
                          title="Quản lý bài học"
                        >
                          📋
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: '0.75rem', borderRadius: 6 }}
                          onClick={() => navigate(`/courses/${course.id}/edit`)}
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ fontSize: '0.75rem', borderRadius: 6 }}
                          onClick={() => setDeleteId(course.id)}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
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

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmModal
          title="Xóa khóa học"
          message="Bạn có chắc muốn xóa khóa học này? Thao tác không thể hoàn tác."
          danger
          confirmLabel="Xóa"
          onConfirm={() => deleteMutation.mutateAsync(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
