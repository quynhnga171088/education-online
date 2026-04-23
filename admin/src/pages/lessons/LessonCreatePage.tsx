import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { lessonApi, type CreateLessonDto } from '../../shared/api/lessons'
import { uploadApi } from '../../shared/api/upload'
import { Spinner } from '../../shared/ui/Spinner'

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
    <div
      className="d-flex flex-wrap gap-1 p-2 border-bottom"
      style={{ background: '#f8fafc' }}
    >
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

function VideoUploader({
  courseId,
  onUploaded,
}: {
  courseId: number
  onUploaded: (fileKey: string, fileUrl: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [pct, setPct] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const res = await uploadApi.video(file, courseId, setPct)
      onUploaded(res.data.fileKey, res.data.fileUrl)
      setDone(true)
    } catch {
      setError('Upload thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="d-flex gap-2 align-items-center">
        <input
          type="file"
          className="form-control form-control-sm"
          accept="video/*"
          disabled={uploading || done}
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPct(0); setDone(false) }}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary flex-shrink-0"
          style={{ borderRadius: 8, whiteSpace: 'nowrap' }}
          disabled={!file || uploading || done}
          onClick={handleUpload}
        >
          {uploading ? <Spinner size="sm" /> : '📤 Upload'}
        </button>
      </div>
      {uploading && (
        <div className="progress mt-2" style={{ height: 6 }}>
          <div
            className="progress-bar bg-primary"
            style={{ width: `${pct}%`, transition: 'width .3s' }}
          />
        </div>
      )}
      {done && <div className="text-success small mt-1">✅ Upload thành công!</div>}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  )
}

const emptyLesson: CreateLessonDto = {
  title: '',
  type: 'VIDEO',
  status: 'DRAFT',
  videoSourceType: 'YOUTUBE',
  videoUrl: '',
  videoFileKey: '',
  completionMode: 'OPEN',
}

// A-07: Tạo bài học
export function Component() {
  const { id: courseIdStr } = useParams<{ id: string }>()
  const courseId = Number(courseIdStr)
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateLessonDto>(emptyLesson)
  const [error, setError] = useState('')

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor: e }) => setForm((f) => ({ ...f, textContent: e.getHTML() })),
  })

  const createMutation = useMutation({
    mutationFn: () => lessonApi.create(courseId, {
      ...form,
      textContent: form.type === 'TEXT' ? (editor?.getHTML() ?? '') : undefined,
    }),
    onSuccess: () => navigate(`/courses/${courseId}/curriculum`),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Tạo bài học thất bại.'
      setError(msg)
    },
  })

  const set = <K extends keyof CreateLessonDto>(k: K, v: CreateLessonDto[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

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
        <h4 className="fw-bold mb-0">➕ Tạo bài học mới</h4>
      </div>

      {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
        <div className="row g-4">
          {/* Title */}
          <div className="col-12">
            <label className="form-label fw-medium small">Tiêu đề bài học *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tiêu đề..."
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* Type + Status + CompletionMode */}
          <div className="col-md-4">
            <label className="form-label fw-medium small">Loại bài học</label>
            <select
              className="form-select"
              value={form.type}
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
              value={form.status}
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
              value={form.completionMode}
              onChange={(e) => set('completionMode', e.target.value as 'OPEN' | 'VIDEO_50')}
            >
              <option value="OPEN">✅ Mở tự do</option>
              <option value="VIDEO_50">▶️ Xem ≥ 50% video</option>
            </select>
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label fw-medium small">Mô tả ngắn</label>
            <input
              type="text"
              className="form-control"
              placeholder="Mô tả ngắn về bài học..."
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* VIDEO fields */}
          {form.type === 'VIDEO' && (
            <>
              <div className="col-md-6">
                <label className="form-label fw-medium small">Nguồn video</label>
                <select
                  className="form-select"
                  value={form.videoSourceType}
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
                  placeholder="600"
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
                    placeholder="https://youtube.com/watch?v=..."
                    value={form.videoUrl ?? ''}
                    onChange={(e) => set('videoUrl', e.target.value)}
                  />
                </div>
              ) : (
                <div className="col-12">
                  <label className="form-label fw-medium small">Upload file video</label>
                  <VideoUploader
                    courseId={courseId}
                    onUploaded={(key, _url) => set('videoFileKey', key)}
                  />
                  {form.videoFileKey && (
                    <div className="text-muted small mt-1">
                      File key: <code>{form.videoFileKey}</code>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TEXT editor */}
          {form.type === 'TEXT' && (
            <div className="col-12">
              <label className="form-label fw-medium small">Nội dung bài học</label>
              <div
                className="border rounded-2 overflow-hidden"
                style={{ minHeight: 300 }}
              >
                <EditorToolbar editor={editor} />
                <div className="p-3" style={{ minHeight: 250 }}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
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
            disabled={!form.title || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Spinner size="sm" /> : '✅ Tạo bài học'}
          </button>
        </div>
      </div>
    </div>
  )
}
