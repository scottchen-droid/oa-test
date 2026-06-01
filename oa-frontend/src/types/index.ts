export interface User {
  id: string
  email: string
  displayName: string
  nameZh?: string
  nameEn?: string
  employeeNo?: string
  status: 'pending_activation' | 'active' | 'suspended' | 'resigned' | 'terminated'
  isSuperAdmin: boolean
  avatarUrl?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt?: string
  userRoles?: UserRole[]
  orgAssignments?: UserOrgAssignment[]
  employeeProfile?: EmployeeProfile
}

export interface UserRole {
  id: string
  scopeType?: string
  scopeId?: string
  role: { id: string; code: string; name: string }
}

export interface Region {
  id: string
  code: string
  name: string
  timezone?: string
  currencyCode?: string
  isActive: boolean
  createdAt: string
}

export interface Company {
  id: string
  regionId: string
  code: string
  name: string
  legalName?: string
  taxId?: string
  currencyCode?: string
  isActive: boolean
  region?: Region
}

export interface Department {
  id: string
  companyId: string
  parentDepartmentId?: string
  code: string
  name: string
  isActive: boolean
  children?: Department[]
  parent?: Department
}

export interface BusinessUnit {
  id: string
  code: string
  name: string
  description?: string
  isActive: boolean
}

export interface Project {
  id: string
  businessUnitId?: string
  code: string
  name: string
  description?: string
  isActive: boolean
  startDate?: string
  endDate?: string
}

export interface Position {
  id: string
  companyId?: string
  code: string
  name: string
  description?: string
  isActive: boolean
  company?: Company
}

export interface JobLevel {
  id: string
  code: string
  name: string
  levelOrder: number
  description?: string
  isActive: boolean
}

export interface Role {
  id: string
  code: string
  name: string
  description?: string
  isSystem: boolean
  isActive: boolean
  rolePermissions?: { permission: Permission }[]
}

export interface Permission {
  id: string
  code: string
  name: string
  module: string
  description?: string
}

export interface UserOrgAssignment {
  id: string
  userId: string
  companyId?: string
  departmentId?: string
  businessUnitId?: string
  projectId?: string
  positionId?: string
  jobLevelId?: string
  directManagerUserId?: string
  isPrimary: boolean
  startedAt?: string
  endedAt?: string
  company?: Company
  department?: Department
  businessUnit?: BusinessUnit
  project?: Project
  position?: Position
  jobLevel?: JobLevel
  directManager?: { id: string; displayName: string }
}

export interface EmployeeProfile {
  id: string
  userId: string
  birthDate?: string
  gender?: string
  nationality?: string
  personalEmail?: string
  mobilePhone?: string
  workPhone?: string
  currentAddress?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  bankName?: string
  bankBranch?: string
  hireDate?: string
  probationEndDate?: string
  regularDate?: string
  employmentType: string
  contractStartDate?: string
  contractEndDate?: string
  resignationDate?: string
  lastWorkingDate?: string
  terminationType?: string
  terminationReason?: string
}

// ─── Dashboard / Announcement ──────────────────────────────────

export interface AnnouncementAttachment {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize?: number
}

export interface AnnouncementItem {
  id: string
  title: string
  category: string
  type: string
  authorName: string
  publishDate: string
  contentPreview?: string
  attachments: AnnouncementAttachment[]
  tags?: string[]
  isPinned?: boolean
  readStatus?: 'read' | 'unread'
}

export interface ShortcutItem {
  id: string
  name: string
  icon: string
  route: string
  badgeCount?: number
  permissionCode?: string | null
}

export interface ReminderItem {
  id: string
  title: string
  type: string
  dueDate: string
  dueTime?: string
  route?: string
  priority?: 'low' | 'normal' | 'high'
}

export interface RecentFunctionItem {
  id: string
  name: string
  route: string
  lastUsedAt: string
}

export interface DashboardCurrentUser {
  id: string
  chineseName: string
  englishName?: string
  employeeNo: string
  companyName: string
  companyCode: string
  departmentName: string
  positionName?: string
  roleName?: string
  loginIp?: string
  avatarUrl?: string
}

export interface DashboardData {
  currentUser: DashboardCurrentUser
  shortcuts: ShortcutItem[]
  todayReminders: ReminderItem[]
  tomorrowReminders: ReminderItem[]
  recentFunctions: RecentFunctionItem[]
  announcements: AnnouncementItem[]
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  timestamp?: string
}
