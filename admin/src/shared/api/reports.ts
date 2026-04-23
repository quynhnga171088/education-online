import axiosInstance from './axiosInstance'

export interface TopCourseItem {
  courseId: number
  title: string
  slug: string
  thumbnailUrl: string | null
  enrollmentCount: number
}

/** Matches backend `OverviewReportResponse` (JSON field names) */
export interface OverviewReport {
  totalStudents: number
  totalTeachers: number
  totalPublishedCourses: number
  totalDraftCourses: number
  totalArchivedCourses: number
  totalEnrollmentsPending: number
  totalEnrollmentsApproved: number
  totalEnrollmentsRejected: number
  totalLessonsCompleted: number
  topCourses: TopCourseItem[]
}

export interface MonthlyCountItem {
  year: number
  month: number
  count: number
}

export interface LessonCompletionStat {
  lessonId: number
  lessonTitle: string
  completedCount: number
  totalEnrolled: number
}

export interface CourseReport {
  courseId: number
  courseTitle: string
  totalEnrolled: number
  approvedEnrollments: number
  monthlyTrend: MonthlyCountItem[]
  lessonStats: LessonCompletionStat[]
}

export interface StudentCourseProgress {
  courseId: number
  courseTitle: string
  enrollmentStatus: string
  progressPercent: number
  completedLessons: number
  totalLessons: number
}

export interface StudentReport {
  studentId: number
  studentName: string
  studentEmail: string
  courses: StudentCourseProgress[]
}

export const reportApi = {
  getOverview: () =>
    axiosInstance.get<OverviewReport>('/admin/reports/overview'),

  getCourseReport: (courseId: number) =>
    axiosInstance.get<CourseReport>(`/admin/reports/courses/${courseId}`),

  getStudentReport: (studentId: number) =>
    axiosInstance.get<StudentReport>(`/admin/reports/students/${studentId}`),
}
