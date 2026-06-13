<template>
  <div class="login-info-card">
    <div class="card-header">
      <span class="card-title">{{ t('shell.dashboard.loginInfo') }}</span>
      <el-button
        type="danger"
        text
        size="small"
        :loading="loggingOut"
        @click="handleLogout"
      >
        {{ t('auth.logout') }}
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
          <span class="info-label">{{ t('shell.dashboard.companyName') }}</span>
          <span class="info-value">{{ user.companyName || '—' }}</span>
        </div>
        <div v-if="user.companyCode" class="info-row">
          <span class="info-label">{{ t('shell.dashboard.companyCode') }}</span>
          <span class="info-value">{{ user.companyCode }}</span>
        </div>
        <div v-if="user.employeeNo" class="info-row">
          <span class="info-label">{{ t('shell.dashboard.employeeNo') }}</span>
          <span class="info-value">{{ user.employeeNo }}</span>
        </div>
        <div v-if="user.departmentName" class="info-row">
          <span class="info-label">{{ t('shell.dashboard.department') }}</span>
          <span class="info-value">{{ user.departmentName }}<span v-if="user.positionName"> [{{ user.positionName }}]</span></span>
        </div>
        <div v-if="user.roleName" class="info-row">
          <span class="info-label">{{ t('shell.dashboard.systemRole') }}</span>
          <span class="info-value">{{ user.roleName }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()
const loggingOut = ref(false)

const initial = computed(() => props.user?.chineseName?.[0] ?? 'U')

async function handleLogout() {
  await ElMessageBox.confirm(t('msg.confirmLogout'), t('common.confirm'), {
    confirmButtonText: t('auth.logout'),
    cancelButtonText: t('common.cancel'),
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
  background: var(--oa-surface);
  border-radius: 15px;
  padding: 19px;
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--oa-navy);
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
  background: linear-gradient(145deg, #168e84, #0c625c);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 5px 12px rgba(15, 118, 110, 0.2);
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--oa-text);
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
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 8px;
  align-items: baseline;
  padding: 7px 0;
  border-bottom: 1px dashed var(--oa-border);
}
.info-row:last-child {
  border-bottom: 0;
}
.info-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.info-value {
  font-size: 13px;
  color: var(--oa-text);
  font-weight: 500;
}
.skeleton-wrap {
  padding: 4px 0;
}
</style>
