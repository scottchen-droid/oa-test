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
          <template #title>首頁</template>
        </el-menu-item>

        <!-- 個人中心 -->
        <el-sub-menu index="personal">
          <template #title>
            <el-icon><User /></el-icon>
            <span>個人中心</span>
          </template>
          <el-menu-item index="/home/personal/notifications">我的通知</el-menu-item>
          <el-menu-item index="/home/personal/payslips">我的薪資</el-menu-item>
        </el-sub-menu>

        <!-- 考勤管理 -->
        <el-sub-menu index="attendance">
          <template #title>
            <el-icon><Clock /></el-icon>
            <span>考勤管理</span>
          </template>
          <el-menu-item index="/home/attendance/clock">打卡</el-menu-item>
          <el-menu-item index="/home/attendance/records">出勤紀錄</el-menu-item>
          <el-menu-item index="/home/attendance/leaves">假期申請</el-menu-item>
          <el-menu-item index="/home/attendance/overtime">加班申請</el-menu-item>
        </el-sub-menu>

        <!-- 電子表單 -->
        <el-sub-menu index="forms">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>電子表單</span>
          </template>
          <el-menu-item index="/home/forms/requests">電子表單申請</el-menu-item>
          <el-menu-item index="/home/forms/approvals">電子表單簽核</el-menu-item>
        </el-sub-menu>

        <!-- 登入記錄 -->
        <el-menu-item index="/home/account/login-logs">
          <el-icon><List /></el-icon>
          <template #title>登入記錄</template>
        </el-menu-item>

        <!-- 主管（僅管理者可見） -->
        <el-sub-menu v-if="auth.isManager" index="manager">
          <template #title>
            <el-icon><Avatar /></el-icon>
            <span>主管</span>
          </template>
          <el-menu-item index="/home/manager/approvals">簽核</el-menu-item>
        </el-sub-menu>

        <!-- 資訊中心 -->
        <el-sub-menu index="info">
          <template #title>
            <el-icon><InfoFilled /></el-icon>
            <span>資訊中心</span>
          </template>
          <el-menu-item index="/home/info/announcements">公告</el-menu-item>
          <el-menu-item index="/home/info/org-chart">組織架構</el-menu-item>
          <el-menu-item index="/home/info/system-messages">系統訊息</el-menu-item>
        </el-sub-menu>

        <el-divider style="margin: 8px 0; border-color: rgba(255,255,255,0.1)" />

        <!-- 人事模塊（後端管理） -->
        <el-sub-menu v-if="auth.hasModuleAccess('hr')" index="hr-module">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>人事模塊</span>
          </template>
          <el-menu-item index="/hr/employees">員工管理</el-menu-item>
          <el-menu-item index="/hr/org-assignments">組織配置</el-menu-item>
          <el-menu-item index="/hr/attendance">出勤管理</el-menu-item>
          <el-menu-item index="/hr/leaves">假期管理</el-menu-item>
          <el-menu-item index="/hr/payroll">薪資管理</el-menu-item>
          <el-menu-item index="/hr/performance">績效管理</el-menu-item>
        </el-sub-menu>

        <!-- 財務模塊（後端管理） -->
        <el-sub-menu v-if="auth.hasModuleAccess('finance')" index="finance-module">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>財務模塊</span>
          </template>
          <el-menu-item index="/finance/purchase-requests">採購申請管理</el-menu-item>
          <el-menu-item index="/finance/reimbursements">報銷審核</el-menu-item>
          <el-menu-item index="/finance/payments">付款管理</el-menu-item>
          <el-menu-item index="/finance/allocations">費用分攤</el-menu-item>
          <el-menu-item index="/finance/reports">財務報表</el-menu-item>
        </el-sub-menu>

        <!-- 行政模塊（後端管理） -->
        <el-sub-menu v-if="auth.hasModuleAccess('administration')" index="admin-module">
          <template #title>
            <el-icon><Files /></el-icon>
            <span>行政模塊</span>
          </template>
          <el-menu-item index="/administration/announcements">公告管理</el-menu-item>
          <el-menu-item index="/administration/assets">資產管理</el-menu-item>
          <el-menu-item index="/administration/requests">行政申請</el-menu-item>
          <el-menu-item index="/administration/visitors">訪客管理</el-menu-item>
          <el-menu-item index="/administration/meeting-rooms">會議室管理</el-menu-item>
        </el-sub-menu>

        <!-- 系統管理員模塊 -->
        <el-sub-menu v-if="auth.isSuperAdmin || auth.hasModuleAccess('system')" index="system-module">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系統管理員</span>
          </template>
          <el-menu-item index="/system/users">帳號管理</el-menu-item>
          <el-menu-item index="/system/roles">角色與權限</el-menu-item>
          <el-menu-item-group title="組織架構">
            <el-menu-item index="/system/org/regions">地區管理</el-menu-item>
            <el-menu-item index="/system/org/companies">公司管理</el-menu-item>
            <el-menu-item index="/system/org/departments">部門管理</el-menu-item>
            <el-menu-item index="/system/org/business-units">業務單位</el-menu-item>
            <el-menu-item index="/system/org/projects">項目管理</el-menu-item>
            <el-menu-item index="/system/org/positions">職位管理</el-menu-item>
            <el-menu-item index="/system/org/job-levels">職級管理</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group title="系統設定">
            <el-menu-item index="/system/workflows">審批流設定</el-menu-item>
            <el-menu-item index="/system/audit-logs">稽核日誌</el-menu-item>
            <el-menu-item index="/system/module-settings">模塊設定</el-menu-item>
            <el-menu-item index="/system/settings">系統設定</el-menu-item>
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
                <el-dropdown-item command="profile">個人資料</el-dropdown-item>
                <el-dropdown-item command="change-password">修改密碼</el-dropdown-item>
                <el-dropdown-item divided command="logout">登出</el-dropdown-item>
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
import { ElMessageBox } from 'element-plus'
import {
  Monitor, House, User, Clock, Document, List, Avatar, InfoFilled,
  UserFilled, Wallet, Files, Setting, Fold, Expand, ArrowDown,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const sidebarWidth = computed(() => ui.sidebarCollapsed ? '64px' : '240px')

async function handleCommand(command: string) {
  if (command === 'logout') {
    await ElMessageBox.confirm('確定要登出嗎？', '提示', { type: 'warning' })
    await auth.logout()
    router.push('/login')
  } else if (command === 'change-password') {
    router.push('/change-password')
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
}

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

/* Fix Element Plus sub-menu white background */
:deep(.el-menu) {
  background-color: #001529;
}
:deep(.el-sub-menu__title) {
  background-color: #001529 !important;
}
:deep(.el-sub-menu .el-menu) {
  background-color: #00111f !important;
}
:deep(.el-menu-item) {
  background-color: transparent;
}
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #0d2136 !important;
}
:deep(.el-menu-item.is-active) {
  background-color: #1890ff !important;
}
:deep(.el-menu--inline) {
  background-color: #00111f !important;
}
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
}

.user-name {
  font-size: 14px;
}

.app-main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
