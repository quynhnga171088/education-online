import axiosInstance from './axiosInstance'

export type LessonType = 'VIDEO' | 'TEXT'
export type VideoSourceType = 'UPLOAD' | 'YOUTUBE' | 'VIMEO' | 'DRIVE'
export type LessonStatus = 'DRAFT' | 'PUBLISHED'

export interface LessonItem {
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
  completionMode?: 'OPEN' | 'VIDEO_50'
}

export interface CreateLessonDto {
  title: string
  description?: string
  type: LessonType
  status: LessonStatus
  textContent?: string
  videoSourceType?: VideoSourceType
  videoUrl?: string
  videoFileKey?: string
  videoDurationSeconds?: number
  completionMode?: 'OPEN' | 'VIDEO_50'
}

export interface UpdateLessonDto extends Partial<CreateLessonDto> {}

export const lessonApi = {
  list: (courseId: number) =>
    axiosInstance.get<LessonItem[]>(`/courses/${courseId}/lessons`),

  get: (courseId: number, lessonId: number) =>
    axiosInstance.get<LessonItem>(`/courses/${courseId}/lessons/${lessonId}`),

  create: (courseId: number, data: CreateLessonDto) =>
    axiosInstance.post<LessonItem>(`/courses/${courseId}/lessons`, data),

  update: (courseId: number, lessonId: number, data: UpdateLessonDto) =>
    axiosInstance.patch<LessonItem>(`/courses/${courseId}/lessons/${lessonId}`, data),

  delete: (courseId: number, lessonId: number) =>
    axiosInstance.delete(`/courses/${courseId}/lessons/${lessonId}`),

  reorder: (courseId: number, lessonIds: number[]) =>
    axiosInstance.put(`/courses/${courseId}/lessons/reorder`, { lessonIds }),
}
