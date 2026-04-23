export function formatPrice(value: number): string {
  if (value === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}:${String(s).padStart(2, '0')}`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h}:${String(rm).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export function buildFileUrl(fileKey?: string | null): string | undefined {
  if (!fileKey) return undefined
  return `${API_BASE_URL}/uploads/${fileKey}`
}
