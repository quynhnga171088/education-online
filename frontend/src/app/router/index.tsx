import { createBrowserRouter } from 'react-router-dom'
import App from 'src/App'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        lazy: () => import('src/pages/home/HomePage'),
      },
      {
        path: 'login',
        lazy: () => import('src/pages/auth/LoginPage'),
      },
      {
        path: 'register',
        lazy: () => import('src/pages/auth/RegisterPage'),
      },
      {
        path: 'courses',
        lazy: () => import('src/pages/courses/CoursesPage'),
      },
      {
        path: 'courses/:slug',
        lazy: () => import('src/pages/course-detail/CourseDetailPage'),
      },
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
])
