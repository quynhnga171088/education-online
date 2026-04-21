import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, isAuthenticated, accessToken, logout } = useAuthStore()
  return { user, isAuthenticated, accessToken, logout }
}
