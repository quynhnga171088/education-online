import axiosInstance from './axiosInstance'
import type { PageResponse } from './types'

export interface CourseItem {
  id: number
  title: string
  slug: string
  shortDescription?: string
  thumbnailUrl?: string
  price: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  teacher: { id: number; fullName: string }
  lessonCount: number
  createdAt: string
  enrollmentCount?: number
}

export interface CourseDetail extends CourseItem {
  description?: string
}

export interface CreateCourseDto {
  title: string
  shortDescription?: string
  description?: string
  price: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  thumbnailUrl?: string
  teacherId?: number
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {}

export const courseApi = {
  list: (params?: { search?: string; status?: string; page?: number; size?: number }) =>
    axiosInstance.get<PageResponse<CourseItem>>('/courses', { params }),

  detail: (id: number) =>
    axiosInstance.get<CourseDetail>(`/courses/${id}`),

  create: (data: CreateCourseDto) =>
    axiosInstance.post<CourseDetail>('/courses', data),

  update: (id: number, data: UpdateCourseDto) =>
    axiosInstance.patch<CourseDetail>(`/courses/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete(`/courses/${id}`),
}
