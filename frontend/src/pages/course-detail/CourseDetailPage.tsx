import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { courseApi, type LessonResponse } from 'src/shared/api/courses'
import { enrollmentApi } from 'src/shared/api/enrollments'
import { useAuthStore } from 'src/shared/store/authStore'
import { PageSpinner } from 'src/shared/ui/Spinner'
import { formatPrice, formatDuration } from 'src/shared/lib/format'

function LessonRow({ lesson, index }: { lesson: LessonResponse; index: number }) {
  return (
    <div className="d-flex align-items-start gap-3 py-2 px-0 border-bottom">
      <span className="text-muted" style={{ minWidth: 24, fontSize: '0.85rem' }}>
        {index + 1}.
      </span>
      <div className="flex-grow-1">
        <div className="small fw-medium">{lesson.title}</div>
        {lesson.description && (
          <div className="text-muted" style={{ fontSize: '0.78rem' }}>
            {lesson.description}
          </div>
        )}
      </div>
      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        <span
          className="badge"
          style={{
            fontSize: '0.7rem',
            background: lesson.type === 'VIDEO' ? '#dbeafe' : '#dcfce7',
            color: lesson.type === 'VIDEO' ? '#1e40af' : '#166534',
          }}
        >
          {lesson.type === 'VIDEO' ? '🎬' : '📝'}
        </span>
        {lesson.videoDurationSeconds && (
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {formatDuration(lesson.videoDurationSeconds)}
          </span>
        )}
      </div>
    </div>
  )
}

// S-05: Chi tiết khóa học
export function Component() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [enrollError, setEnrollError] = useState('')

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseApi.detail(slug!).then((r) => r.data),
    enabled: !!slug,
  })

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentApi.create(course!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', slug] })
      navigate(`/courses/${slug}/payment`)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể đăng ký. Vui lòng thử lại.'
      setEnrollError(msg)
    },
  })

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${slug}` } })
      return
    }
    setEnrollError('')
    enrollMutation.mutate()
  }

  if (isLoading) return <PageSpinner />
  if (!course) return <div className="container py-5 text-center text-muted">Không tìm thấy khóa học.</div>

  const thumbnailSrc =
    course.thumbnailUrl ||
    `https://placehold.co/800x450/4f46e5/fff?text=${encodeURIComponent(course.title)}`

  const enrollStatus = course.enrollmentStatus

  function EnrollButton() {
    if (enrollStatus === 'APPROVED') {
      const firstLesson = course.lessons?.[0]
      return (
        <Link
          to={firstLesson ? `/learn/${course.slug}/${firstLesson.id}` : '#'}
          className="btn btn-success w-100 fw-semibold"
          style={{ borderRadius: 10 }}
        >
          🎓 Vào học ngay
        </Link>
      )
    }
    if (enrollStatus === 'PENDING') {
      return (
        <button className="btn btn-warning w-100 fw-semibold" style={{ borderRadius: 10 }} disabled>
          ⏳ Đang chờ duyệt
        </button>
      )
    }
    if (enrollStatus === 'REJECTED') {
      return (
        <button className="btn btn-danger w-100 fw-semibold" style={{ borderRadius: 10 }} disabled>
          ❌ Đăng ký bị từ chối
        </button>
      )
    }
    return (
      <button
        className="btn btn-primary w-100 fw-semibold"
        style={{ borderRadius: 10 }}
        onClick={handleEnroll}
        disabled={enrollMutation.isPending}
      >
        {enrollMutation.isPending ? '...' : course.price === 0 ? '🎓 Đăng ký miễn phí' : '💳 Đăng ký khóa học'}
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>
      {/* ─── Hero ─── */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: '#fff' }}>
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb" style={{ '--bs-breadcrumb-divider-color': '#94a3b8', fontSize: '0.85rem' } as React.CSSProperties}>
                  <li className="breadcrumb-item">
                    <Link to="/courses" className="text-white-50 text-decoration-none">Khóa học</Link>
                  </li>
                  <li className="breadcrumb-item text-white-50 active">{course.title}</li>
                </ol>
              </nav>
              <h1 className="fw-bold h2 mb-3">{course.title}</h1>
              {course.shortDescription && (
                <p className="opacity-75 mb-3">{course.shortDescription}</p>
              )}
              <div className="d-flex flex-wrap gap-3 text-white-50 small">
                <span>👨‍🏫 {course.teacher.fullName}</span>
                <span>📚 {course.lessonCount} bài học</span>
                {course.publishedAt && <span>📅 Cập nhật {new Date(course.publishedAt).toLocaleDateString('vi-VN')}</span>}
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card border-0 shadow-lg" style={{ borderRadius: 16 }}>
                <img
                  src={thumbnailSrc}
                  alt={course.title}
                  className="card-img-top"
                  style={{ borderRadius: '16px 16px 0 0', aspectRatio: '16/9', objectFit: 'cover' }}
                />
                <div className="card-body p-4">
                  <div className="mb-3 text-center">
                    <span className="fw-bold" style={{ fontSize: '1.8rem', color: 'var(--color-primary)' }}>
                      {formatPrice(course.price)}
                    </span>
                  </div>
                  {enrollError && (
                    <div className="alert alert-danger py-2 small mb-3">{enrollError}</div>
                  )}
                  <EnrollButton />
                  {!isAuthenticated && (
                    <p className="text-center text-muted small mt-2 mb-0">
                      <Link to="/login">Đăng nhập</Link> để đăng ký
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-8">
            {/* Description */}
            {course.description && (
              <div className="card border-0 shadow-sm mb-4 p-4" style={{ borderRadius: 12 }}>
                <h5 className="fw-bold mb-3">📖 Mô tả khóa học</h5>
                <div
                  className="text-secondary"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
              </div>
            )}

            {/* Lesson Outline */}
            {course.lessons && course.lessons.length > 0 && (
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">📋 Nội dung khóa học</h5>
                  <span className="text-muted small">{course.lessons.length} bài học</span>
                </div>
                {course.lessons.map((lesson, i) => (
                  <LessonRow key={lesson.id} lesson={lesson} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar (repeated for scroll context) */}
          <div className="col-lg-4 d-none d-lg-block">
            <div className="card border-0 shadow-sm p-4 sticky-top" style={{ borderRadius: 12, top: 80 }}>
              <h6 className="fw-bold mb-3">✨ Khóa học này bao gồm</h6>
              <ul className="list-unstyled small text-secondary">
                <li className="mb-2">📚 {course.lessonCount} bài học</li>
                <li className="mb-2">⏱️ Học theo tiến độ của bạn</li>
                <li className="mb-2">♾️ Truy cập không giới hạn</li>
                <li className="mb-2">📱 Học trên mọi thiết bị</li>
              </ul>
              <hr />
              <EnrollButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
