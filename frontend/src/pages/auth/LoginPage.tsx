import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { loginSchema, type LoginInput } from 'src/shared/lib/validations'
import { authApi } from 'src/shared/api/auth'
import { useAuthStore } from 'src/shared/store/authStore'
import { Spinner } from 'src/shared/ui/Spinner'

// S-03: Đăng nhập
export function Component() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState('')

  const from = (location.state as { from?: string })?.from ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setServerError('')
    try {
      const res = await authApi.login(data.email, data.password)
      const { user, accessToken, refreshToken } = res.data
      setAuth(user, accessToken, refreshToken)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Email hoặc mật khẩu không đúng.'
      setServerError(msg)
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center py-5"
      style={{ minHeight: 'calc(100vh - 130px)', background: 'var(--color-bg)' }}
    >
      <div className="w-100" style={{ maxWidth: 420 }}>
        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 16 }}>
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>👋</div>
            <h4 className="fw-bold mt-2 mb-1">Chào mừng trở lại</h4>
            <p className="text-muted small">Đăng nhập để tiếp tục học</p>
          </div>

          {serverError && (
            <div className="alert alert-danger py-2 small">{serverError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label fw-medium small">Email</label>
              <input
                {...register('email')}
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="email@example.com"
                autoFocus
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium small">Mật khẩu</label>
              <input
                {...register('password')}
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Mật khẩu"
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password.message}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold"
              style={{ borderRadius: 10, padding: '0.65rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-muted small mt-3 mb-0">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="fw-semibold text-primary">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
