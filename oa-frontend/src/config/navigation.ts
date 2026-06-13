export type ModuleAccess = 'hr' | 'finance' | 'administration' | 'system'

export interface NavigationItem {
  id: string
  label: string
  icon: string
  route?: string
  permissionCode?: string
  managerOnly?: boolean
  children?: NavigationItem[]
}

export interface NavigationModule {
  id: string
  label: string
  shortLabel: string
  icon: string
  description: string
  accent: string
  access?: ModuleAccess
  items: NavigationItem[]
}

export const navigationModules: NavigationModule[] = [
  {
    id: 'workspace',
    label: '工作台',
    shortLabel: '工作台',
    icon: 'House',
    description: '個人工作與日常申請',
    accent: '#0f766e',
    items: [
      { id: 'home', label: '首頁總覽', icon: 'House', route: '/home' },
      {
        id: 'attendance',
        label: '考勤管理',
        icon: 'Clock',
        children: [
          { id: 'clock', label: '上下班打卡', icon: 'Position', route: '/home/attendance/clock' },
          { id: 'records', label: '出勤紀錄', icon: 'Calendar', route: '/home/attendance/records' },
          { id: 'clock-patches', label: '補卡申請', icon: 'EditPen', route: '/home/attendance/clock-patches' },
          { id: 'leaves', label: '假期申請', icon: 'Sunny', route: '/home/attendance/leaves' },
          { id: 'overtime', label: '加班申請', icon: 'Timer', route: '/home/attendance/overtime' },
        ],
      },
      {
        id: 'forms',
        label: '電子表單',
        icon: 'Document',
        children: [
          { id: 'form-request', label: '發起申請', icon: 'EditPen', route: '/home/forms/requests' },
          { id: 'my-requests', label: '我的申請', icon: 'DocumentChecked', route: '/home/forms/approvals' },
          { id: 'drafts', label: '我的草稿', icon: 'DocumentCopy', route: '/home/forms/drafts' },
          { id: 'fill-templates', label: '填寫模板', icon: 'Collection', route: '/home/forms/fill-templates' },
          { id: 'reimbursements', label: '我的報銷', icon: 'Tickets', route: '/home/forms/reimbursements' },
        ],
      },
      {
        id: 'work-orders',
        label: '工作單',
        icon: 'List',
        children: [
          { id: 'my-work-orders', label: '我的工作單', icon: 'Tickets', route: '/home/work-orders' },
          { id: 'group-work-orders', label: '群組工作單', icon: 'UserFilled', route: '/home/work-orders/group' },
        ],
      },
      {
        id: 'manager',
        label: '主管簽核',
        icon: 'Stamp',
        managerOnly: true,
        children: [
          { id: 'manager-approvals', label: '待我簽核', icon: 'CircleCheck', route: '/home/manager/approvals' },
        ],
      },
      {
        id: 'information',
        label: '資訊中心',
        icon: 'InfoFilled',
        children: [
          { id: 'announcements', label: '企業公告', icon: 'Notification', route: '/home/info/announcements' },
          { id: 'org-chart', label: '組織架構', icon: 'Share', route: '/home/info/org-chart' },
          { id: 'messages', label: '系統訊息', icon: 'Bell', route: '/home/info/system-messages' },
          { id: 'login-logs', label: '登入紀錄', icon: 'Clock', route: '/home/account/login-logs' },
        ],
      },
    ],
  },
  {
    id: 'hr',
    label: '人事管理',
    shortLabel: '人事',
    icon: 'UserFilled',
    description: '員工、假勤與薪資管理',
    accent: '#2563eb',
    access: 'hr',
    items: [
      { id: 'employees', label: '員工管理', icon: 'User', route: '/hr/employees' },
      { id: 'org-assignments', label: '組織配置', icon: 'Connection', route: '/hr/org-assignments' },
      { id: 'hr-attendance', label: '出勤管理', icon: 'Clock', route: '/hr/attendance' },
      { id: 'hr-leaves', label: '假期管理', icon: 'Calendar', route: '/hr/leaves' },
      { id: 'hr-payroll', label: '薪資管理', icon: 'Wallet', route: '/hr/payroll' },
      { id: 'hr-performance', label: '績效管理', icon: 'TrendCharts', route: '/hr/performance' },
    ],
  },
  {
    id: 'finance',
    label: '財務管理',
    shortLabel: '財務',
    icon: 'Wallet',
    description: '採購、報銷與付款作業',
    accent: '#b7791f',
    access: 'finance',
    items: [
      { id: 'purchases', label: '採購申請', icon: 'ShoppingCart', route: '/finance/purchase-requests' },
      { id: 'finance-reimbursements', label: '報銷審核', icon: 'Tickets', route: '/finance/reimbursements' },
      { id: 'payments', label: '付款管理', icon: 'CreditCard', route: '/finance/payments' },
      { id: 'allocations', label: '費用分攤', icon: 'PieChart', route: '/finance/allocations' },
      { id: 'finance-reports', label: '財務報表', icon: 'DataAnalysis', route: '/finance/reports' },
    ],
  },
  {
    id: 'administration',
    label: '行政管理',
    shortLabel: '行政',
    icon: 'OfficeBuilding',
    description: '資產與行政服務',
    accent: '#7c3aed',
    access: 'administration',
    items: [
      { id: 'admin-announcements', label: '公告管理', icon: 'Notification', route: '/administration/announcements' },
      { id: 'assets', label: '資產管理', icon: 'Box', route: '/administration/assets' },
      { id: 'admin-requests', label: '行政申請', icon: 'DocumentAdd', route: '/administration/requests' },
      { id: 'visitors', label: '訪客管理', icon: 'Avatar', route: '/administration/visitors' },
      { id: 'meeting-rooms', label: '會議室管理', icon: 'OfficeBuilding', route: '/administration/meeting-rooms' },
    ],
  },
  {
    id: 'system',
    label: '系統設定',
    shortLabel: '系統',
    icon: 'Setting',
    description: '權限、組織與流程設定',
    accent: '#475569',
    access: 'system',
    items: [
      {
        id: 'accounts',
        label: '帳號與權限',
        icon: 'Lock',
        children: [
          { id: 'users', label: '帳號管理', icon: 'User', route: '/system/users' },
          { id: 'roles', label: '角色與權限', icon: 'Key', route: '/system/roles' },
          { id: 'org', label: '組織架構', icon: 'Share', route: '/system/org' },
        ],
      },
      {
        id: 'workflow-settings',
        label: '流程與表單',
        icon: 'SetUp',
        children: [
          { id: 'workflows', label: '審批流設定', icon: 'Connection', route: '/system/workflows' },
          { id: 'form-definitions', label: '電子表單設定', icon: 'Document', route: '/system/form-definitions' },
          { id: 'audit-logs', label: '稽核日誌', icon: 'View', route: '/system/audit-logs' },
        ],
      },
      {
        id: 'work-order-settings',
        label: '工作單設定',
        icon: 'Tools',
        children: [
          { id: 'resource-items', label: '資源項目', icon: 'Collection', route: '/system/resource-items' },
          { id: 'work-order-groups', label: '處理群組', icon: 'UserFilled', route: '/system/work-order-groups' },
          { id: 'dispatch-rules', label: '派發規則', icon: 'Guide', route: '/system/work-order-dispatch-rules' },
        ],
      },
      {
        id: 'platform-settings',
        label: '平台設定',
        icon: 'Setting',
        children: [
          { id: 'module-settings', label: '模塊設定', icon: 'Grid', route: '/system/module-settings' },
          { id: 'settings', label: '系統設定', icon: 'Operation', route: '/system/settings' },
        ],
      },
    ],
  },
]

