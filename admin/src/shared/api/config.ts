import axiosInstance from './axiosInstance'

export interface ConfigItem {
  key: string
  value: string
  description?: string
}

export interface BankInfo {
  id: number
  bankName: string
  accountNumber: string
  accountName: string
  branch?: string
  transferTemplate?: string
  qrImageUrl?: string
  updatedAt: string
}

export const configApi = {
  list: () =>
    axiosInstance.get<ConfigItem[]>('/admin/config'),

  update: (key: string, value: string) =>
    axiosInstance.patch<ConfigItem>(`/admin/config/${key}`, { value }),

  getBankInfo: () =>
    axiosInstance.get<BankInfo>('/admin/config/bank-info'),

  updateBankInfo: (data: Partial<BankInfo>) =>
    axiosInstance.put<BankInfo>('/admin/config/bank-info', data),
}
