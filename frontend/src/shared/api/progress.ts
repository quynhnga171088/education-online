import axiosInstance from './axiosInstance'

export interface LessonProgressSummary {
  lessonId: number
  lessonTitle: string
  lessonType: 'VIDEO' | 'TEXT'
  orderIndex: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  videoWatchedSeconds: number
  videoMaxWatchedPercent: number
  completedAt?: string
  lastAccessedAt?: string
}

export interface CourseProgressResponse {
  courseId: number
  courseTitle: string
  courseSlug: string
  totalLessons: number
  completedLessons: number
  progressPercent: number
  lessons: LessonProgressSummary[]
}

export const progressApi = {
  getCourseProgress: (courseId: number) =>
    axiosInstance.get<CourseProgressResponse>(`/progress/courses/${courseId}`),

  markLessonOpen: (lessonId: number) =>
    axiosInstance.post(`/progress/lessons/${lessonId}/open`),

  updateVideoProgress: (lessonId: number, watchedSeconds: number) =>
    axiosInstance.post(`/progress/lessons/${lessonId}/video-progress`, { watchedSeconds }),
}
