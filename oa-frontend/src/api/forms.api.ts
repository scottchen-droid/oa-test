import client from './client'

export const formsApi = {
  create: (dto: { formType: string; content: Record<string, unknown> }) =>
    client.post('/api/forms', dto).then(r => r.data.data),
  getMyRequests: (params?: { page?: number; limit?: number }) =>
    client.get('/api/forms/my-requests', { params }).then(r => r.data.data),
}
