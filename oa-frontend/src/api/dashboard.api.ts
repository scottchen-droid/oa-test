import client from './client'
import type { DashboardData, AnnouncementItem, PaginatedResult } from '@/types'

export const dashboardApi = {
  async get(): Promise<DashboardData> {
    const res = await client.get('/api/dashboard')
    return res.data.data
  },
}

export const announcementsApi = {
  async getAll(params?: { category?: string; type?: string; page?: number; limit?: number }): Promise<PaginatedResult<AnnouncementItem>> {
    const res = await client.get('/api/announcements', { params })
    return res.data.data
  },

  async getOne(id: string): Promise<AnnouncementItem> {
    const res = await client.get(`/api/announcements/${id}`)
    return res.data.data
  },
}
