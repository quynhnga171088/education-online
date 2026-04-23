import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../../shared/api/users'
import { PageSpinner } from '../../shared/ui/Spinner'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Pagination } from '../../shared/ui/Pagination'
import { statusBadge } from '../../shared/ui/Badge'
import { ConfirmModal } from '../../shared/ui/ConfirmModal'
import { formatDate } from '../../shared/lib/format'

// A-10: Quản lý người dùng
export function Component() {
  const [page, setPage] = useState(0)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, roleFilter, search],
    queryFn: () =>
      userApi
        .list({ page, size: 15, role: roleFilter || undefined, search: search || undefined })
        .then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteId(null)
    },
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">👥 Quản lý người dùng</h4>
          <p className="text-muted small mb-0">{data?.totalElements ?? '...'} tài khoản</p>
        </div>
        <button
          className="btn btn-primary btn-sm fw-semibold"
          style={{ borderRadius: 8 }}
          onClick={() => navigate('/users/new')}
        >
          + Tạo giáo viên
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4 p-3" style={{ borderRadius: 12 }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm theo email, tên..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="STUDENT">🎓 Học viên</option>
              <option value="TEACHER">👨‍🏫 Giáo viên</option>
              <option value="ADMIN">⚙️ Admin</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data?.content.length ? (
        <EmptyState icon="👥" title="Không tìm thấy người dùng" />
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th className="ps-4 small text-muted fw-medium py-3" style={{ width: 50 }}>ID</th>
                  <th className="small text-muted fw-medium py-3">Tên</th>
                  <th className="small text-muted fw-medium py-3">Email</th>
                  <th className="small text-muted fw-medium py-3">Vai trò</th>
                  <th className="small text-muted fw-medium py-3">Trạng thái</th>
                  <th className="small text-muted fw-medium py-3">Ngày tạo</th>
                  <th className="small text-muted fw-medium py-3 pe-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((u) => (
                  <tr key={u.id}>
                    <td className="ps-4 text-muted small">{u.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{
                            width: 32,
                            height: 32,
                            background: '#4f46e5',
                            fontSize: '0.8rem',
                            flexShrink: 0,
                          }}
                        >
                          {u.fullName?.[0]?.toUpperCase()}
                        </div>
                        <span className="fw-medium small">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="small text-muted">{u.email}</td>
                    <td>{statusBadge(u.role)}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td className="small text-muted">{formatDate(u.createdAt)}</td>
                    <td className="pe-4">
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: '0.75rem', borderRadius: 6 }}
                          onClick={() => navigate(`/users/${u.id}/edit`)}
                        >
                          ✏️
                        </button>
                        {u.role !== 'ADMIN' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{ fontSize: '0.75rem', borderRadius: 6 }}
                            onClick={() => setDeleteId(u.id)}
                          >
                            🗑️
                          </button>
                        )}
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

      {deleteId && (
        <ConfirmModal
          title="Xóa người dùng"
          message="Xóa tài khoản này? Dữ liệu sẽ bị ẩn (soft delete)."
          danger
          confirmLabel="Xóa"
          onConfirm={() => deleteMutation.mutateAsync(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
