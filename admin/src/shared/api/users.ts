import axiosInstance from './axiosInstance'
import type { PageResponse } from './types'

export interface UserItem {
  id: number
  email: string
  fullName: string
  phone?: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  status: 'ACTIVE' | 'BLOCKED'
  createdAt: string
}

export interface CreateTeacherDto {
  fullName: string
  email: string
  password: string
}

export interface UpdateUserDto {
  fullName?: string
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN'
  status?: 'ACTIVE' | 'BLOCKED'
}

export const userApi = {
  list: (params?: {
    role?: string
    status?: string
    search?: string
    page?: number
    size?: number
  }) => axiosInstance.get<PageResponse<UserItem>>('/admin/users', { params }),

  getById: (id: number) =>
    axiosInstance.get<UserItem>(`/admin/users/${id}`),

  createTeacher: (data: CreateTeacherDto) =>
    axiosInstance.post<UserItem>('/admin/users', data),

  update: (id: number, data: UpdateUserDto) =>
    axiosInstance.patch<UserItem>(`/admin/users/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/admin/users/${id}`),
}
