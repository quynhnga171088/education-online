export type LessonType = 'VIDEO' | 'TEXT'
export type LessonStatus = 'DRAFT' | 'PUBLISHED'
export type VideoSourceType = 'UPLOAD' | 'YOUTUBE' | 'VIMEO' | 'DRIVE'
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface Lesson {
  id: number
  title: string
  description?: string
  orderIndex: number
  type: LessonType
  status: LessonStatus
  textContent?: string
  videoSourceType?: VideoSourceType
  videoUrl?: string
  videoFileKey?: string
  videoDurationSeconds?: number
}

export interface LessonWithProgress extends Lesson {
  progressStatus: ProgressStatus
  videoWatchedSeconds: number
  videoMaxWatchedPercent: number
  completedAt?: string
}
