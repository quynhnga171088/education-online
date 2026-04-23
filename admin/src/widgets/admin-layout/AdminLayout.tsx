import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/store/authStore'
import { authApi } from '../../shared/api/auth'

const ALL_NAV = [
  { to: '/', label: '📊 Dashboard', end: true, roles: ['ADMIN', 'TEACHER'] },
  { to: '/courses', label: '📚 Khóa học', roles: ['ADMIN', 'TEACHER'] },
  { to: '/enrollments', label: '📋 Đăng ký học', roles: ['ADMIN', 'TEACHER'] },
  { to: '/users', label: '👥 Người dùng', roles: ['ADMIN'] },
  { to: '/reports', label: '📈 Báo cáo', roles: ['ADMIN', 'TEACHER'] },
  { to: '/settings', label: '⚙️ Cấu hình', roles: ['ADMIN'] },
]

export function AdminLayout() {
  const { user, isAuthenticated, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }
  if (!['ADMIN', 'TEACHER'].includes(user.role)) {
    logout()
    return <Navigate to="/login" replace />
  }

  const navItems = ALL_NAV.filter((item) => item.roles.includes(user.role))

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
    <div className="admin-layout">
      {/* ─── Sidebar ─── */}
      <aside className="admin-sidebar d-flex flex-column">
        {/* Brand */}
        <div className="px-4 py-3 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.4rem' }}>🎓</span>
            <div>
              <div className="text-white fw-bold" style={{ fontSize: '1rem', lineHeight: 1.2 }}>
                LMS Admin
              </div>
              <div style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>
                {user.role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav flex-column flex-grow-1 px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 rounded-2 mb-1 ${isActive ? 'active' : ''}`
              }
              style={{ fontSize: '0.875rem', padding: '0.55rem 0.9rem' }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <div className="d-flex align-items-center gap-2 mb-3 px-1">
            <div
              className="rounded-circle bg-indigo-500 text-white d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: 32,
                height: 32,
                fontSize: '0.8rem',
                background: '#6366f1',
                flexShrink: 0,
              }}
            >
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                className="text-white fw-medium text-truncate"
                style={{ fontSize: '0.8rem' }}
              >
                {user.fullName}
              </div>
              <div className="text-truncate" style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>
                {user.email}
              </div>
            </div>
          </div>
          <button
            className="btn btn-sm w-100"
            style={{
              background: 'rgba(255,255,255,.08)',
              color: '#c7d2fe',
              border: '1px solid rgba(255,255,255,.15)',
              borderRadius: 8,
              fontSize: '0.8rem',
            }}
            onClick={handleLogout}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
