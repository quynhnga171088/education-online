import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { courseApi } from 'src/shared/api/courses'
import { enrollmentApi } from 'src/shared/api/enrollments'
import { configApi } from 'src/shared/api/config'
import { useAuthStore } from 'src/shared/store/authStore'
import { PageSpinner } from 'src/shared/ui/Spinner'
import { formatPrice } from 'src/shared/lib/format'

// S-06: Hướng dẫn thanh toán
export function Component() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseApi.detail(slug!).then((r) => r.data),
    enabled: !!slug,
  })

  const { data: bankInfo, isLoading: bankLoading } = useQuery({
    queryKey: ['bank-info'],
    queryFn: () => configApi.getBankInfo().then((r) => r.data),
  })

  // Find pending enrollment for this course
  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: () =>
      enrollmentApi.list({ page: 0, size: 50 }).then((r) => r.data),
    enabled: !!course,
  })

  const pendingEnrollment = enrollments?.content.find(
    (e) => e.courseId === course?.id && e.status === 'PENDING',
  )

  const uploadMutation = useMutation({
    mutationFn: (file: File) => enrollmentApi.uploadPaymentProof(pendingEnrollment!.id, file),
    onSuccess: () => {
      setUploadSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Upload thất bại.'
      setErrorMsg(msg)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setErrorMsg('')
  }

  const handleUpload = () => {
    if (!selectedFile || !pendingEnrollment) return
    setErrorMsg('')
    uploadMutation.mutate(selectedFile)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => null)
  }

  if (courseLoading || bankLoading) return <PageSpinner />

  if (uploadSuccess) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: 500 }}>
        <div style={{ fontSize: '4rem' }}>✅</div>
        <h4 className="fw-bold mt-3 mb-2">Đã gửi ảnh chuyển khoản!</h4>
        <p className="text-muted mb-4">
          Chúng tôi sẽ xét duyệt trong vòng 24h. Bạn sẽ nhận thông báo qua email khi được duyệt.
        </p>
        <button className="btn btn-primary me-2" onClick={() => navigate('/my-enrollments')}>
          Xem đăng ký của tôi
        </button>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/courses')}>
          Tiếp tục khám phá
        </button>
      </div>
    )
  }

  return (
    <div className="py-5" style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="mb-4">
          <h3 className="fw-bold mb-1">💳 Hướng dẫn thanh toán</h3>
          <p className="text-muted">
            Chuyển khoản và tải lên ảnh xác nhận để đăng ký khóa học
          </p>
        </div>

        {/* Course Summary */}
        {course && (
          <div className="card border-0 shadow-sm mb-4 p-3" style={{ borderRadius: 12 }}>
            <div className="d-flex gap-3 align-items-center">
              <img
                src={course.thumbnailUrl || `https://placehold.co/80x45/4f46e5/fff?text=LMS`}
                alt={course.title}
                style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 8 }}
              />
              <div>
                <div className="fw-semibold">{course.title}</div>
                <div className="text-primary fw-bold">{formatPrice(course.price)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Info */}
        {bankInfo && (
          <div className="card border-0 shadow-sm mb-4 p-4" style={{ borderRadius: 12 }}>
            <h5 className="fw-bold mb-4">🏦 Thông tin chuyển khoản</h5>

            <div className="row g-3">
              {[
                { label: 'Ngân hàng', value: bankInfo.bankName },
                { label: 'Số tài khoản', value: bankInfo.accountNumber },
                { label: 'Chủ tài khoản', value: bankInfo.accountName },
                bankInfo.branch ? { label: 'Chi nhánh', value: bankInfo.branch } : null,
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item!.label} className="col-12">
                    <div
                      className="d-flex justify-content-between align-items-center p-3 rounded"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    >
                      <div>
                        <div className="text-muted small">{item!.label}</div>
                        <div className="fw-semibold">{item!.value}</div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleCopy(item!.value)}
                        title="Sao chép"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}

              {bankInfo.transferTemplate && (
                <div className="col-12">
                  <div
                    className="p-3 rounded"
                    style={{ background: '#fef9c3', border: '1px solid #fde047' }}
                  >
                    <div className="small fw-semibold text-warning mb-1">📝 Nội dung chuyển khoản</div>
                    <div className="fw-medium">
                      {bankInfo.transferTemplate
                        .replace('{studentId}', String(user?.id ?? ''))
                        .replace('{courseId}', String(course?.id ?? ''))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {bankInfo.qrImageUrl && (
              <div className="text-center mt-4">
                <p className="small text-muted mb-2">Hoặc quét mã QR</p>
                <img
                  src={bankInfo.qrImageUrl}
                  alt="QR Code"
                  style={{ maxWidth: 180, borderRadius: 12 }}
                />
              </div>
            )}
          </div>
        )}

        {/* Upload Receipt */}
        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
          <h5 className="fw-bold mb-2">📎 Tải lên ảnh xác nhận thanh toán</h5>
          <p className="text-muted small mb-4">
            Chụp ảnh màn hình xác nhận chuyển khoản và tải lên để chúng tôi xét duyệt.
          </p>

          {!pendingEnrollment && (
            <div className="alert alert-warning small py-2">
              ⚠️ Bạn chưa có đăng ký đang chờ duyệt cho khóa học này.
              <br />
              Vui lòng quay lại <a href={`/courses/${slug}`}>trang khóa học</a> và nhấn "Đăng ký".
            </div>
          )}

          {errorMsg && <div className="alert alert-danger py-2 small">{errorMsg}</div>}

          <div
            className="border border-dashed rounded-3 p-4 text-center mb-3"
            style={{ cursor: 'pointer', borderColor: '#cbd5e1' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8 }}
              />
            ) : (
              <div>
                <div style={{ fontSize: '2rem' }}>📸</div>
                <p className="text-muted small mt-2 mb-0">
                  Nhấn để chọn ảnh hoặc kéo thả vào đây
                </p>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                  JPG, PNG – tối đa 5MB
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="d-none"
            onChange={handleFileChange}
          />

          <button
            className="btn btn-primary w-100 fw-semibold"
            style={{ borderRadius: 10 }}
            disabled={!selectedFile || !pendingEnrollment || uploadMutation.isPending}
            onClick={handleUpload}
          >
            {uploadMutation.isPending ? 'Đang tải lên...' : '✅ Xác nhận đã chuyển khoản'}
          </button>
        </div>
      </div>
    </div>
  )
}
