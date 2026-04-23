import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { registerSchema, type RegisterInput } from 'src/shared/lib/validations'
import { authApi } from 'src/shared/api/auth'
import { useAuthStore } from 'src/shared/store/authStore'
import { Spinner } from 'src/shared/ui/Spinner'

// S-02: Đăng ký
export function Component() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterInput) => {
    setServerError('')
    try {
      const res = await authApi.register(data.email, data.password, data.fullName)
      const { user, accessToken, refreshToken } = res.data
      setAuth(user, accessToken, refreshToken)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Đăng ký thất bại. Vui lòng thử lại.'
      setServerError(msg)
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center py-5"
      style={{ minHeight: 'calc(100vh - 130px)', background: 'var(--color-bg)' }}
    >
      <div className="w-100" style={{ maxWidth: 440 }}>
        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 16 }}>
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>🎓</div>
            <h4 className="fw-bold mt-2 mb-1">Tạo tài khoản</h4>
            <p className="text-muted small">Đăng ký để bắt đầu học ngay hôm nay</p>
          </div>

          {serverError && (
            <div className="alert alert-danger alert-sm py-2 small">{serverError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label fw-medium small">Họ và tên</label>
              <input
                {...register('fullName')}
                type="text"
                className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                placeholder="Nguyễn Văn A"
                autoFocus
              />
              {errors.fullName && (
                <div className="invalid-feedback">{errors.fullName.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium small">Email</label>
              <input
                {...register('email')}
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium small">Mật khẩu</label>
              <input
                {...register('password')}
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Ít nhất 6 ký tự"
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password.message}</div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium small">Xác nhận mật khẩu</label>
              <input
                {...register('confirmPassword')}
                type="password"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Nhập lại mật khẩu"
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword.message}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold"
              style={{ borderRadius: 10, padding: '0.65rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Đăng ký'}
            </button>
          </form>

          <p className="text-center text-muted small mt-3 mb-0">
            Đã có tài khoản?{' '}
            <Link to="/login" className="fw-semibold text-primary">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
