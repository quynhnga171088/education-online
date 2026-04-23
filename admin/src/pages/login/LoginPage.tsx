import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../shared/api/auth'
import { useAuthStore } from '../../shared/store/authStore'
import { Spinner } from '../../shared/ui/Spinner'

// A-01: Đăng nhập Admin
export function Component() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const { user, accessToken, refreshToken } = res.data
      if (!['ADMIN', 'TEACHER'].includes(user.role)) {
        setError('Tài khoản không có quyền truy cập admin.')
        setLoading(false)
        return
      }
      setAuth(user, accessToken, refreshToken)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Email hoặc mật khẩu không đúng.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400, padding: '0 1rem' }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <div style={{ fontSize: '3rem' }}>🎓</div>
          <h3 className="text-white fw-bold mt-2 mb-1">LMS Admin Panel</h3>
          <p className="text-white-50 small">Đăng nhập để quản lý hệ thống</p>
        </div>

        <div
          className="card border-0 shadow-lg p-4"
          style={{ borderRadius: 16, backdropFilter: 'blur(10px)' }}
        >
          {error && (
            <div className="alert alert-danger py-2 small mb-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label fw-medium small">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium small">Mật khẩu</label>
              <input
                type="password"
                className="form-control"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold"
              style={{ borderRadius: 10, padding: '0.65rem', background: '#4f46e5', border: 'none' }}
              disabled={loading || !email || !password}
            >
              {loading ? <Spinner size="sm" /> : '🔐 Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
