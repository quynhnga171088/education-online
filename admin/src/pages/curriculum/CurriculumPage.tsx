import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { courseApi } from '../../shared/api/courses'
import { lessonApi, type LessonItem } from '../../shared/api/lessons'
import { PageSpinner } from '../../shared/ui/Spinner'
import { ConfirmModal } from '../../shared/ui/ConfirmModal'
import { statusBadge } from '../../shared/ui/Badge'

function SortableLesson({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: LessonItem
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card border-0 mb-2 ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
      {...attributes}
    >
      <div className="card-body d-flex align-items-center gap-3 py-2 px-3">
        {/* Drag handle */}
        <div
          {...listeners}
          className="text-muted"
          style={{ cursor: 'grab', fontSize: '1.1rem', flexShrink: 0 }}
          title="Kéo để sắp xếp"
        >
          ⠿
        </div>

        {/* Order */}
        <span
          className="text-muted fw-semibold"
          style={{ width: 24, textAlign: 'right', fontSize: '0.8rem', flexShrink: 0 }}
        >
          {lesson.orderIndex}
        </span>

        {/* Type icon */}
        <span style={{ flexShrink: 0 }}>
          {lesson.type === 'VIDEO' ? '🎬' : '📝'}
        </span>

        {/* Title */}
        <div className="flex-grow-1 min-w-0">
          <div className="fw-medium small text-truncate">{lesson.title}</div>
          {lesson.description && (
            <div
              className="text-muted text-truncate"
              style={{ fontSize: '0.75rem' }}
            >
              {lesson.description}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ flexShrink: 0 }}>{statusBadge(lesson.status)}</div>

        {/* Actions */}
        <div className="d-flex gap-1 flex-shrink-0">
          <button
            className="btn btn-sm btn-outline-primary"
            style={{ fontSize: '0.75rem', borderRadius: 6 }}
            onClick={onEdit}
          >
            ✏️
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            style={{ fontSize: '0.75rem', borderRadius: 6 }}
            onClick={onDelete}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

// A-06: Quản lý nội dung khóa học (Curriculum)
export function Component() {
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [reorderError, setReorderError] = useState('')

  const { data: course } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => courseApi.detail(courseId).then((r) => r.data),
    enabled: !!courseId,
  })

  const { data: remoteLessons, isLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonApi.list(courseId).then((r) => r.data),
    enabled: !!courseId,
  })

  useEffect(() => {
    if (remoteLessons) setLessons(remoteLessons)
  }, [remoteLessons])

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => lessonApi.reorder(courseId, ids),
    onError: () => {
      setReorderError('Sắp xếp thất bại. Trang sẽ tải lại.')
      if (remoteLessons) setLessons(remoteLessons)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (lessonId: number) => lessonApi.delete(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
      setDeleteId(null)
    },
  })

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = lessons.findIndex((l) => l.id === active.id)
    const newIdx = lessons.findIndex((l) => l.id === over.id)
    const reordered = arrayMove(lessons, oldIdx, newIdx)
    setLessons(reordered)
    reorderMutation.mutate(reordered.map((l) => l.id))
  }

  if (isLoading) return <PageSpinner />

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/courses')}
          style={{ borderRadius: 8 }}
        >
          ← Quay lại
        </button>
        <div className="flex-grow-1">
          <h4 className="fw-bold mb-0">📋 Quản lý bài học</h4>
          {course && (
            <p className="text-muted small mb-0">{course.title}</p>
          )}
        </div>
        <div className="d-flex gap-2">
          <Link
            to={`/courses/${courseId}/edit`}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 8 }}
          >
            ✏️ Sửa khóa học
          </Link>
          <Link
            to={`/courses/${courseId}/lessons/new`}
            className="btn btn-sm btn-primary fw-semibold"
            style={{ borderRadius: 8 }}
          >
            + Thêm bài học
          </Link>
        </div>
      </div>

      {reorderError && (
        <div className="alert alert-warning py-2 small mb-3">{reorderError}</div>
      )}

      {/* Info */}
      <div
        className="alert alert-info py-2 small mb-3 d-flex align-items-center gap-2"
        style={{ borderRadius: 10 }}
      >
        <span>💡</span>
        <span>Kéo và thả ⠿ để sắp xếp lại thứ tự bài học. Thay đổi được lưu tự động.</span>
      </div>

      {/* Lesson count */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted small fw-medium">
          {lessons.length} bài học
        </span>
        {reorderMutation.isPending && (
          <span className="text-muted small">💾 Đang lưu...</span>
        )}
      </div>

      {/* DnD List */}
      {lessons.length === 0 ? (
        <div
          className="card border-dashed border-2 p-5 text-center"
          style={{ borderRadius: 12, borderColor: '#e2e8f0' }}
        >
          <div style={{ fontSize: '2.5rem' }}>📝</div>
          <p className="text-muted small mt-3 mb-0">
            Chưa có bài học nào.{' '}
            <Link to={`/courses/${courseId}/lessons/new`}>Thêm bài học đầu tiên</Link>
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lessons.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {lessons.map((lesson) => (
              <SortableLesson
                key={lesson.id}
                lesson={lesson}
                onEdit={() => navigate(`/courses/${courseId}/lessons/${lesson.id}/edit`)}
                onDelete={() => setDeleteId(lesson.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Add lesson button at bottom */}
      {lessons.length > 0 && (
        <div className="mt-3 text-center">
          <Link
            to={`/courses/${courseId}/lessons/new`}
            className="btn btn-outline-primary btn-sm"
            style={{ borderRadius: 8 }}
          >
            + Thêm bài học mới
          </Link>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmModal
          title="Xóa bài học"
          message="Bạn có chắc muốn xóa bài học này?"
          danger
          confirmLabel="Xóa"
          onConfirm={() => deleteMutation.mutateAsync(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
