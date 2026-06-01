import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const Placeholder = () => import('@/views/common/PlaceholderView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { public: true },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layout/AppLayout.vue'),
      children: [
        { path: '', redirect: '/home' },

        // ─── 首頁 (員工入口) ─────────────────────────────────
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/home/HomeView.vue'),
          meta: { title: '首頁' },
        },

        // 個人中心
        {
          path: 'home/personal/notifications',
          name: 'MyNotifications',
          component: Placeholder,
          meta: { title: '我的通知' },
        },
        {
          path: 'home/personal/payslips',
          name: 'MyPayslips',
          component: Placeholder,
          meta: { title: '我的薪資' },
        },

        // 考勤管理（員工自助）
        {
          path: 'home/attendance/clock',
          name: 'MyClock',
          component: () => import('@/views/home/ClockView.vue'),
          meta: { title: '打卡' },
        },
        {
          path: 'home/attendance/records',
          name: 'MyAttendance',
          component: () => import('@/views/home/AttendanceRecordsView.vue'),
          meta: { title: '出勤紀錄' },
        },
        {
          path: 'home/attendance/leaves',
          name: 'MyLeaves',
          component: () => import('@/views/hr/MyLeavesView.vue'),
          meta: { title: '假期申請' },
        },
        {
          path: 'home/attendance/overtime',
          name: 'MyOvertime',
          component: () => import('@/views/hr/MyOvertimeView.vue'),
          meta: { title: '加班申請' },
        },

        // 電子表單（員工自助）
        {
          path: 'home/forms/requests',
          name: 'FormRequests',
          component: () => import('@/views/home/FormRequestsView.vue'),
          meta: { title: '電子表單申請' },
        },
        {
          path: 'home/forms/approvals',
          name: 'MyFormApprovals',
          component: () => import('@/views/home/MyFormApprovalsView.vue'),
          meta: { title: '電子表單簽核' },
        },

        // 登入記錄
        {
          path: 'home/account/login-logs',
          name: 'LoginLogs',
          component: Placeholder,
          meta: { title: '登入記錄' },
        },

        // 主管（審批）
        {
          path: 'home/manager/approvals',
          name: 'ManagerApprovals',
          component: () => import('@/views/home/ManagerApprovalsView.vue'),
          meta: { title: '簽核' },
        },

        // 資訊中心
        {
          path: 'home/info/announcements',
          name: 'Announcements',
          component: () => import('@/views/announcements/AnnouncementsView.vue'),
          meta: { title: '公告' },
        },
        {
          path: 'home/info/announcements/:id',
          name: 'AnnouncementDetail',
          component: () => import('@/views/announcements/AnnouncementDetailView.vue'),
          meta: { title: '公告詳情' },
        },
        {
          path: 'home/info/org-chart',
          name: 'OrgChart',
          component: Placeholder,
          meta: { title: '組織架構' },
        },
        {
          path: 'home/info/system-messages',
          name: 'SystemMessages',
          component: Placeholder,
          meta: { title: '系統訊息' },
        },

        // ─── 人事模塊 ───────────────────────────────────────
        {
          path: 'hr/employees',
          name: 'Employees',
          component: () => import('@/views/hr/EmployeesView.vue'),
          meta: { title: '員工管理', module: 'hr' },
        },
        {
          path: 'hr/employees/:id',
          name: 'EmployeeDetail',
          component: () => import('@/views/hr/EmployeeDetailView.vue'),
          meta: { title: '員工詳情', module: 'hr' },
        },
        {
          path: 'hr/org-assignments',
          name: 'HrOrgAssignments',
          component: Placeholder,
          meta: { title: '組織配置', module: 'hr' },
        },
        {
          path: 'hr/attendance',
          name: 'HrAttendance',
          component: () => import('@/views/hr/HrAttendanceView.vue'),
          meta: { title: '出勤管理', module: 'hr' },
        },
        {
          path: 'hr/attendance/exceptions',
          name: 'HrAttendanceExceptions',
          component: Placeholder,
          meta: { title: '補卡管理', module: 'hr' },
        },
        {
          path: 'hr/leaves',
          name: 'HrLeaves',
          component: () => import('@/views/hr/HrLeavesView.vue'),
          meta: { title: '假期管理', module: 'hr' },
        },
        {
          path: 'hr/payroll',
          name: 'HrPayroll',
          component: () => import('@/views/hr/HrPayrollView.vue'),
          meta: { title: '薪資管理', module: 'hr' },
        },
        {
          path: 'hr/performance',
          name: 'HrPerformance',
          component: () => import('@/views/hr/HrPerformanceView.vue'),
          meta: { title: '績效管理', module: 'hr' },
        },

        // ─── 財務模塊 ───────────────────────────────────────
        {
          path: 'finance/purchase-requests',
          name: 'FinancePurchases',
          component: () => import('@/views/finance/FinancePurchasesView.vue'),
          meta: { title: '採購申請管理', module: 'finance' },
        },
        {
          path: 'finance/reimbursements',
          name: 'FinanceReimbursements',
          component: () => import('@/views/finance/FinanceReimbursementsView.vue'),
          meta: { title: '報銷審核', module: 'finance' },
        },
        {
          path: 'finance/payments',
          name: 'FinancePayments',
          component: () => import('@/views/finance/FinancePaymentsView.vue'),
          meta: { title: '付款管理', module: 'finance' },
        },
        {
          path: 'finance/allocations',
          name: 'FinanceAllocations',
          component: Placeholder,
          meta: { title: '費用分攤', module: 'finance' },
        },
        {
          path: 'finance/reports',
          name: 'FinanceReports',
          component: () => import('@/views/finance/FinanceReportsView.vue'),
          meta: { title: '財務報表', module: 'finance' },
        },

        // ─── 行政模塊 ───────────────────────────────────────
        {
          path: 'administration/announcements',
          name: 'AdminAnnouncements',
          component: () => import('@/views/announcements/AnnouncementsView.vue'),
          meta: { title: '公告管理', module: 'administration' },
        },
        {
          path: 'administration/assets',
          name: 'Assets',
          component: () => import('@/views/admin/AssetsView.vue'),
          meta: { title: '資產管理', module: 'administration' },
        },
        {
          path: 'administration/requests',
          name: 'AdminRequests',
          component: Placeholder,
          meta: { title: '行政申請', module: 'administration' },
        },
        {
          path: 'administration/visitors',
          name: 'Visitors',
          component: Placeholder,
          meta: { title: '訪客管理', module: 'administration' },
        },
        {
          path: 'administration/meeting-rooms',
          name: 'MeetingRooms',
          component: Placeholder,
          meta: { title: '會議室管理', module: 'administration' },
        },

        // ─── 系統模塊 ───────────────────────────────────────
        {
          path: 'system/users',
          name: 'Users',
          component: () => import('@/views/admin/UsersView.vue'),
          meta: { title: '帳號管理', module: 'system' },
        },
        {
          path: 'system/roles',
          name: 'Roles',
          component: () => import('@/views/admin/RolesView.vue'),
          meta: { title: '角色與權限', module: 'system' },
        },
        {
          path: 'system/permissions',
          name: 'Permissions',
          component: Placeholder,
          meta: { title: '權限管理', module: 'system' },
        },
        {
          path: 'system/user-roles',
          name: 'UserRoles',
          component: Placeholder,
          meta: { title: '使用者角色', module: 'system' },
        },
        // 組織架構
        {
          path: 'system/org/regions',
          name: 'Regions',
          component: () => import('@/views/org/RegionsView.vue'),
          meta: { title: '地區管理', module: 'system' },
        },
        {
          path: 'system/org/companies',
          name: 'Companies',
          component: () => import('@/views/org/CompaniesView.vue'),
          meta: { title: '公司管理', module: 'system' },
        },
        {
          path: 'system/org/departments',
          name: 'Departments',
          component: () => import('@/views/org/DepartmentsView.vue'),
          meta: { title: '部門管理', module: 'system' },
        },
        {
          path: 'system/org/business-units',
          name: 'BusinessUnits',
          component: () => import('@/views/org/BusinessUnitsView.vue'),
          meta: { title: '業務單位', module: 'system' },
        },
        {
          path: 'system/org/projects',
          name: 'Projects',
          component: () => import('@/views/org/ProjectsView.vue'),
          meta: { title: '項目管理', module: 'system' },
        },
        {
          path: 'system/org/positions',
          name: 'Positions',
          component: () => import('@/views/org/PositionsView.vue'),
          meta: { title: '職位管理', module: 'system' },
        },
        {
          path: 'system/org/job-levels',
          name: 'JobLevels',
          component: () => import('@/views/org/JobLevelsView.vue'),
          meta: { title: '職級管理', module: 'system' },
        },
        // 系統設定
        {
          path: 'system/workflows',
          name: 'Workflows',
          component: () => import('@/views/admin/WorkflowsView.vue'),
          meta: { title: '審批流設定', module: 'system' },
        },
        {
          path: 'system/audit-logs',
          name: 'AuditLogs',
          component: () => import('@/views/admin/AuditLogsView.vue'),
          meta: { title: '系統稽核日誌', module: 'system' },
        },
        {
          path: 'system/module-settings',
          name: 'ModuleSettings',
          component: Placeholder,
          meta: { title: '模塊設定', module: 'system' },
        },
        {
          path: 'system/notifications',
          name: 'NotificationSettings',
          component: Placeholder,
          meta: { title: '通知設定', module: 'system' },
        },
        {
          path: 'system/settings',
          name: 'SystemSettings',
          component: Placeholder,
          meta: { title: '系統設定', module: 'system' },
        },

        // ─── 舊路徑相容重導向 ────────────────────────────────
        { path: 'dashboard', redirect: '/home' },
        { path: 'attendance', redirect: '/home/attendance/records' },
        { path: 'leaves', redirect: '/home/attendance/leaves' },
        { path: 'overtime', redirect: '/home/attendance/overtime' },
        { path: 'announcements', redirect: '/home/info/announcements' },
        {
          path: 'announcements/:id',
          redirect: (to) => `/home/info/announcements/${to.params.id}`,
        },
        { path: 'approvals', redirect: '/home/manager/approvals' },
        { path: 'purchase-requests', redirect: '/home/forms/purchase' },
        { path: 'reimbursements', redirect: '/home/forms/reimbursement' },
        { path: 'finance/purchases', redirect: '/finance/purchase-requests' },
        { path: 'admin/assets', redirect: '/administration/assets' },
        { path: 'admin/users', redirect: '/system/users' },
        { path: 'admin/roles', redirect: '/system/roles' },
        { path: 'system/regions', redirect: '/system/org/regions' },
        { path: 'system/companies', redirect: '/system/org/companies' },
        { path: 'system/departments', redirect: '/system/org/departments' },
        { path: 'system/business-units', redirect: '/system/org/business-units' },
        { path: 'system/projects', redirect: '/system/org/projects' },
        { path: 'system/positions', redirect: '/system/org/positions' },
        { path: 'system/job-levels', redirect: '/system/org/job-levels' },
        { path: 'org/regions', redirect: '/system/org/regions' },
        { path: 'org/companies', redirect: '/system/org/companies' },
        { path: 'org/departments', redirect: '/system/org/departments' },
        { path: 'org/business-units', redirect: '/system/org/business-units' },
        { path: 'org/projects', redirect: '/system/org/projects' },
        { path: 'org/positions', redirect: '/system/org/positions' },
        { path: 'org/job-levels', redirect: '/system/org/job-levels' },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
})

router.beforeEach(async (to, _from, next) => {
  if (to.meta.public) {
    const auth = useAuthStore()
    if (auth.isLoggedIn && to.name === 'Login') return next('/home')
    return next()
  }

  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (!auth.user) {
    await auth.fetchCurrentUser()
    if (!auth.isLoggedIn) return next({ name: 'Login' })
  }

  next()
})

export default router
