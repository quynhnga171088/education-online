import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/store/authStore'

const navItems = [
  { to: '/', label: '📊 Dashboard', end: true },
  { to: '/courses', label: '📚 Khóa học' },
  { to: '/enrollments', label: '📋 Đăng ký học' },
  { to: '/users', label: '👥 Người dùng' },
  { to: '/reports', label: '📈 Báo cáo' },
  { to: '/settings', label: '⚙️ Cấu hình' },
]

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar d-flex flex-column">
        <div className="px-4 mb-4">
          <h5 className="text-white fw-bold mb-0">LMS Admin</h5>
          <small className="text-indigo-300 opacity-75">{user?.role}</small>
        </div>
        <nav className="nav flex-column flex-grow-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 mt-auto">
          <button className="btn btn-sm btn-outline-light w-100" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
