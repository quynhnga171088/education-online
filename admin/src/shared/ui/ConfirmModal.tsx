import { useState } from 'react'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  extraField?: {
    label: string
    placeholder?: string
    value: string
    onChange: (v: string) => void
  }
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  onConfirm,
  onCancel,
  extraField,
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
        onClick={onCancel}
      />
      {/* Modal */}
      <div
        className="modal fade show d-block"
        style={{ zIndex: 1055 }}
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12 }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button className="btn-close" onClick={onCancel} />
            </div>
            <div className="modal-body">
              <p className="text-secondary">{message}</p>
              {extraField && (
                <div className="mt-2">
                  <label className="form-label fw-medium small">{extraField.label}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder={extraField.placeholder}
                    value={extraField.value}
                    onChange={(e) => extraField.onChange(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer border-0 pt-0">
              <button className="btn btn-outline-secondary btn-sm" onClick={onCancel}>
                {cancelLabel}
              </button>
              <button
                className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? '...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
