import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from 'src/shared/store/authStore'

/** Redirect already-authenticated users away from login/register */
export function GuestGuard() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
