import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { courseApi, type UpdateCourseDto } from '../../shared/api/courses'
import { uploadApi } from '../../shared/api/upload'
import { PageSpinner, Spinner } from '../../shared/ui/Spinner'

// A-05: Sửa khóa học
export function Component() {
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => courseApi.detail(courseId).then((r) => r.data),
    enabled: !!courseId,
  })

  const [form, setForm] = useState<UpdateCourseDto>({})
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [uploadPct, setUploadPct] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title,
        shortDescription: course.shortDescription ?? '',
        description: course.description ?? '',
        price: course.price,
        status: course.status,
        thumbnailUrl: course.thumbnailUrl ?? '',
      })
      setThumbnailPreview(course.thumbnailUrl ?? '')
    }
  }, [course])

  const updateMutation = useMutation({
    mutationFn: async () => {
      let thumbnailUrl = form.thumbnailUrl
      if (thumbnailFile) {
        const res = await uploadApi.image(thumbnailFile, (p) => setUploadPct(p))
        thumbnailUrl = res.data.fileUrl
      }
      return courseApi.update(courseId, { ...form, thumbnailUrl })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      navigate('/courses')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cập nhật thất bại.'
      setError(msg)
    },
  })

  const set = (k: keyof UpdateCourseDto, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  if (isLoading) return <PageSpinner />

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/courses')}
          style={{ borderRadius: 8 }}
        >
          ← Quay lại
        </button>
        <div>
          <h4 className="fw-bold mb-0">✏️ Sửa khóa học</h4>
          <p className="text-muted small mb-0">{course?.title}</p>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary ms-auto"
          onClick={() => navigate(`/courses/${courseId}/curriculum`)}
          style={{ borderRadius: 8 }}
        >
          📋 Quản lý bài học
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
        <div className="row g-4">
          <div className="col-12">
            <label className="form-label fw-medium small">Tên khóa học *</label>
            <input
              type="text"
              className="form-control"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-medium small">Mô tả ngắn</label>
            <input
              type="text"
              className="form-control"
              value={form.shortDescription ?? ''}
              onChange={(e) => set('shortDescription', e.target.value)}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-medium small">Mô tả đầy đủ</label>
            <textarea
              className="form-control"
              rows={5}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-medium small">Giá (VNĐ)</label>
            <input
              type="number"
              className="form-control"
              min={0}
              value={form.price ?? 0}
              onChange={(e) => set('price', Number(e.target.value))}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-medium small">Trạng thái</label>
            <select
              className="form-select"
              value={form.status ?? 'DRAFT'}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="DRAFT">📝 Nháp</option>
              <option value="PUBLISHED">✅ Xuất bản</option>
              <option value="ARCHIVED">📦 Lưu trữ</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-medium small">Ảnh thumbnail</label>
            <div className="d-flex gap-3 align-items-start">
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="preview"
                  style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8 }}
                />
              ) : (
                <div style={{ width: 120, height: 68, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🖼️
                </div>
              )}
              <div className="flex-grow-1">
                <input
                  type="file"
                  className="form-control form-control-sm mb-2"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="URL ảnh..."
                  value={form.thumbnailUrl ?? ''}
                  onChange={(e) => { set('thumbnailUrl', e.target.value); setThumbnailPreview(e.target.value) }}
                />
              </div>
            </div>
            {uploadPct > 0 && uploadPct < 100 && (
              <div className="progress mt-2" style={{ height: 4 }}>
                <div className="progress-bar bg-primary" style={{ width: `${uploadPct}%` }} />
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/courses')}>
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
