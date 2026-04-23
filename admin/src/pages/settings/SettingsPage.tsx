import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configApi, type ConfigItem, type BankInfo } from '../../shared/api/config'
import { PageSpinner, Spinner } from '../../shared/ui/Spinner'
import { uploadApi } from '../../shared/api/upload'

function SystemConfigs() {
  const queryClient = useQueryClient()
  const { data: configs, isLoading } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configApi.list().then((r) => r.data),
  })

  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (configs) {
      setEditValues(Object.fromEntries(configs.map((c) => [c.key, c.value])))
    }
  }, [configs])

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      configApi.update(key, value),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['configs'] })
      setSaving((s) => ({ ...s, [key]: false }))
      setSaved((s) => ({ ...s, [key]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000)
    },
    onSettled: (_, __, { key }) => setSaving((s) => ({ ...s, [key]: false })),
  })

  const handleSave = (cfg: ConfigItem) => {
    setSaving((s) => ({ ...s, [cfg.key]: true }))
    updateMutation.mutate({ key: cfg.key, value: editValues[cfg.key] ?? cfg.value })
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
      <div className="card-body p-0">
        <div className="px-4 py-3 border-bottom">
          <h6 className="fw-bold mb-0">⚙️ Cấu hình hệ thống</h6>
          <p className="text-muted small mb-0">Các biến cấu hình toàn cục</p>
        </div>
        <div className="p-4">
          {configs?.map((cfg) => (
            <div key={cfg.key} className="mb-4 pb-4 border-bottom last:border-0">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <code
                    className="text-primary"
                    style={{ fontSize: '0.85rem', background: '#f0f4ff', padding: '2px 8px', borderRadius: 4 }}
                  >
                    {cfg.key}
                  </code>
                  {cfg.description && (
                    <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                      {cfg.description}
                    </div>
                  )}
                </div>
                {saved[cfg.key] && (
                  <span className="text-success small">✅ Đã lưu</span>
                )}
              </div>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={editValues[cfg.key] ?? ''}
                  onChange={(e) =>
                    setEditValues((v) => ({ ...v, [cfg.key]: e.target.value }))
                  }
                />
                <button
                  className="btn btn-sm btn-primary flex-shrink-0"
                  style={{ borderRadius: 8 }}
                  disabled={saving[cfg.key] || editValues[cfg.key] === cfg.value}
                  onClick={() => handleSave(cfg)}
                >
                  {saving[cfg.key] ? <Spinner size="sm" /> : '💾 Lưu'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BankInfoForm() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['bank-info'],
    queryFn: () => configApi.getBankInfo().then((r) => r.data),
  })

  const [form, setForm] = useState<Partial<BankInfo>>({})
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string>('')
  const [uploadPct, setUploadPct] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data) {
      setForm({
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        branch: data.branch ?? '',
        transferTemplate: data.transferTemplate ?? '',
        qrImageUrl: data.qrImageUrl ?? '',
      })
      setQrPreview(data.qrImageUrl ?? '')
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async () => {
      let qrImageUrl = form.qrImageUrl
      if (qrFile) {
        const res = await uploadApi.image(qrFile, setUploadPct)
        qrImageUrl = res.data.fileUrl
      }
      return configApi.updateBankInfo({ ...form, qrImageUrl })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-info'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: () => setError('Lưu thất bại.'),
  })

  const set = (k: keyof BankInfo, v: string) => setForm((f) => ({ ...f, [k]: v }))

  if (isLoading) return <PageSpinner />

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
      <div className="card-body p-0">
        <div className="px-4 py-3 border-bottom">
          <h6 className="fw-bold mb-0">🏦 Thông tin thanh toán</h6>
          <p className="text-muted small mb-0">Thông tin chuyển khoản hiển thị cho học viên</p>
        </div>
        <div className="p-4">
          {success && <div className="alert alert-success py-2 small mb-3">✅ Đã lưu thành công!</div>}
          {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium small">Tên ngân hàng *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Vietcombank"
                value={form.bankName ?? ''}
                onChange={(e) => set('bankName', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium small">Số tài khoản *</label>
              <input
                type="text"
                className="form-control"
                placeholder="1234567890"
                value={form.accountNumber ?? ''}
                onChange={(e) => set('accountNumber', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium small">Tên chủ tài khoản *</label>
              <input
                type="text"
                className="form-control"
                placeholder="NGUYEN VAN A"
                value={form.accountName ?? ''}
                onChange={(e) => set('accountName', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium small">Chi nhánh</label>
              <input
                type="text"
                className="form-control"
                placeholder="Hà Nội"
                value={form.branch ?? ''}
                onChange={(e) => set('branch', e.target.value)}
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-medium small">Nội dung chuyển khoản mẫu</label>
              <input
                type="text"
                className="form-control"
                placeholder="LMS {studentId} {courseId}"
                value={form.transferTemplate ?? ''}
                onChange={(e) => set('transferTemplate', e.target.value)}
              />
              <div className="form-text">
                Dùng <code>{'{{studentId}}'}</code> và <code>{'{{courseId}}'}</code> làm biến động
              </div>
            </div>
            <div className="col-12">
              <label className="form-label fw-medium small">Ảnh QR Code</label>
              <div className="d-flex gap-3 align-items-start">
                {qrPreview ? (
                  <img
                    src={qrPreview}
                    alt="QR"
                    style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                ) : (
                  <div
                    style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    📱
                  </div>
                )}
                <div className="flex-grow-1">
                  <input
                    type="file"
                    className="form-control form-control-sm mb-2"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) { setQrFile(f); setQrPreview(URL.createObjectURL(f)) }
                    }}
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="URL QR code..."
                    value={form.qrImageUrl ?? ''}
                    onChange={(e) => { set('qrImageUrl', e.target.value); setQrPreview(e.target.value) }}
                  />
                </div>
              </div>
              {uploadPct > 0 && uploadPct < 100 && (
                <div className="progress mt-2" style={{ height: 4 }}>
                  <div className="progress-bar" style={{ width: `${uploadPct}%` }} />
                </div>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <button
              className="btn btn-primary btn-sm fw-semibold"
              style={{ borderRadius: 8 }}
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? <Spinner size="sm" /> : '💾 Lưu thông tin ngân hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// A-14: Cấu hình hệ thống
export function Component() {
  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-0">⚙️ Cấu hình hệ thống</h4>
        <p className="text-muted small mb-0">Quản lý các tham số và thông tin thanh toán</p>
      </div>
      <SystemConfigs />
      <BankInfoForm />
    </div>
  )
}
