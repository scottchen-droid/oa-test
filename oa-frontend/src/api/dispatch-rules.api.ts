import client from './client'

export interface DispatchRule {
  id: string
  resourceItemId: string
  resourceItem?: { id: string; name: string }
  workOrderGroupId: string
  workOrderGroup?: { id: string; name: string }
  regionId?: string | null
  companyId?: string | null
  departmentId?: string | null
  businessUnitId?: string | null
  projectId?: string | null
  priority: number
  isEnabled: boolean
}

export const dispatchRulesApi = {
  list: (resourceItemId?: string): Promise<DispatchRule[]> =>
    client.get('/api/system/work-order-dispatch-rules', { params: resourceItemId ? { resourceItemId } : {} }).then(r => r.data.data),
  create: (dto: {
    resourceItemId: string
    workOrderGroupId: string
    regionId?: string
    companyId?: string
    departmentId?: string
    businessUnitId?: string
    projectId?: string
    priority?: number
  }): Promise<DispatchRule> =>
    client.post('/api/system/work-order-dispatch-rules', dto).then(r => r.data.data),
  update: (id: string, dto: Partial<{ priority: number; isEnabled: boolean }>): Promise<DispatchRule> =>
    client.patch(`/api/system/work-order-dispatch-rules/${id}`, dto).then(r => r.data.data),
  delete: (id: string): Promise<void> =>
    client.delete(`/api/system/work-order-dispatch-rules/${id}`).then(r => r.data.data),
}
