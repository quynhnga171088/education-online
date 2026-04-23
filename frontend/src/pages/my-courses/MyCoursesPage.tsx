import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { enrollmentApi } from 'src/shared/api/enrollments'
import { progressApi } from 'src/shared/api/progress'
import { PageSpinner } from 'src/shared/ui/Spinner'
import { EmptyState } from 'src/shared/ui/EmptyState'
import { ProgressBar } from 'src/shared/ui/ProgressBar'
import { formatPrice, formatDate } from 'src/shared/lib/format'

function MyCourseCard({ enrollment }: { enrollment: { id: number; courseId: number; courseTitle: string; courseSlug: string; courseThumbnailUrl?: string; coursePrice: number; createdAt: string } }) {
  const { data: progress } = useQuery({
    queryKey: ['progress', enrollment.courseId],
    queryFn: () => progressApi.getCourseProgress(enrollment.courseId).then((r) => r.data),
  })

  const pct = progress?.progressPercent ?? 0
  const completed = progress?.completedLessons ?? 0
  const total = progress?.totalLessons ?? 0
  const firstNotDone = progress?.lessons.find((l) => l.status !== 'COMPLETED')
  const resumeLessonId = firstNotDone?.lessonId ?? progress?.lessons[0]?.lessonId

  const thumbnail =
    enrollment.courseThumbnailUrl ||
    `https://placehold.co/400x225/4f46e5/fff?text=${encodeURIComponent(enrollment.courseTitle)}`

  return (
    <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
        <img
          src={thumbnail}
          alt={enrollment.courseTitle}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {pct === 100 && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#059669',
              color: '#fff',
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            ✅ Hoàn thành
          </div>
        )}
      </div>
      <div className="card-body d-flex flex-column p-3">
        <h6 className="fw-semibold mb-2" style={{ lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {enrollment.courseTitle}
        </h6>
        <p className="text-muted small mb-2">
          Đăng ký: {formatDate(enrollment.createdAt)}
        </p>
        <p className="text-muted small mb-2">
          {completed}/{total} bài • {formatPrice(enrollment.coursePrice)}
        </p>
        <ProgressBar value={pct} height={6} showLabel={false} />
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <span className="small fw-semibold" style={{ color: 'var(--color-primary)' }}>
            {pct}%
          </span>
          {resumeLessonId && (
            <Link
              to={`/learn/${enrollment.courseSlug}/${resumeLessonId}`}
              className="btn btn-sm btn-primary"
              style={{ borderRadius: 8 }}
            >
              {pct === 0 ? '▶ Bắt đầu' : '▶ Tiếp tục'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// S-07: Khóa học của tôi
export function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['enrollments', 'approved'],
    queryFn: () =>
      enrollmentApi.list({ status: 'APPROVED', size: 50 }).then((r) => r.data),
  })

  if (isLoading) return <PageSpinner />

  const courses = data?.content ?? []

  return (
    <div className="py-5" style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">📚 Khóa học của tôi</h2>
            <p className="text-muted mb-0">{courses.length} khóa học đang học</p>
          </div>
          <Link to="/courses" className="btn btn-outline-primary btn-sm" style={{ borderRadius: 8 }}>
            + Thêm khóa học
          </Link>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Bạn chưa có khóa học nào"
            description="Khám phá và đăng ký khóa học để bắt đầu hành trình học tập"
            action={
              <Link to="/courses" className="btn btn-primary btn-sm">
                Khám phá khóa học
              </Link>
            }
          />
        ) : (
          <div className="row g-4">
            {courses.map((e) => (
              <div key={e.id} className="col-sm-6 col-lg-4">
                <MyCourseCard enrollment={e} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
