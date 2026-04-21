export interface Lesson {
  id: number
  title: string
  type: 'VIDEO' | 'TEXT'
  orderIndex: number
  durationSeconds?: number
  isFree?: boolean
}
