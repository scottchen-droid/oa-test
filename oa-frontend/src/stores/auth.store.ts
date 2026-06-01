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
  const isSuperAdmin = computed(() => user.value?.isSuperAdmin ?? false)

  // Permission helpers — until full RBAC is wired up, admin modules require isSuperAdmin
  // Phase 5 will wire actual permission codes from userRoles/permissions API
  function hasModuleAccess(module: 'hr' | 'finance' | 'administration' | 'system'): boolean {
    if (user.value?.isSuperAdmin) return true
    // TODO: check user.userRoles for module-level permissions
    return false
  }

  // Returns true if current user should see the manager section
  // (has isSuperAdmin OR has any user_roles with approval-related permissions)
  const isManager = computed(() => {
    if (user.value?.isSuperAdmin) return true
    // TODO: derive from userRoles once RBAC is implemented
    return false
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
    isSuperAdmin,
    isManager,
    hasModuleAccess,
    login,
    logout,
    fetchCurrentUser,
    clearAuth,
    setTokens,
  }
})
