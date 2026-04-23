export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface PaymentProof {
  id: number
  imageUrl: string
  note?: string
  createdAt: string
}

export interface Enrollment {
  id: number
  courseId: number
  courseTitle: string
  courseSlug: string
  courseThumbnailUrl?: string
  coursePrice: number
  studentId: number
  studentName: string
  studentEmail: string
  status: EnrollmentStatus
  note?: string
  reviewedAt?: string
  createdAt: string
  progressPercent?: number
  completedLessons?: number
  totalLessons?: number
  paymentProof?: PaymentProof
}
