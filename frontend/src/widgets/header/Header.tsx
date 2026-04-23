import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from 'src/shared/store/authStore'
import { authApi } from 'src/shared/api/auth'

export function Header() {
  const { isAuthenticated, user, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // ignore
    }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'var(--color-primary)' }}>
      <div className="container">
        <Link className="navbar-brand fw-bold fs-5" to="/">
          🎓 LMS Platform
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/courses">
                Khóa học
              </NavLink>
            </li>
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/my-courses">
                    Khóa của tôi
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/my-enrollments">
                    Đăng ký của tôi
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-2">
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <button
                  className="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="rounded-circle"
                      width={24}
                      height={24}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      className="rounded-circle bg-light text-primary d-inline-flex align-items-center justify-content-center fw-bold"
                      style={{ width: 24, height: 24, fontSize: 12 }}
                    >
                      {user?.fullName?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span>{user?.fullName}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      👤 Thông tin cá nhân
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      🚪 Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Đăng nhập
                  </NavLink>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-light btn-sm text-primary fw-semibold" to="/register">
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
