import axiosInstance from './axiosInstance'
import type { PageResponse } from './types'

export interface TeacherInfo {
  id: number
  fullName: string
  avatarUrl?: string
}

export interface CourseItem {
  id: number
  title: string
  slug: string
  shortDescription?: string
  thumbnailUrl?: string
  price: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  teacher: TeacherInfo
  lessonCount: number
  publishedAt?: string
  createdAt: string
  enrollmentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
}

export interface LessonResponse {
  id: number
  title: string
  description?: string
  orderIndex: number
  type: 'VIDEO' | 'TEXT'
  status: 'DRAFT' | 'PUBLISHED'
  textContent?: string
  videoSourceType?: 'UPLOAD' | 'YOUTUBE' | 'VIMEO' | 'DRIVE'
  videoUrl?: string
  videoFileKey?: string
  videoDurationSeconds?: number
}

export interface CourseDetail extends CourseItem {
  description?: string
  lessons: LessonResponse[]
}

export interface StudentWithProgress {
  id: number
  fullName: string
  email: string
  avatarUrl?: string
  progressPercent: number
  completedLessons: number
  totalLessons: number
  enrolledAt: string
}

export const courseApi = {
  list: (params?: {
    status?: string
    search?: string
    page?: number
    size?: number
    sortBy?: string
  }) => axiosInstance.get<PageResponse<CourseItem>>('/courses', { params }),

  detail: (slugOrId: string) =>
    axiosInstance.get<CourseDetail>(`/courses/${slugOrId}`),

  getLesson: (courseId: number, lessonId: number) =>
    axiosInstance.get<LessonResponse>(`/courses/${courseId}/lessons/${lessonId}`),

  getStudents: (courseId: number) =>
    axiosInstance.get<StudentWithProgress[]>(`/courses/${courseId}/students`),
}
