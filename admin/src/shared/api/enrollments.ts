import axiosInstance from './axiosInstance'
import type { PageResponse } from './types'

export interface EnrollmentItem {
  id: number
  courseId: number
  courseTitle: string
  courseSlug: string
  courseThumbnailUrl?: string
  coursePrice: number
  studentId: number
  studentName: string
  studentEmail: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  note?: string
  reviewedAt?: string
  createdAt: string
  paymentProof?: { id: number; imageUrl: string; createdAt: string }
}

export const enrollmentApi = {
  list: (params?: {
    status?: string
    courseId?: number
    studentId?: number
    page?: number
    size?: number
  }) => axiosInstance.get<PageResponse<EnrollmentItem>>('/enrollments', { params }),

  getById: (id: number) =>
    axiosInstance.get<EnrollmentItem>(`/enrollments/${id}`),

  approve: (id: number) =>
    axiosInstance.patch<EnrollmentItem>(`/enrollments/${id}/approve`),

  reject: (id: number, note: string) =>
    axiosInstance.patch<EnrollmentItem>(`/enrollments/${id}/reject`, { note }),
}
