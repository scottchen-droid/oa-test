import client from './client'
import type { Role, Permission } from '@/types'

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    const { data } = await client.get('/api/roles')
    return data.data
  },

  async create(payload: Partial<Role>): Promise<Role> {
    const { data } = await client.post('/api/roles', payload)
    return data.data
  },

  async update(id: string, payload: Partial<Role>): Promise<Role> {
    const { data } = await client.patch(`/api/roles/${id}`, payload)
    return data.data
  },

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const { data } = await client.post(`/api/roles/${roleId}/permissions`, { permissionIds })
    return data.data
  },
}

export const permissionsApi = {
  async getAll(): Promise<Record<string, Permission[]>> {
    const { data } = await client.get('/api/permissions')
    return data.data
  },
}

export const userRolesApi = {
  async assignRole(userId: string, payload: { roleId: string; scopeType?: string; scopeId?: string }): Promise<void> {
    await client.post(`/api/users/${userId}/roles`, payload)
  },

  async revokeRole(userId: string, userRoleId: string): Promise<void> {
    await client.delete(`/api/users/${userId}/roles/${userRoleId}`)
  },
}
