import client from './client'

export interface ResourceItem {
  id: string
  code: string
  name: string
  category: string
  responsibleUnit?: string
  availableOnOnboard: boolean
  availableOnAdd: boolean
  availableOnChange: boolean
  requiredOnOffboard: boolean
  requiresAccountFill: boolean
  isEnabled: boolean
  sortOrder: number
}

export const resourceItemsApi = {
  list: (): Promise<ResourceItem[]> =>
    client.get('/api/resource-items').then(r => r.data.data),
  adminList: (): Promise<ResourceItem[]> =>
    client.get('/api/system/resource-items').then(r => r.data.data),
  create: (dto: {
    code: string
    name: string
    category: string
    responsibleUnit?: string
    availableOnOnboard?: boolean
    requiredOnOffboard?: boolean
    availableOnAdd?: boolean
    availableOnChange?: boolean
    requiresAccountFill?: boolean
    sortOrder?: number
  }): Promise<ResourceItem> =>
    client.post('/api/system/resource-items', dto).then(r => r.data.data),
  update: (id: string, dto: object): Promise<ResourceItem> =>
    client.patch(`/api/system/resource-items/${id}`, dto).then(r => r.data.data),
  toggle: (id: string): Promise<ResourceItem> =>
    client.patch(`/api/system/resource-items/${id}/toggle`).then(r => r.data.data),
}
