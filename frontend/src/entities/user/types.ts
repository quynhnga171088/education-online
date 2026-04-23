export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'BLOCKED'

export interface User {
  id: number
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  role: UserRole
  status: UserStatus
  createdAt: string
}
