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

  // Employee approver roles
  getEmployeeApproverRoles: (userId: string) =>
    client.get(`/api/approvals/employee-approver-roles/${userId}`).then(r => r.data.data),

  /** 查詢某職能角色的現持有人（用於新增前的衝突檢查） */
  findApproverRoleHolder: (params: { roleType: string; scopeType: string; scopeId?: string }) =>
    client.get('/api/approvals/approver-role-holder', { params }).then(r => r.data.data),

  /** 查詢某公司/集團所有職能角色的持有人 */
  listApproverRoleHolders: (params?: { scopeType?: string; scopeId?: string }) =>
    client.get('/api/approvals/approver-role-holders', { params }).then(r => r.data.data),

  /**
   * 指派職能角色。
   * forceReplace=true：若已有其他人持有則自動轉移（停用舊持有人，啟用新持有人）
   * forceReplace=false（預設）：若有衝突拋出 409，附帶 currentHolder 資訊
   */
  createEmployeeApproverRole: (userId: string, dto: EmployeeApproverRoleDto & { forceReplace?: boolean }) =>
    client.post(`/api/approvals/employee-approver-roles/${userId}`, dto).then(r => r.data.data),

  deleteEmployeeApproverRole: (roleId: string) =>
    client.delete(`/api/approvals/employee-approver-roles/${roleId}`).then(r => r.data.data),
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

export interface EmployeeApproverRoleDto {
  roleType: string      // hr_specialist | hr_manager | finance_specialist | finance_manager | company_head
  scopeType: string     // company | group
  scopeId?: string      // companyId（scopeType=company 時）
  startedAt?: string
  endedAt?: string
}

export const auditLogsApi = {
  getAll: (params?: { operatorUserId?: string; action?: string; targetType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/audit-logs', { params }).then(r => r.data.data),
  getOne: (id: string) => client.get(`/api/audit-logs/${id}`).then(r => r.data.data),
}