export const navigationModuleTranslationKeys: Record<string, { label: string; description: string }> = {
  workspace: { label: 'shell.modules.workspace', description: 'shell.modules.workspaceDescription' },
  hr: { label: 'shell.modules.hr', description: 'shell.modules.hrDescription' },
  finance: { label: 'shell.modules.finance', description: 'shell.modules.financeDescription' },
  administration: { label: 'shell.modules.administration', description: 'shell.modules.administrationDescription' },
  system: { label: 'shell.modules.system', description: 'shell.modules.systemDescription' },
}

export const navigationItemTranslationKeys: Record<string, string> = {
  home: 'shell.navigation.homeOverview',
  attendance: 'nav.attendance',
  clock: 'nav.clock',
  records: 'nav.records',
  'clock-patches': 'shell.navigation.clockPatch',
  leaves: 'nav.leaves',
  overtime: 'nav.overtime',
  forms: 'nav.forms',
  'form-request': 'nav.initiateApply',
  'my-requests': 'nav.myRequests',
  drafts: 'nav.myDrafts',
  'fill-templates': 'nav.myFillTemplates',
  reimbursements: 'shell.navigation.myReimbursements',
  'work-orders': 'nav.workOrders',
  'my-work-orders': 'nav.myWorkOrders',
  'group-work-orders': 'nav.groupWorkOrders',
  manager: 'nav.manager',
  'manager-approvals': 'shell.navigation.pendingApprovals',
  information: 'nav.infoCenter',
  announcements: 'nav.announcements',
  'org-chart': 'nav.orgChart',
  messages: 'nav.systemMessages',
  'login-logs': 'nav.loginLogs',
  employees: 'nav.employees',
  'org-assignments': 'nav.orgAssignments',
  'hr-attendance': 'nav.hrAttendance',
  'hr-leaves': 'nav.hrLeaves',
  'hr-payroll': 'nav.hrPayroll',
  'hr-performance': 'nav.hrPerformance',
  purchases: 'nav.purchaseRequests',
  'finance-reimbursements': 'nav.reimbursements',
  payments: 'nav.payments',
  allocations: 'nav.allocations',
  'finance-reports': 'nav.financeReports',
  'admin-announcements': 'nav.adminAnnouncements',
  assets: 'nav.assets',
  'admin-requests': 'nav.adminRequests',
  visitors: 'nav.visitors',
  'meeting-rooms': 'nav.meetingRooms',
  accounts: 'shell.navigation.accountsAndPermissions',
  users: 'nav.users',
  roles: 'nav.roles',
  org: 'nav.orgStructure',
  'workflow-settings': 'shell.navigation.workflowAndForms',
  workflows: 'nav.workflows',
  'form-definitions': 'nav.formDefinitions',
  'audit-logs': 'nav.auditLogs',
  'work-order-settings': 'shell.navigation.workOrderSettings',
  'resource-items': 'nav.resourceItems',
  'work-order-groups': 'nav.workOrderGroups',
  'dispatch-rules': 'nav.workOrderDispatchRules',
  'platform-settings': 'shell.navigation.platformSettings',
  'module-settings': 'nav.moduleSettings',
  settings: 'nav.systemSettings',
}

export function flattenNavigation(items: NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => item.children ? flattenNavigation(item.children) : [item])
}
