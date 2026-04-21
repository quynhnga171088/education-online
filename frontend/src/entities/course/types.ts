// Entities — course types & placeholder components
export interface Course {
  id: number
  title: string
  slug: string
  description?: string
  thumbnailUrl?: string
  price: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  teacherName?: string
  totalLessons?: number
  enrollmentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
}
