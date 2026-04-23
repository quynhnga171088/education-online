import { createBrowserRouter } from 'react-router-dom'
import App from 'src/App'
import { AuthGuard } from 'src/features/auth/AuthGuard'
import { GuestGuard } from 'src/features/auth/GuestGuard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // ─── Public routes ─────────────────────────────────────────────
      {
        index: true,
        lazy: () => import('src/pages/home/HomePage'),
      },
      {
        path: 'courses',
        lazy: () => import('src/pages/courses/CoursesPage'),
      },
      {
        path: 'courses/:slug',
        lazy: () => import('src/pages/course-detail/CourseDetailPage'),
      },

      // ─── Guest-only routes (redirect if already logged in) ──────────
      {
        element: <GuestGuard />,
        children: [
          {
            path: 'login',
            lazy: () => import('src/pages/auth/LoginPage'),
          },
          {
            path: 'register',
            lazy: () => import('src/pages/auth/RegisterPage'),
          },
        ],
      },

      // ─── Protected routes (require authentication) ──────────────────
      {
        element: <AuthGuard />,
        children: [
          {
            path: 'courses/:slug/payment',
            lazy: () => import('src/pages/payment/PaymentPage'),
          },
          {
            path: 'my-courses',
            lazy: () => import('src/pages/my-courses/MyCoursesPage'),
          },
          {
            path: 'my-enrollments',
            lazy: () => import('src/pages/my-enrollments/MyEnrollmentsPage'),
          },
          {
            path: 'learn/:slug/:lessonId',
            lazy: () => import('src/pages/learn/LearnPage'),
          },
          {
            path: 'profile',
            lazy: () => import('src/pages/profile/ProfilePage'),
          },
        ],
      },
    ],
  },
])
