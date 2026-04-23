import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { z } from 'zod'
import { authApi } from 'src/shared/api/auth'
import { useAuthStore } from 'src/shared/store/authStore'
import { changePasswordSchema, type ChangePasswordInput } from 'src/shared/lib/validations'
import { Spinner } from 'src/shared/ui/Spinner'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z.string().optional(),
})
type ProfileInput = z.infer<typeof profileSchema>

function ProfileForm() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: (user as Record<string, unknown>)?.phone as string | undefined ?? '',
    },
  })

  const onSubmit = async (data: ProfileInput) => {
    setError('')
    setSuccess(false)
    try {
      const res = await authApi.updateMe({ fullName: data.fullName, phone: data.phone })
      setAuth(res.data as Parameters<typeof setAuth>[0], accessToken!, refreshToken!)
      setSuccess(true)
    } catch {
      setError('Cập nhật thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 12 }}>
      <h5 className="fw-bold mb-4">👤 Thông tin cá nhân</h5>

      {success && <div className="alert alert-success py-2 small">✅ Cập nhật thành công!</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* Avatar placeholder */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
          style={{ width: 64, height: 64, fontSize: '1.5rem', flexShrink: 0 }}
        >
          {user?.fullName?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="fw-semibold">{user?.fullName}</div>
          <div className="text-muted small">{user?.email}</div>
          <span
            className="badge mt-1"
            style={{
              background: '#dbeafe',
              color: '#1e40af',
              fontSize: '0.75rem',
            }}
          >
            {user?.role === 'STUDENT' ? '🎓 Học viên' : user?.role === 'TEACHER' ? '👨‍🏫 Giáo viên' : '⚙️ Admin'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label fw-medium small">Email</label>
          <input
            type="email"
            className="form-control"
            value={user?.email ?? ''}
            disabled
            style={{ background: '#f8fafc' }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-medium small">Họ và tên</label>
          <input
            {...register('fullName')}
            type="text"
            className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
          />
          {errors.fullName && (
            <div className="invalid-feedback">{errors.fullName.message}</div>
          )}
        </div>

        <div className="mb-4">
          <label className="form-label fw-medium small">Số điện thoại</label>
          <input
            {...register('phone')}
            type="tel"
            className="form-control"
            placeholder="0912345678"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ borderRadius: 10 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner size="sm" /> : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  )
}

function ChangePasswordForm() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) })

  const onSubmit = async (data: ChangePasswordInput) => {
    setError('')
    setSuccess(false)
    try {
      await authApi.changePassword(data.oldPassword, data.newPassword)
      setSuccess(true)
      reset()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Đổi mật khẩu thất bại.'
      setError(msg)
    }
  }

  return (
    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
      <h5 className="fw-bold mb-4">🔒 Đổi mật khẩu</h5>

      {success && <div className="alert alert-success py-2 small">✅ Đổi mật khẩu thành công!</div>}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label fw-medium small">Mật khẩu hiện tại</label>
          <input
            {...register('oldPassword')}
            type="password"
            className={`form-control ${errors.oldPassword ? 'is-invalid' : ''}`}
          />
          {errors.oldPassword && (
            <div className="invalid-feedback">{errors.oldPassword.message}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label fw-medium small">Mật khẩu mới</label>
          <input
            {...register('newPassword')}
            type="password"
            className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
          />
          {errors.newPassword && (
            <div className="invalid-feedback">{errors.newPassword.message}</div>
          )}
        </div>

        <div className="mb-4">
          <label className="form-label fw-medium small">Xác nhận mật khẩu mới</label>
          <input
            {...register('confirmNewPassword')}
            type="password"
            className={`form-control ${errors.confirmNewPassword ? 'is-invalid' : ''}`}
          />
          {errors.confirmNewPassword && (
            <div className="invalid-feedback">{errors.confirmNewPassword.message}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-outline-primary"
          style={{ borderRadius: 10 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner size="sm" /> : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  )
}

// S-10: Thông tin cá nhân
export function Component() {
  return (
    <div className="py-5" style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <h2 className="fw-bold mb-4">⚙️ Cài đặt tài khoản</h2>
        <ProfileForm />
        <ChangePasswordForm />
      </div>
    </div>
  )
}
