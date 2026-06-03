import client from './client'
import type { EmployeeProfile, PaginatedResult, User } from '@/types'

export const employeesApi = {
  async getAll(params?: {
    search?: string
    companyId?: string
    departmentId?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResult<User>> {
    const { data } = await client.get('/api/employees', { params })
    return data.data
  },

  async getOne(id: string): Promise<User> {
    const { data } = await client.get(`/api/employees/${id}`)
    return data.data
  },

  async create(payload: {
    email: string
    displayName: string
    nameZh?: string
    employeeNo?: string
    hireDate?: string
    employmentType?: string
    companyId?: string
    departmentId?: string
    positionId?: string
    jobLevelId?: string
  }): Promise<User> {
    const { data } = await client.post('/api/employees', payload)
    return data.data
  },

  async update(id: string, payload: Partial<EmployeeProfile & User>): Promise<User> {
    const { data } = await client.patch(`/api/employees/${id}`, payload)
    return data.data
  },

  async updateSensitiveData(id: string, payload: {
    idNumber?: string
    passportNo?: string
    bankAccountNo?: string
    bankName?: string
    bankBranch?: string
  }): Promise<void> {
    await client.patch(`/api/employees/${id}/sensitive`, payload)
  },

  async updateOrgAssignment(id: string, payload: {
    regionId?: string
    companyId?: string
    businessUnitId?: string
    projectId?: string
    departmentId?: string
    positionId?: string
    jobLevelId?: string
    directManagerUserId?: string
    assignmentType?: string
  }): Promise<User> {
    const { data } = await client.patch(`/api/employees/${id}/org-assignment`, payload)
    return data.data
  },

  async offboard(id: string, payload: {
    resignationDate: string
    lastWorkingDate: string
    terminationType?: string
    terminationReason?: string
  }): Promise<User> {
    const { data } = await client.post(`/api/employees/${id}/offboard`, payload)
    return data.data
  },
}
