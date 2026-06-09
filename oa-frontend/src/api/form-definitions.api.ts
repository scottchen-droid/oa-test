import client from './client'

export interface FormDefinition {
  id: string
  formType: string
  name: string
  category: string
  description?: string
  icon?: string
  iconColor?: string
  isEnabled: boolean
  allowDraft: boolean
  allowFillTemplate: boolean
  allowCopyHistory: boolean
  sortOrder: number
}

export interface FormPermissionRule {
  id?: string
  targetType: string
  targetId?: string
  targetName?: string
}

export interface AdminCreateFormDefinitionDto {
  formType: string
  name: string
  category: string
  description?: string
  icon?: string
  iconColor?: string
  sortOrder?: number
}

export interface AdminUpdateFormDefinitionDto {
  name?: string
  category?: string
  description?: string
  icon?: string
  iconColor?: string
  isEnabled?: boolean
  allowDraft?: boolean
  allowFillTemplate?: boolean
  allowCopyHistory?: boolean
  sortOrder?: number
}

export const formDefinitionsApi = {
  // 員工端：取得目前登入者可申請的表單
  getAccessible: (): Promise<FormDefinition[]> =>
    client.get('/api/forms/definitions').then(r => r.data.data),

  // 管理端
  adminList: (): Promise<FormDefinition[]> =>
    client.get('/api/system/form-definitions').then(r => r.data.data),
  adminCreate: (dto: AdminCreateFormDefinitionDto): Promise<FormDefinition> =>
    client.post('/api/system/form-definitions', dto).then(r => r.data.data),
  adminUpdate: (id: string, dto: AdminUpdateFormDefinitionDto): Promise<FormDefinition> =>
    client.patch(`/api/system/form-definitions/${id}`, dto).then(r => r.data.data),
  getPermissions: (id: string): Promise<FormPermissionRule[]> =>
    client.get(`/api/system/form-definitions/${id}/permissions`).then(r => r.data.data),
  setPermissions: (id: string, rules: { targetType: string; targetId?: string }[]): Promise<FormPermissionRule[]> =>
    client.put(`/api/system/form-definitions/${id}/permissions`, { rules }).then(r => r.data.data),
}
