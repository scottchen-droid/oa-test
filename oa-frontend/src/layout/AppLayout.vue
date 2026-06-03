<template>
  <el-container class="app-layout">
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="sidebar-logo">
        <span v-if="!ui.sidebarCollapsed" class="logo-text">OA System</span>
        <el-icon v-else size="24"><Monitor /></el-icon>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="ui.sidebarCollapsed"
        router
        class="sidebar-menu"
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#ffffff"
      >
        <!-- 首頁 -->
        <el-menu-item index="/home">
          <el-icon><House /></el-icon>
          <template #title>{{ $t('nav.home') }}</template>
        </el-menu-item>

        <!-- 考勤管理 -->
        <el-sub-menu index="attendance">
          <template #title>
            <el-icon><Clock /></el-icon>
            <span>{{ $t('nav.attendance') }}</span>
          </template>
          <el-menu-item index="/home/attendance/clock">{{ $t('nav.clock') }}</el-menu-item>
          <el-menu-item index="/home/attendance/records">{{ $t('nav.records') }}</el-menu-item>
          <el-menu-item index="/home/attendance/clock-patches">補卡申請</el-menu-item>
          <el-menu-item index="/home/attendance/leaves">{{ $t('nav.leaves') }}</el-menu-item>
          <el-menu-item index="/home/attendance/overtime">{{ $t('nav.overtime') }}</el-menu-item>
        </el-sub-menu>

        <!-- 電子表單 -->
        <el-sub-menu index="forms">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>{{ $t('nav.forms') }}</span>
          </template>
          <el-menu-item index="/home/forms/requests">{{ $t('nav.apply') }}</el-menu-item>
          <el-menu-item index="/home/forms/approvals">{{ $t('nav.approve') }}</el-menu-item>
        </el-sub-menu>

        <!-- 主管（僅管理者可見） -->
        <el-sub-menu v-if="auth.isManager" index="manager">
          <template #title>
            <el-icon><Avatar /></el-icon>
            <span>{{ $t('nav.manager') }}</span>
          </template>
          <el-menu-item index="/home/manager/approvals">{{ $t('nav.approve') }}</el-menu-item>
        </el-sub-menu>

        <!-- 資訊中心 -->
        <el-sub-menu index="info">
          <template #title>
            <el-icon><InfoFilled /></el-icon>
            <span>{{ $t('nav.infoCenter') }}</span>
          </template>
          <el-menu-item index="/home/info/announcements">{{ $t('nav.announcements') }}</el-menu-item>
          <el-menu-item index="/home/info/org-chart">{{ $t('nav.orgChart') }}</el-menu-item>
          <el-menu-item index="/home/info/system-messages">{{ $t('nav.systemMessages') }}</el-menu-item>
          <el-menu-item index="/home/account/login-logs">{{ $t('nav.loginLogs') }}</el-menu-item>
        </el-sub-menu>

        <el-divider style="margin: 8px 0; border-color: rgba(255,255,255,0.1)" />

        <!-- 人事模塊 -->
        <el-sub-menu v-if="auth.hasModuleAccess('hr')" index="hr-module">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>{{ $t('nav.hrModule') }}</span>
          </template>
          <el-menu-item index="/hr/employees">{{ $t('nav.employees') }}</el-menu-item>
          <el-menu-item index="/hr/org-assignments">{{ $t('nav.orgAssignments') }}</el-menu-item>
          <el-menu-item index="/hr/attendance">{{ $t('nav.hrAttendance') }}</el-menu-item>
          <el-menu-item index="/hr/leaves">{{ $t('nav.hrLeaves') }}</el-menu-item>
          <el-menu-item index="/hr/payroll">{{ $t('nav.hrPayroll') }}</el-menu-item>
          <el-menu-item index="/hr/performance">{{ $t('nav.hrPerformance') }}</el-menu-item>
        </el-sub-menu>

        <!-- 財務模塊 -->
        <el-sub-menu v-if="auth.hasModuleAccess('finance')" index="finance-module">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>{{ $t('nav.financeModule') }}</span>
          </template>
          <el-menu-item index="/finance/purchase-requests">{{ $t('nav.purchaseRequests') }}</el-menu-item>
          <el-menu-item index="/finance/reimbursements">{{ $t('nav.reimbursements') }}</el-menu-item>
          <el-menu-item index="/finance/payments">{{ $t('nav.payments') }}</el-menu-item>
          <el-menu-item index="/finance/allocations">{{ $t('nav.allocations') }}</el-menu-item>
          <el-menu-item index="/finance/reports">{{ $t('nav.financeReports') }}</el-menu-item>
        </el-sub-menu>

        <!-- 行政模塊 -->
        <el-sub-menu v-if="auth.hasModuleAccess('administration')" index="admin-module">
          <template #title>
            <el-icon><Files /></el-icon>
            <span>{{ $t('nav.adminModule') }}</span>
          </template>
          <el-menu-item index="/administration/announcements">{{ $t('nav.adminAnnouncements') }}</el-menu-item>
          <el-menu-item index="/administration/assets">{{ $t('nav.assets') }}</el-menu-item>
          <el-menu-item index="/administration/requests">{{ $t('nav.adminRequests') }}</el-menu-item>
          <el-menu-item index="/administration/visitors">{{ $t('nav.visitors') }}</el-menu-item>
          <el-menu-item index="/administration/meeting-rooms">{{ $t('nav.meetingRooms') }}</el-menu-item>
        </el-sub-menu>

        <!-- 系統模塊 -->
        <el-sub-menu v-if="auth.hasModuleAccess('system')" index="system-module">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>{{ $t('nav.systemModule') }}</span>
          </template>
          <el-menu-item index="/system/users">{{ $t('nav.users') }}</el-menu-item>
          <el-menu-item index="/system/roles">{{ $t('nav.roles') }}</el-menu-item>
          <el-menu-item index="/system/org">{{ $t('nav.orgStructure') }}</el-menu-item>
          <el-menu-item-group :title="$t('nav.systemSettings')">
            <el-menu-item index="/system/workflows">{{ $t('nav.workflows') }}</el-menu-item>
            <el-menu-item index="/system/audit-logs">{{ $t('nav.auditLogs') }}</el-menu-item>
            <el-menu-item index="/system/module-settings">{{ $t('nav.moduleSettings') }}</el-menu-item>
            <el-menu-item index="/system/settings">{{ $t('nav.systemSettings') }}</el-menu-item>
          </el-menu-item-group>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-button text @click="ui.toggleSidebar()">
            <el-icon size="20">
              <Fold v-if="!ui.sidebarCollapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>

          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item
              v-for="item in ui.breadcrumbs"
              :key="item.title"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 語系切換 -->
          <el-dropdown class="locale-switcher" @command="switchLocale">
            <el-button text size="small">
              <el-icon><Flag /></el-icon>
              <span class="locale-label">{{ currentLocaleLabel }}</span>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="loc in SUPPORTED_LOCALES"
                  :key="loc.value"
                  :command="loc.value"
                  :class="{ 'is-active': locale === loc.value }"
                >
                  {{ loc.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 使用者選單 -->
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ auth.user?.displayName?.[0] ?? 'U' }}
              </el-avatar>
              <span class="user-name">{{ auth.user?.displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">{{ $t('auth.myProfile') }}</el-dropdown-item>
                <el-dropdown-item command="change-password">{{ $t('auth.changePassword') }}</el-dropdown-item>
                <el-dropdown-item divided command="logout">{{ $t('auth.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="app-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import {
  Monitor, House, Clock, Document, Avatar, InfoFilled,
  UserFilled, Wallet, Files, Setting, Fold, Expand, ArrowDown, Flag,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n'

const auth = useAuthStore()
const ui   = useUiStore()
const router = useRouter()
const { t, locale } = useI18n()

const sidebarWidth = computed(() => ui.sidebarCollapsed ? '64px' : '240px')

const currentLocaleLabel = computed(() =>
  SUPPORTED_LOCALES.find(l => l.value === locale.value)?.label ?? locale.value,
)

function switchLocale(loc: SupportedLocale) {
  setLocale(loc)
}

async function handleCommand(command: string) {
  if (command === 'logout') {
    await ElMessageBox.confirm(t('msg.confirmLogout'), t('common.confirm'), { type: 'warning' })
    await auth.logout()
    router.push('/login')
  } else if (command === 'change-password') {
    router.push('/change-password')
  }
}
</script>

<style scoped>
.app-layout { height: 100vh; }

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #001529;
}

.sidebar-menu {
  border-right: none;
  width: 100% !important;
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.el-menu) { background-color: #001529; }
:deep(.el-sub-menu__title) { background-color: #001529 !important; }
:deep(.el-sub-menu .el-menu) { background-color: #00111f !important; }
:deep(.el-menu-item) { background-color: transparent; }
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) { background-color: #0d2136 !important; }
:deep(.el-menu-item.is-active) { background-color: #1890ff !important; }
:deep(.el-menu--inline) { background-color: #00111f !important; }
:deep(.el-menu-item-group__title) {
  color: rgba(255, 255, 255, 0.45) !important;
  background-color: #00111f !important;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left { display: flex; align-items: center; gap: 16px; }
.breadcrumb { font-size: 14px; }

.header-right { display: flex; align-items: center; gap: 8px; }

.locale-switcher .locale-label { margin: 0 4px; font-size: 13px; }

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
}
.user-name { font-size: 14px; }

.app-main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

:deep(.el-dropdown-menu__item.is-active) {
  color: #409eff;
  background-color: #ecf5ff;
}
</style>
