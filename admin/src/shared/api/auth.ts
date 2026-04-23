import axiosInstance from './axiosInstance'
import type { AdminUser } from '../store/authStore'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AdminUser
}

export const authApi = {
  login: (email: string, password: string) =>
    axiosInstance.post<AuthResponse>('/auth/login', { email, password }),

  logout: (refreshToken: string) =>
    axiosInstance.post('/auth/logout', { refreshToken }),

  me: () => axiosInstance.get<AdminUser>('/auth/me'),
}
