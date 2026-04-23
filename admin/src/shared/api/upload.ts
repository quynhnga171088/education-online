import axiosInstance from './axiosInstance'

export interface UploadResponse {
  fileKey: string
  fileUrl: string
  fileName: string
  contentType: string
  size: number
}

export const uploadApi = {
  video: (
    file: File,
    courseId: number,
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData()
    form.append('file', file)
    form.append('courseId', String(courseId))
    return axiosInstance.post<UploadResponse>('/upload/video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((100 * e.loaded) / e.total))
        }
      },
    })
  },

  image: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance.post<UploadResponse>('/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((100 * e.loaded) / e.total))
        }
      },
    })
  },
}
