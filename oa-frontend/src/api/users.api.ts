import client from './client'
import type { User, PaginatedResult } from '@/types'

export const usersApi = {
  async getAll(params?: {
    search?: string; status?: string; companyId?: string
    departmentId?: string; page?: number; limit?: number
  }): Promise<PaginatedResult<User>> {
    const { data } = await client.get('/api/users', { params })
    return data.data
  },

  async getOne(id: string): Promise<User> {
    const { data } = await client.get(`/api/users/${id}`)
    return data.data
  },

  async create(payload: { email: string; displayName: string; nameZh?: string; employeeNo?: string }): Promise<User> {
    const { data } = await client.post('/api/users', payload)
    return data.data
  },

  async update(id: string, payload: Partial<User>): Promise<User> {
    const { data } = await client.patch(`/api/users/${id}`, payload)
    return data.data
  },

  async updateStatus(id: string, status: string): Promise<User> {
    const { data } = await client.patch(`/api/users/${id}/status`, { status })
    return data.data
  },

  async resetPassword(id: string): Promise<void> {
    await client.post(`/api/users/${id}/reset-password`)
  },
}
