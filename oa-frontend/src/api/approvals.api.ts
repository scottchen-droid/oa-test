import client from './client'

export const approvalsApi = {
  getPending: (params?: { formType?: string; page?: number; limit?: number }) =>
    client.get('/api/approvals/pending', { params }).then(r => r.data.data),
  getPendingCounts: () =>
    client.get('/api/approvals/pending/counts').then(r => r.data.data),
  getCompleted: (params?: { page?: number; limit?: number }) =>
    client.get('/api/approvals/completed', { params }).then(r => r.data.data),
  getCc: (params?: { page?: number; limit?: number }) =>
    client.get('/api/approvals/cc', { params }).then(r => r.data.data),
  getInstance: (id: string) =>
    client.get(`/api/approvals/instances/${id}`).then(r => r.data.data),
  approve: (id: string, dto: { comment?: string }) =>
    client.post(`/api/approvals/instances/${id}/approve`, dto).then(r => r.data.data),
  reject: (id: string, dto: { comment: string }) =>
    client.post(`/api/approvals/instances/${id}/reject`, dto).then(r => r.data.data),
  getTemplates: (params?: { formType?: string; page?: number; limit?: number }) =>
    client.get('/api/approvals/templates', { params }).then(r => r.data.data),
  getTemplate: (id: string) =>
    client.get(`/api/approvals/templates/${id}`).then(r => r.data.data),
  createTemplate: (dto: any) =>
    client.post('/api/approvals/templates', dto).then(r => r.data.data),
  updateTemplate: (id: string, dto: any) =>
    client.patch(`/api/approvals/templates/${id}`, dto).then(r => r.data.data),
  replaceSteps: (id: string, steps: any[]) =>
    client.put(`/api/approvals/templates/${id}/steps`, { steps }).then(r => r.data.data),
}

export const auditLogsApi = {
  getAll: (params?: { operatorUserId?: string; action?: string; targetType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/audit-logs', { params }).then(r => r.data.data),
  getOne: (id: string) => client.get(`/api/audit-logs/${id}`).then(r => r.data.data),
}
