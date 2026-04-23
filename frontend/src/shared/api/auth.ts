import axiosInstance from './axiosInstance'

export interface AuthUserDto {
  id: number
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  status: 'ACTIVE' | 'BLOCKED'
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUserDto
}

export const authApi = {
  login: (email: string, password: string) =>
    axiosInstance.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, fullName: string) =>
    axiosInstance.post<AuthResponse>('/auth/register', { email, password, fullName }),

  logout: (refreshToken: string) =>
    axiosInstance.post('/auth/logout', { refreshToken }),

  me: () => axiosInstance.get<AuthUserDto>('/auth/me'),

  updateMe: (data: { fullName?: string; phone?: string; avatarUrl?: string }) =>
    axiosInstance.patch<AuthUserDto>('/auth/me', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    axiosInstance.post('/auth/change-password', { oldPassword, newPassword }),
}
