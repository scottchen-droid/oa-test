import client from './client'

export const formsApi = {
  // 正式申請
  create: (dto: { formType: string; content: Record<string, unknown> }) =>
    client.post('/api/forms', dto).then(r => r.data.data),
  getMyRequests: (params?: { page?: number; limit?: number }) =>
    client.get('/api/forms/my-requests', { params }).then(r => r.data.data),
  copyRequest: (id: string) =>
    client.post(`/api/forms/${id}/copy`).then(r => r.data.data),

  // 草稿
  saveDraft: (dto: { formType: string; title?: string; content: Record<string, unknown> }) =>
    client.post('/api/forms/drafts', dto).then(r => r.data.data),
  getMyDrafts: (params?: { page?: number; limit?: number }) =>
    client.get('/api/forms/drafts', { params }).then(r => r.data.data),
  updateDraft: (id: string, dto: { title?: string; content?: Record<string, unknown> }) =>
    client.patch(`/api/forms/drafts/${id}`, dto).then(r => r.data.data),
  deleteDraft: (id: string) =>
    client.delete(`/api/forms/drafts/${id}`).then(r => r.data.data),
  submitDraft: (id: string) =>
    client.post(`/api/forms/drafts/${id}/submit`).then(r => r.data.data),

  // 填寫模板
  createFillTemplate: (dto: { formType: string; name: string; description?: string; content: Record<string, unknown>; isFavorite?: boolean }) =>
    client.post('/api/forms/fill-templates', dto).then(r => r.data.data),
  getMyFillTemplates: (params?: { formType?: string; page?: number; limit?: number }) =>
    client.get('/api/forms/fill-templates', { params }).then(r => r.data.data),
  updateFillTemplate: (id: string, dto: { name?: string; description?: string; content?: Record<string, unknown>; isFavorite?: boolean; isEnabled?: boolean }) =>
    client.patch(`/api/forms/fill-templates/${id}`, dto).then(r => r.data.data),
  deleteFillTemplate: (id: string) =>
    client.delete(`/api/forms/fill-templates/${id}`).then(r => r.data.data),
  useFillTemplate: (id: string) =>
    client.post(`/api/forms/fill-templates/${id}/use`).then(r => r.data.data),
}
