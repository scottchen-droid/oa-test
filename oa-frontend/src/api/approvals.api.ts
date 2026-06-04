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

  // ── 審批群組 ──────────────────────────────────────────────────
  getGroups: (params?: { roleCode?: string; page?: number; limit?: number }) =>
    client.get('/api/approvals/groups', { params }).then(r => r.data.data),
  getGroup: (id: string) =>
    client.get(`/api/approvals/groups/${id}`).then(r => r.data.data),
  createGroup: (dto: { name: string; roleCode: string; mode?: string; description?: string }) =>
    client.post('/api/approvals/groups', dto).then(r => r.data.data),
  updateGroup: (id: string, dto: Partial<{ name: string; mode: string; description: string; isActive: boolean }>) =>
    client.patch(`/api/approvals/groups/${id}`, dto).then(r => r.data.data),

  // 成員
  addGroupMember: (groupId: string, dto: { userId: string; memberType?: string; startedAt?: string; endedAt?: string }) =>
    client.post(`/api/approvals/groups/${groupId}/members`, dto).then(r => r.data.data),
  removeGroupMember: (memberId: string) =>
    client.delete(`/api/approvals/group-members/${memberId}`).then(r => r.data.data),

  // 服務範圍
  addGroupScope: (groupId: string, dto: { scopeType: string; scopeId?: string; formType?: string }) =>
    client.post(`/api/approvals/groups/${groupId}/scopes`, dto).then(r => r.data.data),
  removeGroupScope: (scopeId: string) =>
    client.delete(`/api/approvals/group-scopes/${scopeId}`).then(r => r.data.data),

  // 解析與驗證
  resolveGroup: (roleCode: string, params?: { companyId?: string; regionId?: string; businessUnitId?: string; projectId?: string; formType?: string }) =>
    client.get(`/api/approvals/groups/resolve/${roleCode}`, { params }).then(r => r.data.data),
  validateForm: (dto: { formType: string; amount?: number; companyId?: string; regionId?: string; businessUnitId?: string; projectId?: string; applicantId?: string }) =>
    client.post('/api/approvals/validate-form', dto).then(r => r.data.data),
}

export interface ApproverConfig {
  approverType: string
  approverUserId?: string
  approverRoleCode?: string
  scopeConfig?: {
    projectResolution?: 'applicant_project' | 'specific_project'
    projectId?: string
    departmentResolution?: 'applicant_department' | 'specific_department'
    departmentId?: string
    buResolution?: 'applicant_bu' | 'specific_bu'
    businessUnitId?: string
    companyResolution?: 'applicant_company' | 'specific_company'
    companyId?: string
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

export interface ApprovalGroupDto {
  name: string
  roleCode: string
  mode?: 'primary' | 'any'
  description?: string
}

export const auditLogsApi = {
  getAll: (params?: { operatorUserId?: string; action?: string; targetType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/audit-logs', { params }).then(r => r.data.data),
  getOne: (id: string) => client.get(`/api/audit-logs/${id}`).then(r => r.data.data),
}
