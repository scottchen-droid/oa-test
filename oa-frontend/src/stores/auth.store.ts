import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { usersApi } from '@/api/users.api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))

  const isLoggedIn = computed(() => !!accessToken.value)

  const roleCodes = computed(() =>
    user.value?.userRoles?.map((ur) => ur.role.code) ?? [],
  )

  // 模塊存取：以角色碼判斷，ADMIN 角色擁有所有模塊
  function hasModuleAccess(module: 'hr' | 'finance' | 'administration' | 'system'): boolean {
    if (!user.value) return false
    if (roleCodes.value.includes('ADMIN')) return true
    const ACCESS_MAP: Record<string, string[]> = {
      hr:             ['HR_ADMIN'],
      finance:        ['FINANCE_ADMIN'],
      administration: ['HR_ADMIN', 'FINANCE_ADMIN', 'DEPT_MANAGER'],
      system:         [],
    }
    return ACCESS_MAP[module]?.some((r) => roleCodes.value.includes(r)) ?? false
  }

  // 是否顯示主管功能區塊
  const isManager = computed(() => {
    if (!user.value) return false
    const managerRoles = ['ADMIN', 'DEPT_MANAGER', 'APPROVER', 'HR_ADMIN', 'FINANCE_ADMIN']
    return roleCodes.value.some((r) => managerRoles.includes(r))
  })

  async function login(account: string, password: string) {
    const result = await authApi.login(account, password)
    accessToken.value = result.accessToken
    refreshToken.value = result.refreshToken
    user.value = result.user
    localStorage.setItem('access_token', result.accessToken)
    localStorage.setItem('refresh_token', result.refreshToken)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
    }
  }

  async function fetchCurrentUser() {
    if (!accessToken.value) return
    try {
      const me = await usersApi.getOne('me')
      user.value = me
    } catch {
      clearAuth()
    }
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  function setTokens(newAccessToken: string, newRefreshToken?: string) {
    accessToken.value = newAccessToken
    localStorage.setItem('access_token', newAccessToken)
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken
      localStorage.setItem('refresh_token', newRefreshToken)
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoggedIn,
    roleCodes,
    isManager,
    hasModuleAccess,
    login,
    logout,
    fetchCurrentUser,
    clearAuth,
    setTokens,
  }
})
