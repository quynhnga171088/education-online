export interface Enrollment {
  id: number
  courseId: number
  courseTitle: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  progressPercent?: number
}
