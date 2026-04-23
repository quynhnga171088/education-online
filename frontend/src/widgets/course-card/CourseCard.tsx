import { Link } from 'react-router-dom'
import type { CourseItem } from 'src/shared/api/courses'
import { formatPrice } from 'src/shared/lib/format'
import { enrollmentStatusBadge } from 'src/shared/ui/Badge'
import { ProgressBar } from 'src/shared/ui/ProgressBar'

interface Props {
  course: CourseItem
  progressPercent?: number
  showProgress?: boolean
  showEnrollmentStatus?: boolean
}

export function CourseCard({
  course,
  progressPercent,
  showProgress = false,
  showEnrollmentStatus = false,
}: Props) {
  const thumbnailSrc = course.thumbnailUrl || `https://placehold.co/400x225/4f46e5/fff?text=${encodeURIComponent(course.title)}`

  return (
    <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden', transition: 'transform .15s, box-shadow .15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', background: '#f0f0f0' }}>
        <img
          src={thumbnailSrc}
          alt={course.title}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {showEnrollmentStatus && course.enrollmentStatus && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            {enrollmentStatusBadge(course.enrollmentStatus)}
          </div>
        )}
      </div>

      <div className="card-body d-flex flex-column p-3">
        {/* Teacher name */}
        <p className="text-muted small mb-1" style={{ fontSize: '0.75rem' }}>
          {course.teacher.fullName}
        </p>

        {/* Title */}
        <h6 className="card-title fw-semibold mb-2" style={{ lineHeight: 1.4, minHeight: '2.8em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.title}
        </h6>

        {/* Lesson count */}
        <p className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>
          📚 {course.lessonCount} bài học
        </p>

        {/* Progress bar */}
        {showProgress && progressPercent !== undefined && (
          <div className="mb-2">
            <ProgressBar value={progressPercent} height={6} />
          </div>
        )}

        {/* Price + CTA */}
        <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
          <span className="fw-bold" style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>
            {formatPrice(course.price)}
          </span>
          <Link
            to={showProgress ? `/learn/${course.slug}/start` : `/courses/${course.slug}`}
            className="btn btn-sm btn-primary"
            style={{ borderRadius: 8 }}
          >
            {showProgress ? 'Tiếp tục học' : 'Xem chi tiết'}
          </Link>
        </div>
      </div>
    </div>
  )
}
