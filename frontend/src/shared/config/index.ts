export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const APP_CONFIG = {
  appName: 'LMS Platform',
  version: '1.0.0',
  tokenKey: 'lms-auth',
} as const
