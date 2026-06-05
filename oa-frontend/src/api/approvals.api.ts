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
  replaceSteps: (id: string, steps: StepPayload[]) =>
    client.put(`/api/approvals/templates/${id}/steps`, { steps }).then(r => r.data.data),

  // ── 審批對應關聯表 ────────────────────────────────────────────
  listAssignments: (params?: { scopeType?: string; scopeId?: string | null; roleCode?: string; userId?: string; page?: number; limit?: number }) =>
    client.get('/api/approvals/assignments', { params }).then(r => r.data.data),
  addAssignment: (dto: { scopeType: string; scopeId?: string | null; roleCode: string; userId: string }) =>
    client.post('/api/approvals/assignments', dto).then(r => r.data.data),
  removeAssignment: (id: string) =>
    client.delete(`/api/approvals/assignments/${id}`).then(r => r.data.data),
  setDefaultAssignment: (id: string) =>
    client.patch(`/api/approvals/assignments/${id}/default`).then(r => r.data.data),

  // 解析與驗證
  resolveGroup: (roleCode: string, params: { groupType: string; companyId?: string; regionId?: string; businessUnitId?: string; projectId?: string; departmentId?: string; formType?: string }) =>
    client.get(`/api/approvals/resolve/${roleCode}`, { params }).then(r => r.data.data),
  validateForm: (dto: { formType: string; amount?: number; companyId?: string; regionId?: string; businessUnitId?: string; projectId?: string; applicantId?: string }) =>
    client.post('/api/approvals/validate-form', dto).then(r => r.data.data),
}

export interface ApproverConfig {
  approverType: string
  approverUserId?: string
  approverRoleCode?: string
  scopeConfig?: {
    groupType?: 'company' | 'business_unit' | 'project' | 'department' | 'special'
    groupResolution?: 'applicant_company' | 'applicant_bu' | 'specific_bu' | 'applicant_project' | 'specific_project' | 'applicant_department'
    businessUnitId?: string
    projectId?: string
  }
}

export interface StepPayload {
  stepOrder: number
  stepName: string
  approvalMode: string
  isRequired: boolean
  allowDynamicAdding: boolean
  approvers: ApproverConfig[]
}

export const auditLogsApi = {
  getAll: (params?: { operatorUserId?: string; action?: string; targetType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/audit-logs', { params }).then(r => r.data.data),
  getOne: (id: string) => client.get(`/api/audit-logs/${id}`).then(r => r.data.data),
}
