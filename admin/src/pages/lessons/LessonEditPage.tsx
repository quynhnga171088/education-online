import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { lessonApi, type UpdateLessonDto } from '../../shared/api/lessons'
import { uploadApi } from '../../shared/api/upload'
import { PageSpinner, Spinner } from '../../shared/ui/Spinner'

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null
  const btn = (label: string, action: () => void, isActive = false) => (
    <button
      type="button"
      className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-outline-secondary'}`}
      style={{ fontSize: '0.75rem', borderRadius: 4, padding: '2px 8px' }}
      onClick={action}
    >
      {label}
    </button>
  )
  return (
    <div className="d-flex flex-wrap gap-1 p-2 border-bottom" style={{ background: '#f8fafc' }}>
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      {btn('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {btn('Code', () => editor.chain().focus().toggleCode().run(), editor.isActive('code'))}
      {btn('---', () => editor.chain().focus().setHorizontalRule().run())}
      {btn('↩ Undo', () => editor.chain().focus().undo().run())}
    </div>
  )
}

// A-08: Sửa bài học
export function Component() {
  const { id: courseIdStr, lid } = useParams<{ id: string; lid: string }>()
  const courseId = Number(courseIdStr)
  const lessonId = Number(lid)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: () => lessonApi.get(courseId, lessonId).then((r) => r.data),
    enabled: !!courseId && !!lessonId,
  })

  const [form, setForm] = useState<UpdateLessonDto>({})
  const [error, setError] = useState('')
  const [uploadPct, setUploadPct] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor: e }) => setForm((f) => ({ ...f, textContent: e.getHTML() })),
  })

  useEffect(() => {
    if (lesson && editor) {
      setForm({
        title: lesson.title,
        description: lesson.description ?? '',
        type: lesson.type,
        status: lesson.status,
        videoSourceType: lesson.videoSourceType ?? 'YOUTUBE',
        videoUrl: lesson.videoUrl ?? '',
        videoFileKey: lesson.videoFileKey ?? '',
        videoDurationSeconds: lesson.videoDurationSeconds,
        textContent: lesson.textContent ?? '',
        completionMode: lesson.completionMode ?? 'OPEN',
      })
      if (lesson.type === 'TEXT' && lesson.textContent) {
        editor.commands.setContent(lesson.textContent)
      }
    }
  }, [lesson, editor])

  const updateMutation = useMutation({
    mutationFn: () =>
      lessonApi.update(courseId, lessonId, {
        ...form,
        textContent: form.type === 'TEXT' ? (editor?.getHTML() ?? '') : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
      navigate(`/courses/${courseId}/curriculum`)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cập nhật thất bại.'
      setError(msg)
    },
  })

  const set = <K extends keyof UpdateLessonDto>(k: K, v: UpdateLessonDto[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleVideoUpload = async (file: File) => {
    setUploading(true)
    setUploadDone(false)
    try {
      const res = await uploadApi.video(file, courseId, setUploadPct)
      set('videoFileKey', res.data.fileKey)
      setUploadDone(true)
    } catch {
      setError('Upload video thất bại.')
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) return <PageSpinner />

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate(`/courses/${courseId}/curriculum`)}
          style={{ borderRadius: 8 }}
        >
          ← Quay lại
        </button>
        <h4 className="fw-bold mb-0">✏️ Sửa bài học</h4>
      </div>

      {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
        <div className="row g-4">
          <div className="col-12">
            <label className="form-label fw-medium small">Tiêu đề bài học *</label>
            <input
              type="text"
              className="form-control"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-medium small">Loại bài học</label>
            <select
              className="form-select"
              value={form.type ?? 'VIDEO'}
              onChange={(e) => set('type', e.target.value as 'VIDEO' | 'TEXT')}
            >
              <option value="VIDEO">🎬 Video</option>
              <option value="TEXT">📝 Bài đọc</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label fw-medium small">Trạng thái</label>
            <select
              className="form-select"
              value={form.status ?? 'DRAFT'}
              onChange={(e) => set('status', e.target.value as 'DRAFT' | 'PUBLISHED')}
            >
              <option value="DRAFT">📝 Nháp</option>
              <option value="PUBLISHED">✅ Xuất bản</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label fw-medium small">Điều kiện hoàn thành</label>
            <select
              className="form-select"
              value={form.completionMode ?? 'OPEN'}
              onChange={(e) => set('completionMode', e.target.value as 'OPEN' | 'VIDEO_50')}
            >
              <option value="OPEN">✅ Mở tự do</option>
              <option value="VIDEO_50">▶️ Xem ≥ 50% video</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-medium small">Mô tả ngắn</label>
            <input
              type="text"
              className="form-control"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {form.type === 'VIDEO' && (
            <>
              <div className="col-md-6">
                <label className="form-label fw-medium small">Nguồn video</label>
                <select
                  className="form-select"
                  value={form.videoSourceType ?? 'YOUTUBE'}
                  onChange={(e) => set('videoSourceType', e.target.value as 'UPLOAD' | 'YOUTUBE' | 'VIMEO' | 'DRIVE')}
                >
                  <option value="YOUTUBE">YouTube</option>
                  <option value="VIMEO">Vimeo</option>
                  <option value="DRIVE">Google Drive</option>
                  <option value="UPLOAD">📁 Upload file</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium small">Thời lượng (giây)</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  value={form.videoDurationSeconds ?? ''}
                  onChange={(e) => set('videoDurationSeconds', Number(e.target.value) || undefined)}
                />
              </div>

              {form.videoSourceType !== 'UPLOAD' ? (
                <div className="col-12">
                  <label className="form-label fw-medium small">URL Video</label>
                  <input
                    type="url"
                    className="form-control"
                    value={form.videoUrl ?? ''}
                    onChange={(e) => set('videoUrl', e.target.value)}
                  />
                </div>
              ) : (
                <div className="col-12">
                  <label className="form-label fw-medium small">Upload video mới</label>
                  {form.videoFileKey && (
                    <div className="text-muted small mb-2">
                      File hiện tại: <code>{form.videoFileKey}</code>
                    </div>
                  )}
                  <div className="d-flex gap-2">
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      accept="video/*"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleVideoUpload(f)
                      }}
                    />
                    {uploading && <Spinner size="sm" />}
                  </div>
                  {uploading && (
                    <div className="progress mt-2" style={{ height: 6 }}>
                      <div className="progress-bar" style={{ width: `${uploadPct}%` }} />
                    </div>
                  )}
                  {uploadDone && <div className="text-success small mt-1">✅ Upload thành công!</div>}
                </div>
              )}
            </>
          )}

          {form.type === 'TEXT' && (
            <div className="col-12">
              <label className="form-label fw-medium small">Nội dung bài học</label>
              <div className="border rounded-2 overflow-hidden" style={{ minHeight: 300 }}>
                <EditorToolbar editor={editor} />
                <div className="p-3" style={{ minHeight: 250 }}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate(`/courses/${courseId}/curriculum`)}
          >
            Hủy
          </button>
          <button
            className="btn btn-primary btn-sm fw-semibold"
            style={{ borderRadius: 8 }}
            disabled={!form.title || updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? <Spinner size="sm" /> : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}
