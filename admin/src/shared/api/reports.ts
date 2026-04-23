import axiosInstance from './axiosInstance'

export interface TopCourseItem {
  courseId: number
  courseTitle: string
  enrollmentCount: number
}

export interface OverviewReport {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  publishedCourses: number
  totalApprovedEnrollments: number
  pendingEnrollments: number
  completedLessons: number
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
