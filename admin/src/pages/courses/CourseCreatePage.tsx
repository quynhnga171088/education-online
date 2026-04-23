import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { courseApi, type CreateCourseDto } from '../../shared/api/courses'
import { uploadApi } from '../../shared/api/upload'
import { Spinner } from '../../shared/ui/Spinner'

// A-04: Tạo khóa học
export function Component() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateCourseDto>({
    title: '',
    shortDescription: '',
    description: '',
    price: 0,
    status: 'DRAFT',
    thumbnailUrl: '',
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [uploadPct, setUploadPct] = useState(0)
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      let thumbnailUrl = form.thumbnailUrl
      if (thumbnailFile) {
        const res = await uploadApi.image(thumbnailFile, (p) => setUploadPct(p))
        thumbnailUrl = res.data.fileUrl
      }
      return courseApi.create({ ...form, thumbnailUrl })
    },
    onSuccess: (res) => navigate(`/courses/${res.data.id}/curriculum`),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Tạo khóa học thất bại.'
      setError(msg)
    },
  })

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const set = (k: keyof CreateCourseDto, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/courses')}
          style={{ borderRadius: 8 }}
        >
          ← Quay lại
        </button>
        <div>
          <h4 className="fw-bold mb-0">📚 Tạo khóa học mới</h4>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
        <div className="row g-4">
          {/* Title */}
          <div className="col-12">
            <label className="form-label fw-medium small">Tên khóa học *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tên khóa học..."
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Short description */}
          <div className="col-12">
            <label className="form-label fw-medium small">Mô tả ngắn</label>
            <input
              type="text"
              className="form-control"
              placeholder="Mô tả ngắn (hiển thị trên card)"
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label fw-medium small">Mô tả đầy đủ</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Mô tả chi tiết về khóa học..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Price + Status */}
          <div className="col-md-6">
            <label className="form-label fw-medium small">Giá (VNĐ)</label>
            <input
              type="number"
              className="form-control"
              min={0}
              value={form.price}
              onChange={(e) => set('price', Number(e.target.value))}
            />
            <div className="form-text">Nhập 0 cho khóa học miễn phí</div>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-medium small">Trạng thái</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="DRAFT">📝 Nháp</option>
              <option value="PUBLISHED">✅ Xuất bản</option>
              <option value="ARCHIVED">📦 Lưu trữ</option>
            </select>
          </div>

          {/* Thumbnail */}
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
                <div
                  style={{
                    width: 120,
                    height: 68,
                    background: '#f1f5f9',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
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
                <div className="form-text">Hoặc nhập URL:</div>
                <input
                  type="text"
                  className="form-control form-control-sm mt-1"
                  placeholder="https://..."
                  value={form.thumbnailUrl}
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

        {/* Actions */}
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/courses')}
          >
            Hủy
          </button>
          <button
            className="btn btn-primary btn-sm fw-semibold"
            style={{ borderRadius: 8 }}
            disabled={!form.title || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Spinner size="sm" /> : '✅ Tạo khóa học'}
          </button>
        </div>
      </div>
    </div>
  )
}
