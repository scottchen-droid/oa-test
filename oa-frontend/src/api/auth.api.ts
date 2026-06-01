import client from './client'
import type { User } from '@/types'

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

interface RefreshResponse {
  accessToken: string
}

export const authApi = {
  async login(account: string, password: string): Promise<LoginResponse> {
    const { data } = await client.post('/api/auth/login', { account, password })
    return data.data
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const { data } = await client.post('/api/auth/refresh', { refreshToken })
    return data.data
  },

  async logout(): Promise<void> {
    await client.post('/api/auth/logout')
  },

  async forgotPassword(email: string): Promise<void> {
    await client.post('/api/auth/forgot-password', { email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await client.post('/api/auth/reset-password', { token, newPassword })
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await client.post('/api/auth/change-password', { oldPassword, newPassword })
  },
}
