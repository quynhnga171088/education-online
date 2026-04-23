import axiosInstance from './axiosInstance'
import type { PageResponse } from './types'

export interface PaymentProof {
  id: number
  imageUrl: string
  note?: string
  createdAt: string
}

export interface EnrollmentDto {
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
  updatedAt: string
  progressPercent?: number
  completedLessons?: number
  totalLessons?: number
  paymentProof?: PaymentProof
}

export const enrollmentApi = {
  list: (params?: {
    status?: string
    courseId?: number
    studentId?: number
    page?: number
    size?: number
  }) => axiosInstance.get<PageResponse<EnrollmentDto>>('/enrollments', { params }),

  getById: (id: number) =>
    axiosInstance.get<EnrollmentDto>(`/enrollments/${id}`),

  create: (courseId: number) =>
    axiosInstance.post<EnrollmentDto>('/enrollments', { courseId }),

  uploadPaymentProof: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance.post<EnrollmentDto>(`/enrollments/${id}/payment-proof`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
