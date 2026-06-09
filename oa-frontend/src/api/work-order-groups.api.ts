import client from './client'

export interface WorkOrderGroupMember {
  userId: string
  isLeader: boolean
  user: { displayName: string; employeeNo: string }
}

export interface WorkOrderGroup {
  id: string
  name: string
  description?: string
  isEnabled: boolean
  members: WorkOrderGroupMember[]
}

export const workOrderGroupsApi = {
  adminList: (): Promise<WorkOrderGroup[]> =>
    client.get('/api/system/work-order-groups').then(r => r.data.data),
  create: (dto: { name: string; description?: string }): Promise<WorkOrderGroup> =>
    client.post('/api/system/work-order-groups', dto).then(r => r.data.data),
  update: (id: string, dto: Partial<{ name: string; description: string }>): Promise<WorkOrderGroup> =>
    client.patch(`/api/system/work-order-groups/${id}`, dto).then(r => r.data.data),
  toggle: (id: string): Promise<WorkOrderGroup> =>
    client.patch(`/api/system/work-order-groups/${id}/toggle`).then(r => r.data.data),
  addMember: (groupId: string, userId: string, isLeader = false): Promise<WorkOrderGroup> =>
    client.post(`/api/system/work-order-groups/${groupId}/members`, { userId, isLeader }).then(r => r.data.data),
  removeMember: (groupId: string, userId: string): Promise<void> =>
    client.delete(`/api/system/work-order-groups/${groupId}/members/${userId}`).then(r => r.data.data),
}
