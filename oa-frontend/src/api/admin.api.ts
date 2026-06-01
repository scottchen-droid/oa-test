import client from './client'

export const adminApi = {
  async getBootstrapStatus(): Promise<{ needed: boolean }> {
    const { data } = await client.get('/api/admin/bootstrap/status')
    return data.data
  },

  async bootstrap(payload: {
    email: string
    displayName: string
    password: string
  }): Promise<{ message: string; user: { id: string; email: string; displayName: string } }> {
    const { data } = await client.post('/api/admin/bootstrap', payload)
    return data.data
  },
}
