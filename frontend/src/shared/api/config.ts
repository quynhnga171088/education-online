import axiosInstance from './axiosInstance'

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
  getBankInfo: () =>
    axiosInstance.get<BankInfo>('/admin/config/bank-info'),
}
