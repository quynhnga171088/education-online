import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from 'src/shared/store/authStore'

/** Wrap protected routes – redirects to /login if not authenticated */
export function AuthGuard() {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
