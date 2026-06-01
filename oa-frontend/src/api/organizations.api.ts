import client from './client'
import type { Region, Company, Department, BusinessUnit, Project, Position, JobLevel } from '@/types'

export const regionsApi = {
  async getAll(isActive?: boolean): Promise<Region[]> {
    const { data } = await client.get('/api/regions', { params: { isActive } })
    return data.data
  },
  async create(payload: Partial<Region>): Promise<Region> {
    const { data } = await client.post('/api/regions', payload)
    return data.data
  },
  async update(id: string, payload: Partial<Region>): Promise<Region> {
    const { data } = await client.patch(`/api/regions/${id}`, payload)
    return data.data
  },
  async toggleActive(id: string): Promise<Region> {
    const { data } = await client.patch(`/api/regions/${id}/toggle-active`)
    return data.data
  },
}

export const companiesApi = {
  async getAll(params?: { regionId?: string; isActive?: boolean }): Promise<Company[]> {
    const { data } = await client.get('/api/companies', { params })
    return data.data
  },
  async create(payload: Partial<Company>): Promise<Company> {
    const { data } = await client.post('/api/companies', payload)
    return data.data
  },
  async update(id: string, payload: Partial<Company>): Promise<Company> {
    const { data } = await client.patch(`/api/companies/${id}`, payload)
    return data.data
  },
  async toggleActive(id: string): Promise<Company> {
    const { data } = await client.patch(`/api/companies/${id}/toggle-active`)
    return data.data
  },
}

export const departmentsApi = {
  async getTree(companyId: string): Promise<Department[]> {
    const { data } = await client.get('/api/departments', { params: { companyId } })
    return data.data
  },
  async getMembers(id: string) {
    const { data } = await client.get(`/api/departments/${id}/members`)
    return data.data
  },
  async create(payload: Partial<Department>): Promise<Department> {
    const { data } = await client.post('/api/departments', payload)
    return data.data
  },
  async update(id: string, payload: Partial<Department>): Promise<Department> {
    const { data } = await client.patch(`/api/departments/${id}`, payload)
    return data.data
  },
}

export const businessUnitsApi = {
  async getAll(isActive?: boolean): Promise<BusinessUnit[]> {
    const { data } = await client.get('/api/business-units', { params: { isActive } })
    return data.data
  },
  async create(payload: Partial<BusinessUnit>): Promise<BusinessUnit> {
    const { data } = await client.post('/api/business-units', payload)
    return data.data
  },
  async update(id: string, payload: Partial<BusinessUnit>): Promise<BusinessUnit> {
    const { data } = await client.patch(`/api/business-units/${id}`, payload)
    return data.data
  },
  async toggleActive(id: string): Promise<BusinessUnit> {
    const { data } = await client.patch(`/api/business-units/${id}/toggle-active`)
    return data.data
  },
}

export const projectsApi = {
  async getAll(params?: { businessUnitId?: string; isActive?: boolean }): Promise<Project[]> {
    const { data } = await client.get('/api/projects', { params })
    return data.data
  },
  async create(payload: Partial<Project>): Promise<Project> {
    const { data } = await client.post('/api/projects', payload)
    return data.data
  },
  async update(id: string, payload: Partial<Project>): Promise<Project> {
    const { data } = await client.patch(`/api/projects/${id}`, payload)
    return data.data
  },
  async toggleActive(id: string): Promise<Project> {
    const { data } = await client.patch(`/api/projects/${id}/toggle-active`)
    return data.data
  },
}

export const positionsApi = {
  async getAll(params?: { companyId?: string; isActive?: boolean }): Promise<Position[]> {
    const { data } = await client.get('/api/positions', { params })
    return data.data
  },
  async create(payload: Partial<Position>): Promise<Position> {
    const { data } = await client.post('/api/positions', payload)
    return data.data
  },
  async update(id: string, payload: Partial<Position>): Promise<Position> {
    const { data } = await client.patch(`/api/positions/${id}`, payload)
    return data.data
  },
}

export const jobLevelsApi = {
  async getAll(isActive?: boolean): Promise<JobLevel[]> {
    const { data } = await client.get('/api/job-levels', { params: { isActive } })
    return data.data
  },
  async create(payload: Partial<JobLevel>): Promise<JobLevel> {
    const { data } = await client.post('/api/job-levels', payload)
    return data.data
  },
  async update(id: string, payload: Partial<JobLevel>): Promise<JobLevel> {
    const { data } = await client.patch(`/api/job-levels/${id}`, payload)
    return data.data
  },
}
