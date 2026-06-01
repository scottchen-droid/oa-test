import client from './client'

export const adminApi = {
  // 保留做為未來管理員 API 的入口
  async getServerInfo(): Promise<{ version: string }> {
    const { data } = await client.get('/api/admin/info')
    return data.data
  },
}
