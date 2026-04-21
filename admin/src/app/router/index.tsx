import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../../widgets/admin-layout/AdminLayout'

export const router = createBrowserRouter([
  // A-01: Login (không cần layout)
  {
    path: '/login',
    lazy: () => import('../../pages/login/LoginPage'),
  },
  // Admin routes (có sidebar layout)
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, lazy: () => import('../../pages/dashboard/DashboardPage') },          // A-02
      { path: 'courses', lazy: () => import('../../pages/courses/CoursesListPage') },       // A-03
      { path: 'courses/new', lazy: () => import('../../pages/courses/CourseCreatePage') },  // A-04
      { path: 'courses/:id/edit', lazy: () => import('../../pages/courses/CourseEditPage') }, // A-05
      { path: 'courses/:id/curriculum', lazy: () => import('../../pages/curriculum/CurriculumPage') }, // A-06
      { path: 'courses/:id/lessons/new', lazy: () => import('../../pages/lessons/LessonCreatePage') }, // A-07
      { path: 'courses/:id/lessons/:lid/edit', lazy: () => import('../../pages/lessons/LessonEditPage') }, // A-08
      { path: 'enrollments', lazy: () => import('../../pages/enrollments/EnrollmentsPage') }, // A-09
      { path: 'users', lazy: () => import('../../pages/users/UsersPage') },                // A-10
      { path: 'users/new', lazy: () => import('../../pages/users/UserFormPage') },         // A-11
      { path: 'users/:id/edit', lazy: () => import('../../pages/users/UserFormPage') },    // A-11
      { path: 'reports', lazy: () => import('../../pages/reports/ReportsPage') },          // A-12
      { path: 'reports/courses/:id', lazy: () => import('../../pages/reports/CourseReportPage') }, // A-13
      { path: 'settings', lazy: () => import('../../pages/settings/SettingsPage') },       // A-14
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
