import client from './client'

// Purchase Requests
export const purchaseRequestsApi = {
  getAll: (params?: { status?: string; applicantUserId?: string; companyId?: string; page?: number; limit?: number }) =>
    client.get('/api/purchase-requests', { params }).then(r => r.data.data),
  getOne: (id: string) => client.get(`/api/purchase-requests/${id}`).then(r => r.data.data),
  create: (dto: any) => client.post('/api/purchase-requests', dto).then(r => r.data.data),
  update: (id: string, dto: any) => client.patch(`/api/purchase-requests/${id}`, dto).then(r => r.data.data),
  submit: (id: string) => client.post(`/api/purchase-requests/${id}/submit`).then(r => r.data.data),
  cancel: (id: string) => client.post(`/api/purchase-requests/${id}/cancel`).then(r => r.data.data),
}

// Reimbursements
export const reimbursementsApi = {
  getAll: (params?: { status?: string; claimantUserId?: string; companyId?: string; page?: number; limit?: number }) =>
    client.get('/api/reimbursements', { params }).then(r => r.data.data),
  getOne: (id: string) => client.get(`/api/reimbursements/${id}`).then(r => r.data.data),
  create: (dto: any) => client.post('/api/reimbursements', dto).then(r => r.data.data),
  update: (id: string, dto: any) => client.patch(`/api/reimbursements/${id}`, dto).then(r => r.data.data),
  submit: (id: string) => client.post(`/api/reimbursements/${id}/submit`).then(r => r.data.data),
  cancel: (id: string) => client.post(`/api/reimbursements/${id}/cancel`).then(r => r.data.data),
  markPaid: (id: string, dto?: { paidAt?: string; notes?: string }) =>
    client.post(`/api/reimbursements/${id}/pay`, dto).then(r => r.data.data),
}
