import { Link, useParams } from 'react-router-dom'
import type { LessonProgressSummary } from 'src/shared/api/progress'
import type { LessonResponse } from 'src/shared/api/courses'
import { formatDuration } from 'src/shared/lib/format'

interface Props {
  lessons: LessonResponse[]
  progress?: LessonProgressSummary[]
  courseSlug: string
  activeLessonId: number
}

function progressIcon(status?: string) {
  if (status === 'COMPLETED') return '✅'
  if (status === 'IN_PROGRESS') return '▶️'
  return '⭕'
}

export function LessonSidebar({ lessons, progress = [], courseSlug, activeLessonId }: Props) {
  const progressMap = new Map(progress.map((p) => [p.lessonId, p]))

  return (
    <div className="d-flex flex-column h-100" style={{ overflowY: 'auto' }}>
      <div className="p-3 border-bottom bg-white">
        <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>
          📋 Danh sách bài học
        </h6>
        <small className="text-muted">{lessons.length} bài</small>
      </div>

      <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
        {lessons.map((lesson) => {
          const p = progressMap.get(lesson.id)
          const isActive = lesson.id === activeLessonId

          return (
            <Link
              key={lesson.id}
              to={`/learn/${courseSlug}/${lesson.id}`}
              className={`d-flex align-items-start gap-2 px-3 py-3 text-decoration-none border-bottom ${
                isActive ? 'bg-primary bg-opacity-10' : 'bg-white'
              }`}
              style={{
                transition: 'background .15s',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              }}
            >
              <span style={{ flexShrink: 0, fontSize: '0.85rem', marginTop: 1 }}>
                {progressIcon(p?.status)}
              </span>
              <div className="flex-grow-1 min-w-0">
                <div
                  className={`small fw-medium ${isActive ? 'text-primary' : 'text-dark'}`}
                  style={{
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  <span className="text-muted me-1" style={{ fontSize: '0.7rem' }}>
                    {lesson.orderIndex}.
                  </span>
                  {lesson.title}
                </div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.65rem',
                      background: lesson.type === 'VIDEO' ? '#dbeafe' : '#dcfce7',
                      color: lesson.type === 'VIDEO' ? '#1e40af' : '#166534',
                    }}
                  >
                    {lesson.type === 'VIDEO' ? '🎬 Video' : '📝 Bài đọc'}
                  </span>
                  {lesson.videoDurationSeconds && (
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {formatDuration(lesson.videoDurationSeconds)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
