import client from './client'

// Attendance
export const attendanceApi = {
  // HR admin
  getRecords: (params?: { userId?: string; deptId?: string; companyId?: string; status?: string; month?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/attendance/records', { params }).then(r => r.data.data),
  getSummary: (params?: { month?: string; deptId?: string; companyId?: string }) =>
    client.get('/api/attendance/summary', { params }).then(r => r.data.data),
  getOne: (id: string) =>
    client.get(`/api/attendance/records/${id}`).then(r => r.data.data),
  updateRecord: (id: string, dto: any) =>
    client.patch(`/api/attendance/records/${id}`, dto).then(r => r.data.data),
  getClockRecords: (params?: { userId?: string; date?: string }) =>
    client.get('/api/attendance/clock-records', { params }).then(r => r.data.data),
  getClockPatches: (params?: { status?: string; userId?: string; month?: string; startDate?: string; endDate?: string; includeDeleted?: boolean; page?: number; limit?: number }) =>
    client.get('/api/attendance/clock-patches', { params }).then(r => r.data.data),
  approveClockPatch: (id: string) =>
    client.post(`/api/attendance/clock-patches/${id}/approve`).then(r => r.data.data),
  rejectClockPatch: (id: string, reason: string) =>
    client.post(`/api/attendance/clock-patches/${id}/reject`, { reason }).then(r => r.data.data),
  deleteClockPatch: (id: string) =>
    client.delete(`/api/attendance/clock-patches/${id}`).then(r => r.data.data),
  // Employee self-service
  getToday: () =>
    client.get('/api/attendance/today').then(r => r.data.data),
  getMyRecords: (params?: { month?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/attendance/my-records', { params }).then(r => r.data.data),
  getMyClockPatches: (params?: { status?: string; month?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/attendance/my-clock-patches', { params }).then(r => r.data.data),
  clockIn: (dto?: { clockMethod?: string; latitude?: number; longitude?: number; locationName?: string; ipAddress?: string }) =>
    client.post('/api/attendance/clock-in', dto ?? {}).then(r => r.data.data),
  clockOut: (dto?: { clockMethod?: string; latitude?: number; longitude?: number }) =>
    client.post('/api/attendance/clock-out', dto ?? {}).then(r => r.data.data),
  createClockPatch: (dto: { clockType: string; patchDate: string; patchTime: string; reason: string }) =>
    client.post('/api/attendance/clock-patches', dto).then(r => r.data.data),
}

// Leaves
export const leavesApi = {
  // Leave types
  getTypes: () =>
    client.get('/api/leaves/types').then(r => r.data.data),
  createType: (dto: any) =>
    client.post('/api/leaves/types', dto).then(r => r.data.data),
  updateType: (id: string, dto: any) =>
    client.patch(`/api/leaves/types/${id}`, dto).then(r => r.data.data),
  // Leave balances
  getBalances: (params?: { userId?: string; year?: number; leaveTypeId?: string }) =>
    client.get('/api/leaves/balances', { params }).then(r => r.data.data),
  updateBalance: (id: string, dto: any) =>
    client.patch(`/api/leaves/balances/${id}`, dto).then(r => r.data.data),
  initYearBalances: (year: number, companyId?: string) =>
    client.post('/api/leaves/init-year-balances', { year, companyId }).then(r => r.data.data),
  // Leave requests — employee (自己的, 不含已刪除)
  getMy: (params?: { leaveTypeId?: string; status?: string; month?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/leaves/my', { params }).then(r => r.data.data),
  // Leave requests — HR (全部, 含已刪除)
  getAll: (params?: { userId?: string; leaveTypeId?: string; status?: string; month?: string; startDate?: string; endDate?: string; companyId?: string; deptId?: string; includeDeleted?: boolean; page?: number; limit?: number }) =>
    client.get('/api/leaves', { params }).then(r => r.data.data),
  getOne: (id: string) =>
    client.get(`/api/leaves/${id}`).then(r => r.data.data),
  create: (dto: any) =>
    client.post('/api/leaves', dto).then(r => r.data.data),
  update: (id: string, dto: any) =>
    client.patch(`/api/leaves/${id}`, dto).then(r => r.data.data),
  cancel: (id: string) =>
    client.post(`/api/leaves/${id}/cancel`).then(r => r.data.data),
  softDelete: (id: string) =>
    client.delete(`/api/leaves/${id}`).then(r => r.data.data),
  approve: (id: string, comment?: string) =>
    client.post(`/api/leaves/${id}/approve`, { comment }).then(r => r.data.data),
  reject: (id: string, reason: string) =>
    client.post(`/api/leaves/${id}/reject`, { reason }).then(r => r.data.data),
}

// Overtime
export const overtimeApi = {
  getMy: (params?: { status?: string; month?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    client.get('/api/overtime/my', { params }).then(r => r.data.data),
  getAll: (params?: { userId?: string; status?: string; month?: string; startDate?: string; endDate?: string; includeDeleted?: boolean; page?: number; limit?: number }) =>
    client.get('/api/overtime', { params }).then(r => r.data.data),
  getOne: (id: string) =>
    client.get(`/api/overtime/${id}`).then(r => r.data.data),
  create: (dto: any) =>
    client.post('/api/overtime', dto).then(r => r.data.data),
  update: (id: string, dto: any) =>
    client.patch(`/api/overtime/${id}`, dto).then(r => r.data.data),
  softDelete: (id: string) =>
    client.delete(`/api/overtime/${id}`).then(r => r.data.data),
  approve: (id: string) =>
    client.post(`/api/overtime/${id}/approve`).then(r => r.data.data),
  reject: (id: string, reason: string) =>
    client.post(`/api/overtime/${id}/reject`, { reason }).then(r => r.data.data),
}

// Payroll
export const payrollApi = {
  // Periods
  getPeriods: (params?: { year?: number; status?: string; page?: number; limit?: number }) =>
    client.get('/api/payroll/periods', { params }).then(r => r.data.data),
  getPeriod: (id: string) =>
    client.get(`/api/payroll/periods/${id}`).then(r => r.data.data),
  createPeriod: (dto: any) =>
    client.post('/api/payroll/periods', dto).then(r => r.data.data),
  updatePeriod: (id: string, dto: any) =>
    client.patch(`/api/payroll/periods/${id}`, dto).then(r => r.data.data),
  lockPeriod: (id: string) =>
    client.post(`/api/payroll/periods/${id}/lock`).then(r => r.data.data),
  // Records
  getRecords: (params?: { periodId?: string; userId?: string; page?: number; limit?: number }) =>
    client.get('/api/payroll/records', { params }).then(r => r.data.data),
  calculateRecords: (periodId: string) =>
    client.post('/api/payroll/records/calculate', { periodId }).then(r => r.data.data),
  // Salary structures
  getStructures: (params?: { userId?: string; page?: number; limit?: number }) =>
    client.get('/api/payroll/structures', { params }).then(r => r.data.data),
  createStructure: (dto: any) =>
    client.post('/api/payroll/structures', dto).then(r => r.data.data),
  updateStructure: (id: string, dto: any) =>
    client.patch(`/api/payroll/structures/${id}`, dto).then(r => r.data.data),
  // Self-service
  getMyPayslips: (year?: number) =>
    client.get('/api/payroll/my-payslips', { params: year ? { year } : undefined }).then(r => r.data.data),
}

// Performance
export const performanceApi = {
  // Cycles
  getCycles: (params?: { status?: string; page?: number; limit?: number }) =>
    client.get('/api/performance/cycles', { params }).then(r => r.data.data),
  getCycle: (id: string) =>
    client.get(`/api/performance/cycles/${id}`).then(r => r.data.data),
  createCycle: (dto: any) =>
    client.post('/api/performance/cycles', dto).then(r => r.data.data),
  updateCycle: (id: string, dto: any) =>
    client.patch(`/api/performance/cycles/${id}`, dto).then(r => r.data.data),
  activateCycle: (id: string) =>
    client.post(`/api/performance/cycles/${id}/activate`).then(r => r.data.data),
  completeCycle: (id: string) =>
    client.post(`/api/performance/cycles/${id}/complete`).then(r => r.data.data),
  // Goals
  getGoals: (params?: { cycleId?: string; userId?: string; page?: number; limit?: number }) =>
    client.get('/api/performance/goals', { params }).then(r => r.data.data),
  createGoal: (dto: any) =>
    client.post('/api/performance/goals', dto).then(r => r.data.data),
  updateGoal: (id: string, dto: any) =>
    client.patch(`/api/performance/goals/${id}`, dto).then(r => r.data.data),
  // Reviews
  getReviews: (params?: { cycleId?: string; revieweeUserId?: string; reviewerUserId?: string; status?: string; page?: number; limit?: number }) =>
    client.get('/api/performance/reviews', { params }).then(r => r.data.data),
  createReview: (dto: any) =>
    client.post('/api/performance/reviews', dto).then(r => r.data.data),
  updateReview: (id: string, dto: any) =>
    client.patch(`/api/performance/reviews/${id}`, dto).then(r => r.data.data),
}
