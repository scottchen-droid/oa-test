import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { usersApi } from '@/api/users.api'
import type { User } from '@/types'
import { LOCALE_STORAGE_KEY, setLocale, type SupportedLocale } from '@/i18n'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))

  const isLoggedIn = computed(() => !!accessToken.value)

  const roleCodes = computed(() =>
    user.value?.userRoles?.map((ur) => ur.role.code) ?? [],
  )

  const permissionCodes = computed(() => {
    const permissions = user.value?.userRoles?.flatMap((ur) =>
      ur.role.rolePermissions?.map((rp) => rp.permission.code) ?? [],
    ) ?? []
    return new Set(permissions)
  })

  function hasPermission(permissionCode?: string): boolean {
    if (!permissionCode) return true
    if (roleCodes.value.includes('ADMIN')) return true
    return permissionCodes.value.has(permissionCode)
  }

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

  function applyLocaleFromUser(u: User | null) {
    if (!u || localStorage.getItem(LOCALE_STORAGE_KEY)) return
    const primaryOrg = u.orgAssignments?.find((a: any) => a.isPrimary)
    const regionLocale = (primaryOrg?.company as any)?.region?.defaultLocale as SupportedLocale | undefined
    if (regionLocale && ['zh-TW', 'zh-CN', 'en'].includes(regionLocale)) {
      setLocale(regionLocale)
    }
  }

  async function login(account: string, password: string) {
    const result = await authApi.login(account, password)
    accessToken.value = result.accessToken
    refreshToken.value = result.refreshToken
    user.value = result.user
    localStorage.setItem('access_token', result.accessToken)
    localStorage.setItem('refresh_token', result.refreshToken)
    // Locale is set after fetchCurrentUser (which has full org data)
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
      applyLocaleFromUser(me)
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
    permissionCodes,
    isManager,
    hasPermission,
    hasModuleAccess,
    login,
    logout,
    fetchCurrentUser,
    clearAuth,
    setTokens,
    applyLocaleFromUser,
  }
})
