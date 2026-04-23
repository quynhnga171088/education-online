import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../../shared/api/users'
import { PageSpinner, Spinner } from '../../shared/ui/Spinner'

// A-11: Tạo / Sửa người dùng
export function Component() {
  const { id } = useParams<{ id: string }>()
  const userId = id ? Number(id) : null
  const isEdit = !!userId
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId!).then((r) => r.data),
    enabled: isEdit,
  })

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('TEACHER')
  const [status, setStatus] = useState<'ACTIVE' | 'BLOCKED'>('ACTIVE')
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing) {
      setFullName(existing.fullName)
      setEmail(existing.email)
      setRole(existing.role)
      setStatus(existing.status)
    }
  }, [existing])

  const createMutation = useMutation({
    mutationFn: () => userApi.createTeacher({ fullName, email, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/users')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Tạo tài khoản thất bại.'
      setError(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => userApi.update(userId!, { fullName, role, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/users')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cập nhật thất bại.'
      setError(msg)
    },
  })

  const handleSubmit = () => {
    setError('')
    if (!fullName.trim()) { setError('Họ tên không được để trống.'); return }
    if (!isEdit && (!email.trim() || !password.trim())) {
      setError('Email và mật khẩu không được để trống.')
      return
    }
    if (isEdit) updateMutation.mutate()
    else createMutation.mutate()
  }

  if (isEdit && isLoading) return <PageSpinner />

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/users')}
          style={{ borderRadius: 8 }}
        >
          ← Quay lại
        </button>
        <h4 className="fw-bold mb-0">
          {isEdit ? '✏️ Sửa người dùng' : '➕ Tạo giáo viên'}
        </h4>
      </div>

      {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-medium small">Họ và tên *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
            />
          </div>

          {!isEdit && (
            <>
              <div className="col-12">
                <label className="form-label fw-medium small">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="teacher@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-medium small">Mật khẩu *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {isEdit && (
            <>
              <div className="col-12">
                <label className="form-label fw-medium small">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  disabled
                  style={{ background: '#f8fafc' }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium small">Vai trò</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  <option value="STUDENT">🎓 Học viên</option>
                  <option value="TEACHER">👨‍🏫 Giáo viên</option>
                  <option value="ADMIN">⚙️ Admin</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium small">Trạng thái</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                >
                  <option value="ACTIVE">✅ Đang hoạt động</option>
                  <option value="BLOCKED">🚫 Đã khóa</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/users')}
          >
            Hủy
          </button>
          <button
            className="btn btn-primary btn-sm fw-semibold"
            style={{ borderRadius: 8 }}
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending ? <Spinner size="sm" /> : (isEdit ? '💾 Lưu thay đổi' : '✅ Tạo tài khoản')}
          </button>
        </div>
      </div>
    </div>
  )
}
