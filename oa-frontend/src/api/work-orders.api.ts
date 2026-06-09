import client from './client'

export interface WorkOrderHistory {
  id: string
  action: string
  fromStatus: string | null
  toStatus: string | null
  content: string | null
  createdAt: string
  operatorUser: { displayName: string }
}

export interface WorkOrder {
  id: string
  requestId: string
  resourceItemId: string
  resourceItem: { id: string; code: string; name: string; category: string; requiresAccountFill?: boolean }
  workOrderGroupId: string | null
  workOrderGroup: { id: string; name: string } | null
  assignedUserId: string | null
  status: 'pending_dispatch' | 'dispatch_error' | 'pending' | 'processing' | 'completed' | 'failed' | 'returned' | 'canceled'
  dispatchErrorMsg: string | null
  resultData: Record<string, unknown> | null
  completedAt: string | null
  createdAt: string
  request: {
    id: string
    requestType: 'onboard' | 'add' | 'change' | 'offboard'
    targetUser: { id: string; displayName: string; employeeNo: string }
    status: string
  }
  histories: WorkOrderHistory[]
}

export interface PaginatedWorkOrders {
  items: WorkOrder[]
  total: number
}

export const workOrdersApi = {
  getMine: (params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedWorkOrders> =>
    client.get('/api/work-orders/mine', { params }).then(r => r.data.data),
  getGroupOrders: (params?: { groupId?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedWorkOrders> =>
    client.get('/api/work-orders/group', { params }).then(r => r.data.data),
  getByRequest: (requestId: string): Promise<WorkOrder[]> =>
    client.get(`/api/work-orders/request/${requestId}`).then(r => r.data.data),
  start: (id: string): Promise<WorkOrder> =>
    client.post(`/api/work-orders/${id}/start`).then(r => r.data.data),
  complete: (id: string, resultData?: Record<string, string>): Promise<WorkOrder> =>
    client.post(`/api/work-orders/${id}/complete`, { resultData }).then(r => r.data.data),
  fail: (id: string, reason: string): Promise<WorkOrder> =>
    client.post(`/api/work-orders/${id}/fail`, { reason }).then(r => r.data.data),
  return: (id: string, reason: string): Promise<WorkOrder> =>
    client.post(`/api/work-orders/${id}/return`, { reason }).then(r => r.data.data),
  reassign: (id: string, newGroupId: string, reason: string): Promise<WorkOrder> =>
    client.post(`/api/work-orders/${id}/reassign`, { newGroupId, reason }).then(r => r.data.data),
  addNote: (id: string, content: string): Promise<WorkOrder> =>
    client.post(`/api/work-orders/${id}/note`, { content }).then(r => r.data.data),
}
