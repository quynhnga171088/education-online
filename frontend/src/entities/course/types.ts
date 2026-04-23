export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Course {
  id: number
  title: string
  slug: string
  shortDescription?: string
  description?: string
  thumbnailUrl?: string
  price: number
  status: CourseStatus
  teacher: { id: number; fullName: string; avatarUrl?: string }
  lessonCount: number
  publishedAt?: string
  createdAt: string
  enrollmentStatus?: EnrollmentStatus | null
}
