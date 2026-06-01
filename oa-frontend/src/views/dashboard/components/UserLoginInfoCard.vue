<template>
  <div class="login-info-card">
    <div class="card-header">
      <span class="card-title">登入資訊</span>
      <el-button
        type="danger"
        text
        size="small"
        :loading="loggingOut"
        @click="handleLogout"
      >
        登出
      </el-button>
    </div>

    <div v-if="loading" class="skeleton-wrap">
      <el-skeleton :rows="4" animated />
    </div>
    <template v-else-if="user">
      <div class="user-name-row">
        <el-avatar :size="36" class="avatar">{{ initial }}</el-avatar>
        <div>
          <div class="user-name">{{ user.chineseName }}<span v-if="user.englishName" class="name-en"> {{ user.englishName }}</span></div>
          <div v-if="user.loginIp" class="login-ip">{{ user.loginIp }}</div>
        </div>
      </div>

      <div class="info-rows">
        <div class="info-row">
          <span class="info-label">公司名稱</span>
          <span class="info-value">{{ user.companyName || '—' }}</span>
        </div>
        <div v-if="user.companyCode" class="info-row">
          <span class="info-label">公司代碼</span>
          <span class="info-value">{{ user.companyCode }}</span>
        </div>
        <div v-if="user.employeeNo" class="info-row">
          <span class="info-label">員工編號</span>
          <span class="info-value">{{ user.employeeNo }}</span>
        </div>
        <div v-if="user.departmentName" class="info-row">
          <span class="info-label">部門</span>
          <span class="info-value">{{ user.departmentName }}<span v-if="user.positionName"> [{{ user.positionName }}]</span></span>
        </div>
        <div v-if="user.roleName" class="info-row">
          <span class="info-label">系統角色</span>
          <span class="info-value">{{ user.roleName }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { DashboardCurrentUser } from '@/types'

const props = defineProps<{
  user?: DashboardCurrentUser
  loading?: boolean
}>()

const auth = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)

const initial = computed(() => props.user?.chineseName?.[0] ?? 'U')

async function handleLogout() {
  await ElMessageBox.confirm('確定要登出系統嗎？', '確認登出', {
    confirmButtonText: '確定登出',
    cancelButtonText: '取消',
    type: 'warning',
  })
  loggingOut.value = true
  try {
    await auth.logout()
    router.push('/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.login-info-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}
.user-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f3f4f6;
}
.avatar {
  background-color: #4d7cfe;
  color: #fff;
  flex-shrink: 0;
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}
.name-en {
  font-weight: 400;
  color: #6b7280;
  font-size: 12px;
}
.login-ip {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}
.info-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.info-value {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}
.skeleton-wrap {
  padding: 4px 0;
}
</style>
