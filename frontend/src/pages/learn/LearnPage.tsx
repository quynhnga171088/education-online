import { useParams, Navigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { courseApi } from 'src/shared/api/courses'
import { progressApi } from 'src/shared/api/progress'
import { useAuthStore } from 'src/shared/store/authStore'
import { LessonSidebar } from 'src/widgets/lesson-sidebar/LessonSidebar'
import { PageSpinner } from 'src/shared/ui/Spinner'
import { buildFileUrl, formatDuration } from 'src/shared/lib/format'

function VideoPlayer({
  courseId,
  lessonId,
  url,
}: {
  courseId: number
  lessonId: number
  url: string
}) {
  const watchedSecondsRef = useRef(0)
  const lastReportedRef = useRef(0)
  const queryClient = useQueryClient()

  const progressMutation = useMutation({
    mutationFn: (secs: number) => progressApi.updateVideoProgress(lessonId, secs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress', courseId] }),
  })

  const handleProgress = useCallback(
    (state: { playedSeconds: number }) => {
      watchedSecondsRef.current = Math.floor(state.playedSeconds)
      // Report every 10 seconds
      if (watchedSecondsRef.current - lastReportedRef.current >= 10) {
        lastReportedRef.current = watchedSecondsRef.current
        progressMutation.mutate(watchedSecondsRef.current)
      }
    },
    [lessonId], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleEnded = useCallback(() => {
    progressMutation.mutate(watchedSecondsRef.current)
  }, [lessonId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="w-100 bg-black"
      style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}
    >
      <ReactPlayer
        url={url}
        controls
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onEnded={handleEnded}
        progressInterval={5000}
        config={{
          file: {
            attributes: { controlsList: 'nodownload' },
          },
        }}
      />
    </div>
  )
}

function TextContent({ html }: { html: string }) {
  return (
    <div
      className="card border-0 shadow-sm p-4 p-md-5"
      style={{ borderRadius: 12, lineHeight: 1.8 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// S-09: Trang học
export function Component() {
  const { slug, lessonId: lessonIdStr } = useParams<{ slug: string; lessonId: string }>()
  const lessonId = Number(lessonIdStr)
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Fetch course detail to get lesson list
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseApi.detail(slug!).then((r) => r.data),
    enabled: !!slug,
  })

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['progress', course?.id],
    queryFn: () => progressApi.getCourseProgress(course!.id).then((r) => r.data),
    enabled: !!course?.id,
  })

  const openMutation = useMutation({
    mutationFn: () => progressApi.markLessonOpen(lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress', course?.id] }),
  })

  // Mark lesson as opened when it loads
  useEffect(() => {
    if (lessonId && course?.id) {
      openMutation.mutate()
    }
  }, [lessonId, course?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (courseLoading) return <PageSpinner />
  if (!course) return <div className="container py-5 text-center text-muted">Không tìm thấy khóa học.</div>

  const lesson = course.lessons?.find((l) => l.id === lessonId) ?? course.lessons?.[0]
  if (!lesson) return <div className="container py-5 text-center text-muted">Không tìm thấy bài học.</div>

  const prevLesson = course.lessons?.find((l) => l.orderIndex === lesson.orderIndex - 1)
  const nextLesson = course.lessons?.find((l) => l.orderIndex === lesson.orderIndex + 1)

  function getVideoUrl() {
    if (!lesson) return ''
    if (lesson.videoFileKey) return buildFileUrl(lesson.videoFileKey) ?? ''
    return lesson.videoUrl ?? ''
  }

  return (
    <div
      className="d-flex"
      style={{ height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#0f172a' }}
    >
      {/* ─── Sidebar ─── */}
      <div
        className="d-none d-lg-flex flex-column flex-shrink-0 bg-white border-end"
        style={{ width: 320, overflowY: 'auto' }}
      >
        {/* Course header */}
        <div className="p-3 border-bottom" style={{ background: '#1e293b', color: '#fff' }}>
          <Link to={`/courses/${slug}`} className="text-white-50 small text-decoration-none">
            ← {course.title}
          </Link>
          {progress && (
            <div className="mt-2">
              <div className="d-flex justify-content-between small text-white-50 mb-1">
                <span>Tiến độ</span>
                <span>{progress.completedLessons}/{progress.totalLessons} bài</span>
              </div>
              <div className="progress" style={{ height: 4, background: 'rgba(255,255,255,.2)' }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <LessonSidebar
          lessons={course.lessons ?? []}
          progress={progress?.lessons}
          courseSlug={slug!}
          activeLessonId={lesson.id}
        />
      </div>

      {/* ─── Main content ─── */}
      <div className="flex-grow-1 d-flex flex-column" style={{ overflowY: 'auto', background: '#f8fafc' }}>
        {/* Lesson title bar */}
        <div
          className="px-4 py-3 border-bottom bg-white d-flex align-items-center gap-3"
          style={{ flexShrink: 0 }}
        >
          <div className="flex-grow-1 min-w-0">
            <h6 className="fw-bold mb-0 text-truncate">{lesson.title}</h6>
            <div className="d-flex gap-2 mt-1">
              <span
                className="badge"
                style={{
                  fontSize: '0.7rem',
                  background: lesson.type === 'VIDEO' ? '#dbeafe' : '#dcfce7',
                  color: lesson.type === 'VIDEO' ? '#1e40af' : '#166534',
                }}
              >
                {lesson.type === 'VIDEO' ? '🎬 Video' : '📝 Bài đọc'}
              </span>
              {lesson.videoDurationSeconds && (
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {formatDuration(lesson.videoDurationSeconds)}
                </span>
              )}
            </div>
          </div>

          {/* Mobile: show course link */}
          <Link
            to={`/courses/${slug}`}
            className="btn btn-sm btn-outline-secondary d-lg-none"
          >
            ☰
          </Link>
        </div>

        {/* Content area */}
        <div className="flex-grow-1 p-4">
          {lesson.type === 'VIDEO' ? (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <VideoPlayer
                courseId={course.id}
                lessonId={lesson.id}
                url={getVideoUrl()}
              />
              {lesson.description && (
                <div className="mt-3 text-secondary small">{lesson.description}</div>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {lesson.textContent ? (
                <TextContent html={lesson.textContent} />
              ) : (
                <div className="text-center text-muted py-5">Nội dung bài học chưa có.</div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div
          className="px-4 py-3 border-top bg-white d-flex justify-content-between align-items-center"
          style={{ flexShrink: 0 }}
        >
          {prevLesson ? (
            <Link
              to={`/learn/${slug}/${prevLesson.id}`}
              className="btn btn-sm btn-outline-secondary"
              style={{ borderRadius: 8 }}
            >
              ← Bài trước
            </Link>
          ) : (
            <span />
          )}

          <span className="text-muted small">
            {lesson.orderIndex} / {course.lessons?.length}
          </span>

          {nextLesson ? (
            <Link
              to={`/learn/${slug}/${nextLesson.id}`}
              className="btn btn-sm btn-primary"
              style={{ borderRadius: 8 }}
            >
              Bài tiếp →
            </Link>
          ) : (
            <Link
              to={`/courses/${slug}`}
              className="btn btn-sm btn-success"
              style={{ borderRadius: 8 }}
            >
              🎉 Hoàn thành
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
