import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '!Aa123456';

// ══════════════════════════════════════════════════════
// 權限與角色
// ══════════════════════════════════════════════════════

const PERMISSIONS = [
  // 模塊入口
  { code: 'module.hr.access',              name: '進入人事模塊',            module: 'module' },
  { code: 'module.finance.access',          name: '進入財務模塊',            module: 'module' },
  { code: 'module.administration.access',   name: '進入行政模塊',            module: 'module' },
  { code: 'module.system.access',           name: '進入系統模塊',            module: 'module' },
  { code: 'module.home.access',             name: '進入首頁',                module: 'module' },
  { code: 'module.home_manager.access',     name: '主管功能入口',            module: 'module' },
  // 首頁個人功能
  { code: 'home.personal.notification.view',  name: '查看個人通知',          module: 'home' },
  { code: 'home.personal.payslip.view_self',  name: '查看自己的薪資單',      module: 'home' },
  { code: 'home.attendance.record.view_self', name: '查看自己的打卡記錄',    module: 'home' },
  { code: 'home.attendance.leave.apply',      name: '申請請假',              module: 'home' },
  { code: 'home.attendance.overtime.apply',   name: '申請加班',              module: 'home' },
  { code: 'home.attendance.exception.apply',  name: '申請異常打卡補正',      module: 'home' },
  { code: 'home.forms.purchase.create',       name: '建立採購申請單',        module: 'home' },
  { code: 'home.forms.reimbursement.create',  name: '建立費用報銷單',        module: 'home' },
  // 主管功能
  { code: 'home.manager.leave.approve',       name: '主管：審核請假申請',    module: 'home' },
  { code: 'home.manager.clock_patch.approve', name: '主管：審核補打卡申請',  module: 'home' },
  { code: 'home.manager.overtime.approve',    name: '主管：審核加班申請',    module: 'home' },
  { code: 'home.manager.form.approve',        name: '主管：審核表單申請',    module: 'home' },
  // 人事模塊
  { code: 'hr.employee.view',        name: '查看員工資料',          module: 'hr' },
  { code: 'hr.employee.create',      name: '新增員工',              module: 'hr' },
  { code: 'hr.employee.edit',        name: '編輯員工',              module: 'hr' },
  { code: 'hr.employee.delete',      name: '刪除員工',              module: 'hr' },
  { code: 'hr.attendance.view_all',  name: '查看所有打卡記錄',      module: 'hr' },
  { code: 'hr.attendance.edit',      name: '編輯出勤記錄',          module: 'hr' },
  { code: 'hr.leave.manage',         name: '管理假勤（假別/餘額）',  module: 'hr' },
  { code: 'hr.payroll.manage',       name: '管理薪資',              module: 'hr' },
  { code: 'hr.performance.manage',   name: '管理績效考核',          module: 'hr' },
  // 財務模塊
  { code: 'finance.purchase.view_all',      name: '查看所有採購申請', module: 'finance' },
  { code: 'finance.purchase.manage',         name: '管理採購申請',    module: 'finance' },
  { code: 'finance.reimbursement.review',    name: '審核費用報銷',    module: 'finance' },
  { code: 'finance.payment.confirm',         name: '確認付款',        module: 'finance' },
  { code: 'finance.report.view',             name: '查看財務報表',    module: 'finance' },
  // 行政模塊
  { code: 'administration.announcement.manage', name: '管理公告',    module: 'administration' },
  { code: 'administration.asset.manage',         name: '管理資產',    module: 'administration' },
  { code: 'administration.visitor.manage',       name: '管理訪客',    module: 'administration' },
  { code: 'administration.meeting_room.manage',  name: '管理會議室',  module: 'administration' },
  // 系統模塊
  { code: 'system.user.manage',     name: '管理帳號',          module: 'system' },
  { code: 'system.role.manage',     name: '管理角色與權限',    module: 'system' },
  { code: 'system.org.manage',      name: '管理組織架構',      module: 'system' },
  { code: 'system.workflow.manage', name: '管理審批流',        module: 'system' },
  { code: 'system.audit_log.view',  name: '查看稽核日誌',      module: 'system' },
];

const ROLES = [
  { code: 'ADMIN',         name: '系統管理員',  description: '具備所有功能的管理角色，由角色權限控管',  isSystem: true },
  { code: 'HR_ADMIN',      name: 'HR管理員',    description: '管理員工、薪資與假勤政策',              isSystem: true },
  { code: 'FINANCE_ADMIN', name: '財務管理員',  description: '管理採購申請與費用報銷',                isSystem: true },
  { code: 'DEPT_MANAGER',  name: '部門主管',    description: '審核部門內的假勤與採購申請',            isSystem: true },
  { code: 'APPROVER',      name: '審核人員',    description: '可審核各類申請',                       isSystem: true },
  { code: 'EMPLOYEE',      name: '一般員工',    description: 'OA基本功能',                          isSystem: true },
  { code: 'AUDITOR',       name: '稽核人員',    description: '唯讀存取所有財務文件',                  isSystem: true },
];

// ══════════════════════════════════════════════════════
// 組織主檔
// ══════════════════════════════════════════════════════

const REGIONS = [
  { code: 'TW', name: '台灣',    timezone: 'Asia/Taipei',      currencyCode: 'TWD' },
  { code: 'JP', name: '日本',    timezone: 'Asia/Tokyo',       currencyCode: 'JPY' },
  { code: 'HK', name: '香港',    timezone: 'Asia/Hong_Kong',   currencyCode: 'HKD' },
  { code: 'SG', name: '新加坡',  timezone: 'Asia/Singapore',   currencyCode: 'SGD' },
  { code: 'PH', name: '菲律賓',  timezone: 'Asia/Manila',      currencyCode: 'PHP' },
];

const COMPANIES = [
  { regionCode: 'TW', code: 'TW-HQ',  name: '台灣總公司',    legalName: '○○股份有限公司',        currencyCode: 'TWD' },
  { regionCode: 'JP', code: 'JP-A',   name: '日本公司 A',    legalName: 'OA Japan Co., Ltd.',    currencyCode: 'JPY' },
  { regionCode: 'JP', code: 'JP-B',   name: '日本公司 B',    legalName: 'OA Tech Japan K.K.',    currencyCode: 'JPY' },
  { regionCode: 'HK', code: 'HK-CO',  name: '香港子公司',    legalName: 'OA Holdings HK Ltd.',   currencyCode: 'HKD' },
  { regionCode: 'PH', code: 'PH-CO',  name: '菲律賓子公司',  legalName: 'OA Philippines Inc.',   currencyCode: 'PHP' },
];

// 集團業務組織線：事業部
const BUSINESS_UNITS = [
  { code: 'BU-1ST',      name: '第一事業部',    description: '負責 YL / LY 項目的營運管理' },
  { code: 'BU-2ND',      name: '第二事業部',    description: '負責 KX 項目的營運管理' },
  { code: 'BU-RD',       name: '研發中心',      description: '負責 MP 等技術產品的研發' },
  { code: 'BU-STRATEGY', name: '中心策',        description: '集團策略與產品企劃' },
  { code: 'BU-PMO',      name: '項目管理中心',  description: '統籌集團跨部門項目管理' },
];

// 集團業務組織線：項目（事業部下的業務單元）
const PROJECTS = [
  { businessUnitCode: 'BU-1ST', code: 'YL', name: 'YL 項目', description: '第一事業部 YL 業務線', startDate: new Date('2023-01-01') },
  { businessUnitCode: 'BU-1ST', code: 'LY', name: 'LY 項目', description: '第一事業部 LY 業務線', startDate: new Date('2023-06-01') },
  { businessUnitCode: 'BU-2ND', code: 'KX', name: 'KX 項目', description: '第二事業部 KX 業務線', startDate: new Date('2023-03-01') },
  { businessUnitCode: 'BU-RD',  code: 'MP', name: 'MP 項目', description: '研發中心遊戲平台研發',   startDate: new Date('2022-01-01') },
];

// 部門：同時支援集團業務組織線（projectCode）與辦公室組織線（companyCode）
// projectCode 有值 → 集團業務部門；companyCode 有值且 projectCode 無值 → 辦公室支援部門
interface DepartmentSeed {
  code: string;
  name: string;
  projectCode?: string;  // 集團業務組織線
  companyCode?: string;  // 辦公室組織線（支援部門）
  parentCode?: string;
}

const DEPARTMENTS: DepartmentSeed[] = [
  // YL 項目部門
  { code: 'YL-OPS',  name: 'YL 運營部門',  projectCode: 'YL' },
  { code: 'YL-RISK', name: 'YL 風控部門',  projectCode: 'YL' },
  { code: 'YL-PROD', name: 'YL 產品部門',  projectCode: 'YL' },
  // LY 項目部門
  { code: 'LY-OPS',  name: 'LY 運營部門',  projectCode: 'LY' },
  { code: 'LY-CS',   name: 'LY 客服部門',  projectCode: 'LY' },
  // KX 項目部門
  { code: 'KX-OPS',  name: 'KX 運營部門',  projectCode: 'KX' },
  { code: 'KX-MKT',  name: 'KX 市場部門',  projectCode: 'KX' },
  // MP 項目部門
  { code: 'MP-FE',   name: 'MP 遊戲前端部門', projectCode: 'MP' },
  { code: 'MP-BE',   name: 'MP 遊戲後端部門', projectCode: 'MP' },
  { code: 'MP-API',  name: 'MP API 部門',     projectCode: 'MP' },
  { code: 'MP-QA',   name: 'MP 測試部門',     projectCode: 'MP' },
  // 中心策部門
  { code: 'STRATEGY-PROD', name: '產品企劃部門', projectCode: undefined, companyCode: 'TW-HQ' },
  // 項目管理中心部門
  { code: 'PMO-MGT', name: '專案管理部門', projectCode: undefined, companyCode: 'TW-HQ' },
  // 辦公室支援部門（台灣總公司）
  { code: 'HR',    name: '人資部',   companyCode: 'TW-HQ' },
  { code: 'FIN',   name: '財務部',   companyCode: 'TW-HQ' },
  { code: 'ADMIN', name: '行政部',   companyCode: 'TW-HQ' },
  // 辦公室支援部門（日本公司 A）
  { code: 'JP-A-HR',  name: 'HR 部門',  companyCode: 'JP-A' },
  { code: 'JP-A-FIN', name: '財務部門', companyCode: 'JP-A' },
];

const JOB_LEVELS = [
  { code: 'L1', name: '助理',     levelOrder: 1, description: '入門級，0~2年經驗' },
  { code: 'L2', name: '專員',     levelOrder: 2, description: '基礎執行，2~4年經驗' },
  { code: 'L3', name: '資深專員', levelOrder: 3, description: '獨立作業，4~7年經驗' },
  { code: 'L4', name: '主任',     levelOrder: 4, description: '帶領小組，7~10年經驗' },
  { code: 'L5', name: '副理',     levelOrder: 5, description: '部門副手，10年以上' },
  { code: 'L6', name: '經理',     levelOrder: 6, description: '部門主管' },
  { code: 'L7', name: '副總',     levelOrder: 7, description: '事業部主管' },
];

const POSITIONS = [
  { code: 'GAME-FE',    name: '遊戲前端工程師',  description: '負責遊戲前端開發' },
  { code: 'GAME-BE',    name: '遊戲後端工程師',  description: '負責遊戲後端開發' },
  { code: 'API-ENG',    name: 'API 工程師',      description: '負責 API 設計與維護' },
  { code: 'QA-ENG',     name: '測試工程師',      description: '負責品質保證與測試' },
  { code: 'OPS-MGR',    name: '運營主管',         description: '負責項目運營管理' },
  { code: 'OPS-SPEC',   name: '運營專員',         description: '執行日常運營作業' },
  { code: 'PROD-MGR',   name: '產品經理',         description: '負責產品規劃與設計' },
  { code: 'RISK-SPEC',  name: '風控專員',         description: '負責風險控管' },
  { code: 'MKT-SPEC',   name: '市場專員',         description: '負責市場推廣' },
  { code: 'CS-SPEC',    name: '客服專員',         description: '負責客戶服務' },
  { code: 'HR-SPEC',    name: '人資專員',         description: '執行招募、薪資與員工關係' },
  { code: 'FIN-SPEC',   name: '財務專員',         description: '財務報告與分析' },
  { code: 'ADMIN-SPEC', name: '行政專員',         description: '行政庶務支援' },
  { code: 'PROJ-MGR',   name: '項目主管',         description: '帶領項目或部門' },
  { code: 'BU-HEAD',    name: '事業部負責人',     description: '統籌事業部運營' },
];

// ══════════════════════════════════════════════════════
// 員工資料
// 每位員工同時具備：
//   地區/公司歸屬（辦公室組織線）
//   事業部/項目/部門歸屬（集團業務組織線）
// ══════════════════════════════════════════════════════

interface EmployeeSeed {
  employeeNo: string;
  email: string;
  nameZh: string;
  nameEn: string;
  displayName: string;
  regionCode: string;
  companyCode: string;
  businessUnitCode?: string;
  projectCode?: string;
  deptCode: string;
  positionCode: string;
  jobLevelCode: string;
  roleCode: string;
  hireDate: Date;
  gender: string;
  managerEmployeeNo?: string;
}

const EMPLOYEES: EmployeeSeed[] = [
  // ── 第一事業部 VP ──────────────────────────────
  {
    employeeNo: '11001', email: 'tom.lin@oa.com',     nameZh: '林志豪', nameEn: 'Tom Lin',
    displayName: '林志豪', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: 'BU-1ST', deptCode: 'YL-OPS',
    positionCode: 'BU-HEAD', jobLevelCode: 'L7', roleCode: 'APPROVER',
    hireDate: new Date('2017-01-10'), gender: 'male',
  },
  // ── YL 項目 ──────────────────────────────────
  {
    employeeNo: '11002', email: 'alice.chen@oa.com',   nameZh: '陳雅琪', nameEn: 'Alice Chen',
    displayName: '陳雅琪', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: 'BU-1ST', projectCode: 'YL', deptCode: 'YL-OPS',
    positionCode: 'PROJ-MGR', jobLevelCode: 'L6', roleCode: 'DEPT_MANAGER',
    hireDate: new Date('2018-05-01'), gender: 'female', managerEmployeeNo: '11001',
  },
  {
    employeeNo: '11003', email: 'mark.wu@oa.com',      nameZh: '吳明峰', nameEn: 'Mark Wu',
    displayName: '吳明峰', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: 'BU-1ST', projectCode: 'YL', deptCode: 'YL-OPS',
    positionCode: 'OPS-SPEC', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',
    hireDate: new Date('2020-08-15'), gender: 'male', managerEmployeeNo: '11002',
  },
  {
    employeeNo: '11004', email: 'nina.huang@oa.com',   nameZh: '黃怡寧', nameEn: 'Nina Huang',
    displayName: '黃怡寧', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: 'BU-1ST', projectCode: 'YL', deptCode: 'YL-RISK',
    positionCode: 'RISK-SPEC', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',
    hireDate: new Date('2021-03-01'), gender: 'female', managerEmployeeNo: '11002',
  },
  {
    employeeNo: '11005', email: 'joe.chou@oa.com',     nameZh: '周俊偉', nameEn: 'Joe Chou',
    displayName: '周俊偉', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: 'BU-1ST', projectCode: 'YL', deptCode: 'YL-PROD',
    positionCode: 'PROD-MGR', jobLevelCode: 'L5', roleCode: 'DEPT_MANAGER',
    hireDate: new Date('2019-07-20'), gender: 'male', managerEmployeeNo: '11001',
  },
  // ── LY 項目 ──────────────────────────────────
  {
    employeeNo: '11006', email: 'kate.su@oa.com',      nameZh: '蘇凱特', nameEn: 'Kate Su',
    displayName: '蘇凱特', regionCode: 'JP', companyCode: 'JP-A',
    businessUnitCode: 'BU-1ST', projectCode: 'LY', deptCode: 'LY-OPS',
    positionCode: 'PROJ-MGR', jobLevelCode: 'L6', roleCode: 'DEPT_MANAGER',
    hireDate: new Date('2019-02-01'), gender: 'female', managerEmployeeNo: '11001',
  },
  {
    employeeNo: '11007', email: 'ryan.kim@oa.com',     nameZh: '金榮安', nameEn: 'Ryan Kim',
    displayName: '金榮安', regionCode: 'JP', companyCode: 'JP-A',
    businessUnitCode: 'BU-1ST', projectCode: 'LY', deptCode: 'LY-CS',
    positionCode: 'CS-SPEC', jobLevelCode: 'L2', roleCode: 'EMPLOYEE',
    hireDate: new Date('2022-04-11'), gender: 'male', managerEmployeeNo: '11006',
  },
  // ── 第二事業部 KX 項目 ───────────────────────
  {
    employeeNo: '12001', email: 'bob.zhang@oa.com',    nameZh: '張博文', nameEn: 'Bob Zhang',
    displayName: '張博文', regionCode: 'HK', companyCode: 'HK-CO',
    businessUnitCode: 'BU-2ND', projectCode: 'KX', deptCode: 'KX-OPS',
    positionCode: 'BU-HEAD', jobLevelCode: 'L7', roleCode: 'APPROVER',
    hireDate: new Date('2017-09-01'), gender: 'male',
  },
  {
    employeeNo: '12002', email: 'ivy.lee@oa.com',      nameZh: '李依琳', nameEn: 'Ivy Lee',
    displayName: '李依琳', regionCode: 'HK', companyCode: 'HK-CO',
    businessUnitCode: 'BU-2ND', projectCode: 'KX', deptCode: 'KX-OPS',
    positionCode: 'OPS-SPEC', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',
    hireDate: new Date('2021-06-07'), gender: 'female', managerEmployeeNo: '12001',
  },
  {
    employeeNo: '12003', email: 'sam.ng@oa.com',       nameZh: '吳三明', nameEn: 'Sam Ng',
    displayName: '吳三明', regionCode: 'HK', companyCode: 'HK-CO',
    businessUnitCode: 'BU-2ND', projectCode: 'KX', deptCode: 'KX-MKT',
    positionCode: 'MKT-SPEC', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',
    hireDate: new Date('2022-01-17'), gender: 'male', managerEmployeeNo: '12001',
  },
  // ── 研發中心 MP 項目 ─────────────────────────
  {
    employeeNo: '13001', email: 'david.wang@oa.com',   nameZh: '王大明', nameEn: 'David Wang',
    displayName: '王大明', regionCode: 'JP', companyCode: 'JP-B',
    businessUnitCode: 'BU-RD', projectCode: 'MP', deptCode: 'MP-BE',
    positionCode: 'BU-HEAD', jobLevelCode: 'L7', roleCode: 'APPROVER',
    hireDate: new Date('2016-03-15'), gender: 'male',
  },
  {
    employeeNo: '13002', email: 'jack.huang@oa.com',   nameZh: '黃建國', nameEn: 'Jack Huang',
    displayName: '黃建國', regionCode: 'JP', companyCode: 'JP-B',
    businessUnitCode: 'BU-RD', projectCode: 'MP', deptCode: 'MP-FE',
    positionCode: 'PROJ-MGR', jobLevelCode: 'L6', roleCode: 'DEPT_MANAGER',
    hireDate: new Date('2019-02-10'), gender: 'male', managerEmployeeNo: '13001',
  },
  {
    employeeNo: '13003', email: 'amy.liu@oa.com',      nameZh: '劉雅婷', nameEn: 'Amy Liu',
    displayName: '劉雅婷', regionCode: 'JP', companyCode: 'JP-B',
    businessUnitCode: 'BU-RD', projectCode: 'MP', deptCode: 'MP-FE',
    positionCode: 'GAME-FE', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',
    hireDate: new Date('2021-07-05'), gender: 'female', managerEmployeeNo: '13002',
  },
  {
    employeeNo: '13004', email: 'yang.wenbo@oa.com',   nameZh: '楊文博', nameEn: 'Wenbo Yang',
    displayName: '楊文博', regionCode: 'JP', companyCode: 'JP-B',
    businessUnitCode: 'BU-RD', projectCode: 'MP', deptCode: 'MP-BE',
    positionCode: 'GAME-BE', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',
    hireDate: new Date('2021-11-16'), gender: 'male', managerEmployeeNo: '13001',
  },
  {
    employeeNo: '13005', email: 'eric.chen@oa.com',    nameZh: '陳怡仁', nameEn: 'Eric Chen',
    displayName: '陳怡仁', regionCode: 'JP', companyCode: 'JP-B',
    businessUnitCode: 'BU-RD', projectCode: 'MP', deptCode: 'MP-API',
    positionCode: 'API-ENG', jobLevelCode: 'L4', roleCode: 'DEPT_MANAGER',
    hireDate: new Date('2020-05-01'), gender: 'male', managerEmployeeNo: '13001',
  },
  {
    employeeNo: '13006', email: 'fiona.wu@oa.com',     nameZh: '吳芳如', nameEn: 'Fiona Wu',
    displayName: '吳芳如', regionCode: 'JP', companyCode: 'JP-B',
    businessUnitCode: 'BU-RD', projectCode: 'MP', deptCode: 'MP-QA',
    positionCode: 'QA-ENG', jobLevelCode: 'L2', roleCode: 'EMPLOYEE',
    hireDate: new Date('2022-09-01'), gender: 'female', managerEmployeeNo: '13001',
  },
  // ── 台灣總公司支援部門 ──────────────────────
  {
    employeeNo: '10001', email: 'lily.zhang@oa.com',   nameZh: '張美玲', nameEn: 'Lily Zhang',
    displayName: '張美玲', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: 'BU-PMO', deptCode: 'HR',
    positionCode: 'HR-SPEC', jobLevelCode: 'L6', roleCode: 'HR_ADMIN',
    hireDate: new Date('2017-06-01'), gender: 'female',
  },
  {
    employeeNo: '10002', email: 'ken.chen@oa.com',     nameZh: '陳志遠', nameEn: 'Ken Chen',
    displayName: '陳志遠', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: 'BU-STRATEGY', deptCode: 'FIN',
    positionCode: 'FIN-SPEC', jobLevelCode: 'L6', roleCode: 'FINANCE_ADMIN',
    hireDate: new Date('2016-09-20'), gender: 'male',
  },
  {
    employeeNo: '10003', email: 'grace.zhou@oa.com',   nameZh: '周佩珊', nameEn: 'Grace Zhou',
    displayName: '周佩珊', regionCode: 'TW', companyCode: 'TW-HQ',
    businessUnitCode: undefined, deptCode: 'ADMIN',
    positionCode: 'ADMIN-SPEC', jobLevelCode: 'L2', roleCode: 'EMPLOYEE',
    hireDate: new Date('2022-05-09'), gender: 'female', managerEmployeeNo: '10001',
  },
  // ── 菲律賓子公司 ────────────────────────────
  {
    employeeNo: '14001', email: 'sarah.tan@oa.com',    nameZh: '陳小慧', nameEn: 'Sarah Tan',
    displayName: '陳小慧', regionCode: 'PH', companyCode: 'PH-CO',
    businessUnitCode: 'BU-1ST', projectCode: 'YL', deptCode: 'YL-OPS',
    positionCode: 'OPS-SPEC', jobLevelCode: 'L2', roleCode: 'EMPLOYEE',
    hireDate: new Date('2023-01-16'), gender: 'female', managerEmployeeNo: '11002',
  },
];

// ── 假別定義 ──────────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { code: 'ANNUAL',      name: '年假',     description: '員工年度特休假',      requiresApproval: true,  isPaid: true,  isAnnual: true,  allowCarryOver: true,  carryOverLimitDays: 5,  allowNegativeBalance: false },
  { code: 'PERSONAL',    name: '事假',     description: '個人事務請假',        requiresApproval: true,  isPaid: false, isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'SICK',        name: '病假',     description: '因病請假',            requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'MARRIAGE',    name: '婚假',     description: '本人結婚請假，8天',   requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'BEREAVEMENT', name: '喪假',     description: '直系親屬喪亡請假',    requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'MATERNITY',   name: '產假',     description: '女性員工生產請假',    requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'PATERNITY',   name: '陪產假',   description: '男性員工配偶生產請假', requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'OFFICIAL',    name: '公假',     description: '公務或受召請假',      requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
];

// ══════════════════════════════════════════════════════
// 審批模板
// 所有表單套用相同的三階段審批路徑（group_org）：
//   Step 1：直屬主管審核
//   Step 2：部門主管審核
//   Step 3：項目負責人審核
// ══════════════════════════════════════════════════════

interface ApprovalTemplateSeed {
  code: string;
  name: string;
  formType: string;
  approvalRouteType: string;
  steps: Array<{
    stepOrder: number;
    stepName: string;
    approverType: string;
    approvalMode: string;
  }>;
}

const APPROVAL_TEMPLATES: ApprovalTemplateSeed[] = [
  {
    code: 'TPL-LEAVE',         name: '請假申請審批流',    formType: 'leave_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-OT',            name: '加班申請審批流',    formType: 'overtime_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-CLOCK',         name: '補卡申請審批流',    formType: 'clock_patch_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-PURCHASE',      name: '採購申請審批流',    formType: 'purchase_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-REIMBURSE',     name: '費用報銷審批流',    formType: 'reimbursement_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-TRIP',          name: '出差申請審批流',    formType: 'business_trip',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-ASSET',         name: 'OA 資產申請審批流', formType: 'asset_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-MEAL',          name: '誤餐費申請審批流',  formType: 'meal_allowance',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-IT',            name: '資訊需求申請審批流', formType: 'it_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-HEADCOUNT',     name: '人力需求申請審批流', formType: 'headcount_request',
    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', approverType: 'project_owner',           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-RESIGN',        name: '離職申請審批流',    formType: 'resignation',
    approvalRouteType: 'mixed',
    steps: [
      { stepOrder: 1, stepName: '直屬主管確認', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管確認', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '事業部負責人確認', approverType: 'business_unit_head',    approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-LWP',           name: '留職停薪申請審批流', formType: 'leave_without_pay',
    approvalRouteType: 'mixed',
    steps: [
      { stepOrder: 1, stepName: '直屬主管確認', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管確認', approverType: 'department_manager',        approvalMode: 'any' },
      { stepOrder: 3, stepName: '事業部負責人確認', approverType: 'business_unit_head',    approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-PAYROLL',       name: '薪資申請審批流',    formType: 'payroll_request',
    approvalRouteType: 'office_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管確認', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '公司 HR 審核', approverType: 'company_hr',               approvalMode: 'any' },
      { stepOrder: 3, stepName: '公司財務確認', approverType: 'company_finance',           approvalMode: 'any' },
    ],
  },
];

// ══════════════════════════════════════════════════════
// 主函式
// ══════════════════════════════════════════════════════

async function main() {
  console.log('🌱 開始植入種子資料...\n');

  // ── 1. 權限與角色 ──────────────────────────────────────
  console.log('📋 建立權限與角色...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code: p.code }, create: p, update: { name: p.name, module: p.module } });
  }
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { code: r.code }, create: r, update: {} });
  }
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const allPerms = await prisma.permission.findMany({ select: { id: true } });
  if (adminRole && allPerms.length > 0) {
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${PERMISSIONS.length} 個權限、${ROLES.length} 個角色\n`);

  // ── 2. 假別 ────────────────────────────────────────────
  console.log('📅 建立假別...');
  for (const lt of LEAVE_TYPES) {
    await prisma.leaveType.upsert({ where: { code: lt.code }, create: lt as any, update: { name: lt.name } });
  }
  console.log(`   ✓ ${LEAVE_TYPES.length} 個假別\n`);

  // ── 3. 地區 ────────────────────────────────────────────
  console.log('🌏 建立地區...');
  const regionMap = new Map<string, string>(); // code → id
  for (const r of REGIONS) {
    const region = await prisma.region.upsert({ where: { code: r.code }, create: r, update: { name: r.name } });
    regionMap.set(r.code, region.id);
  }
  console.log(`   ✓ ${REGIONS.length} 個地區\n`);

  // ── 4. 公司 ────────────────────────────────────────────
  console.log('🏢 建立公司...');
  const companyMap = new Map<string, string>(); // code → id
  for (const c of COMPANIES) {
    const regionId = regionMap.get(c.regionCode)!;
    const company = await prisma.company.upsert({
      where: { code: c.code },
      create: { regionId, code: c.code, name: c.name, legalName: c.legalName, currencyCode: c.currencyCode },
      update: { name: c.name },
    });
    companyMap.set(c.code, company.id);
  }
  console.log(`   ✓ ${COMPANIES.length} 間公司\n`);

  // ── 5. 事業部 ──────────────────────────────────────────
  console.log('🏭 建立事業部...');
  const buMap = new Map<string, string>(); // code → id
  for (const bu of BUSINESS_UNITS) {
    const unit = await prisma.businessUnit.upsert({
      where: { code: bu.code },
      create: bu,
      update: { name: bu.name, description: bu.description },
    });
    buMap.set(bu.code, unit.id);
  }
  console.log(`   ✓ ${BUSINESS_UNITS.length} 個事業部\n`);

  // ── 6. 職級 ────────────────────────────────────────────
  console.log('📊 建立職級...');
  const jobLevelMap = new Map<string, string>(); // code → id
  for (const jl of JOB_LEVELS) {
    const level = await prisma.jobLevel.upsert({ where: { code: jl.code }, create: jl, update: { name: jl.name, levelOrder: jl.levelOrder } });
    jobLevelMap.set(jl.code, level.id);
  }
  console.log(`   ✓ ${JOB_LEVELS.length} 個職級\n`);

  // ── 7. 項目 ────────────────────────────────────────────
  console.log('📁 建立項目...');
  const projectMap = new Map<string, string>(); // code → id
  for (const p of PROJECTS) {
    const buId = buMap.get(p.businessUnitCode);
    const project = await prisma.project.upsert({
      where: { code: p.code },
      create: { code: p.code, name: p.name, description: p.description, businessUnitId: buId, startDate: p.startDate },
      update: { name: p.name, businessUnitId: buId },
    });
    projectMap.set(p.code, project.id);
  }
  console.log(`   ✓ ${PROJECTS.length} 個項目\n`);

  // ── 8. 部門 ────────────────────────────────────────────
  console.log('🏬 建立部門...');
  const deptMap = new Map<string, string>(); // code → id

  for (const d of DEPARTMENTS) {
    const projectId = d.projectCode ? projectMap.get(d.projectCode) : undefined;
    const companyId = d.companyCode ? companyMap.get(d.companyCode) : undefined;
    const existing = await prisma.department.findFirst({ where: { code: d.code } });
    if (!existing) {
      const created = await prisma.department.create({
        data: { code: d.code, name: d.name, projectId, companyId },
      });
      deptMap.set(d.code, created.id);
    } else {
      await prisma.department.update({ where: { id: existing.id }, data: { projectId, companyId } });
      deptMap.set(d.code, existing.id);
    }
  }
  console.log(`   ✓ ${DEPARTMENTS.length} 個部門\n`);

  // ── 9. 職位 ────────────────────────────────────────────
  console.log('💼 建立職位...');
  const positionMap = new Map<string, string>(); // code → id
  for (const pos of POSITIONS) {
    const existing = await prisma.position.findFirst({ where: { companyId: null, code: pos.code } });
    if (!existing) {
      const created = await prisma.position.create({ data: { code: pos.code, name: pos.name, description: pos.description } });
      positionMap.set(pos.code, created.id);
    } else {
      positionMap.set(pos.code, existing.id);
    }
  }
  console.log(`   ✓ ${POSITIONS.length} 個職位\n`);

  // ── 10. 系統管理員帳號 ────────────────────────────────
  console.log('🔑 建立系統管理員帳號...');
  const adminEmail = 'admin@oa.com';
  let adminUser = await prisma.user.findFirst({ where: { OR: [{ email: adminEmail }, { employeeNo: '00001' }] } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        employeeNo: '00001',
        email: adminEmail,
        displayName: '系統管理員',
        nameZh: '系統管理員',
        nameEn: 'System Admin',
        passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 12),
        status: 'active',
        passwordChangedAt: new Date(),
      },
    });
  } else {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { employeeNo: '00001', displayName: '系統管理員', nameZh: '系統管理員', nameEn: 'System Admin' },
    });
  }
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId_scopeType_scopeId: { userId: adminUser.id, roleId: adminRole.id, scopeType: null as unknown as string, scopeId: null as unknown as string } },
      create: { userId: adminUser.id, roleId: adminRole.id, grantedBy: adminUser.id },
      update: {},
    }).catch(() => { /* 可能 null unique constraint 問題，改用 findFirst */ });
    const existsRole = await prisma.userRole.findFirst({ where: { userId: adminUser.id, roleId: adminRole.id } });
    if (!existsRole) {
      await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id, grantedBy: adminUser.id } });
    }
  }
  console.log(`   ✓ admin@oa.com\n`);

  // ── 11. 員工帳號 ──────────────────────────────────────
  console.log('👥 建立員工帳號...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const userMap = new Map<string, string>(); // employeeNo → userId

  for (const emp of EMPLOYEES) {
    let user = await prisma.user.findFirst({ where: { OR: [{ employeeNo: emp.employeeNo }, { email: emp.email }] } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          employeeNo: emp.employeeNo,
          email: emp.email,
          displayName: emp.displayName,
          nameZh: emp.nameZh,
          nameEn: emp.nameEn,
          passwordHash,
          status: 'active',
          passwordChangedAt: new Date(),
        },
      });
    }
    userMap.set(emp.employeeNo, user.id);

    // 員工人事資料
    const profileExists = await prisma.employeeProfile.findUnique({ where: { userId: user.id } });
    if (!profileExists) {
      await prisma.employeeProfile.create({
        data: {
          userId: user.id,
          gender: emp.gender,
          hireDate: emp.hireDate,
          employmentType: 'full_time',
          regularDate: new Date(emp.hireDate.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 指派角色
    const role = await prisma.role.findUnique({ where: { code: emp.roleCode } });
    if (role) {
      const existsRole = await prisma.userRole.findFirst({ where: { userId: user.id, roleId: role.id } });
      if (!existsRole) {
        await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      }
    }
  }
  console.log(`   ✓ ${EMPLOYEES.length} 位員工\n`);

  // ── 12. 員工組織歸屬（含兩條組織線）────────────────────
  console.log('🔗 建立員工組織歸屬...');
  for (const emp of EMPLOYEES) {
    const userId = userMap.get(emp.employeeNo)!;
    const regionId = regionMap.get(emp.regionCode);
    const companyId = companyMap.get(emp.companyCode);
    const businessUnitId = emp.businessUnitCode ? buMap.get(emp.businessUnitCode) : undefined;
    const projectId = emp.projectCode ? projectMap.get(emp.projectCode) : undefined;
    const departmentId = deptMap.get(emp.deptCode);
    const positionId = positionMap.get(emp.positionCode);
    const jobLevelId = jobLevelMap.get(emp.jobLevelCode);
    const directManagerUserId = emp.managerEmployeeNo ? userMap.get(emp.managerEmployeeNo) : undefined;

    const existsOrg = await prisma.userOrgAssignment.findFirst({ where: { userId, isPrimary: true } });
    if (!existsOrg) {
      await prisma.userOrgAssignment.create({
        data: {
          userId,
          regionId,
          companyId,
          businessUnitId,
          projectId,
          departmentId,
          positionId,
          jobLevelId,
          directManagerUserId,
          isPrimary: true,
          assignmentType: 'primary',
          startedAt: emp.hireDate,
        },
      });
    } else {
      await prisma.userOrgAssignment.update({
        where: { id: existsOrg.id },
        data: { regionId, companyId, businessUnitId, projectId, departmentId, positionId, jobLevelId, directManagerUserId },
      });
    }
  }
  console.log(`   ✓ 組織歸屬完成\n`);

  // ── 13. 組織負責人（OrganizationLeader）────────────────
  console.log('👑 建立組織負責人...');

  // 事業部負責人（head）
  const buLeaders: Array<{ buCode: string; empNo: string }> = [
    { buCode: 'BU-1ST',      empNo: '11001' },
    { buCode: 'BU-2ND',      empNo: '12001' },
    { buCode: 'BU-RD',       empNo: '13001' },
    { buCode: 'BU-STRATEGY', empNo: '10002' },
    { buCode: 'BU-PMO',      empNo: '10001' },
  ];
  for (const bl of buLeaders) {
    const buId = buMap.get(bl.buCode)!;
    const userId = userMap.get(bl.empNo)!;
    const exists = await prisma.organizationLeader.findFirst({ where: { orgType: 'business_unit', orgId: buId, userId, leaderType: 'head' } });
    if (!exists) {
      await prisma.organizationLeader.create({
        data: { orgType: 'business_unit', orgId: buId, userId, leaderType: 'head', isPrimary: true, startedAt: new Date('2023-01-01') },
      });
    }
    // 同步更新 BusinessUnit.headUserId
    await prisma.businessUnit.update({ where: { id: buId }, data: { headUserId: userId } });
  }

  // 項目負責人（owner）
  const projectOwners: Array<{ projCode: string; empNo: string }> = [
    { projCode: 'YL', empNo: '11001' },
    { projCode: 'LY', empNo: '11001' },
    { projCode: 'KX', empNo: '12001' },
    { projCode: 'MP', empNo: '13001' },
  ];
  for (const po of projectOwners) {
    const projId = projectMap.get(po.projCode)!;
    const userId = userMap.get(po.empNo)!;
    const exists = await prisma.organizationLeader.findFirst({ where: { orgType: 'project', orgId: projId, userId, leaderType: 'owner' } });
    if (!exists) {
      await prisma.organizationLeader.create({
        data: { orgType: 'project', orgId: projId, userId, leaderType: 'owner', isPrimary: true, startedAt: new Date('2023-01-01') },
      });
    }
    await prisma.project.update({ where: { id: projId }, data: { projectOwnerUserId: userId } });
  }

  // 部門主管（manager）
  const deptManagers: Array<{ deptCode: string; empNo: string }> = [
    { deptCode: 'YL-OPS',  empNo: '11002' },
    { deptCode: 'YL-RISK', empNo: '11004' },
    { deptCode: 'YL-PROD', empNo: '11005' },
    { deptCode: 'LY-OPS',  empNo: '11006' },
    { deptCode: 'LY-CS',   empNo: '11007' },
    { deptCode: 'KX-OPS',  empNo: '12001' },
    { deptCode: 'KX-MKT',  empNo: '12003' },
    { deptCode: 'MP-FE',   empNo: '13002' },
    { deptCode: 'MP-BE',   empNo: '13001' },
    { deptCode: 'MP-API',  empNo: '13005' },
    { deptCode: 'MP-QA',   empNo: '13006' },
    { deptCode: 'HR',      empNo: '10001' },
    { deptCode: 'FIN',     empNo: '10002' },
  ];
  for (const dm of deptManagers) {
    const deptId = deptMap.get(dm.deptCode)!;
    const userId = userMap.get(dm.empNo)!;
    if (!deptId || !userId) continue;
    const exists = await prisma.organizationLeader.findFirst({ where: { orgType: 'department', orgId: deptId, userId, leaderType: 'manager' } });
    if (!exists) {
      await prisma.organizationLeader.create({
        data: { orgType: 'department', orgId: deptId, userId, leaderType: 'manager', isPrimary: true, startedAt: new Date('2023-01-01') },
      });
    }
    await prisma.department.update({ where: { id: deptId }, data: { managerUserId: userId } });
  }

  console.log(`   ✓ 組織負責人設定完成\n`);

  // ── 14. 員工成本分攤（EmployeeCostAllocation）──────────
  console.log('💰 建立員工成本分攤...');

  // 大部分員工 100% 歸屬於主要項目/部門
  // 演示：13003 Amy Liu（MP-FE）分攤 70% MP、30% YL
  const amyId = userMap.get('13003')!;
  const mpId = projectMap.get('MP')!;
  const ylId = projectMap.get('YL')!;
  const mpFeDeptId = deptMap.get('MP-FE')!;
  const ylOpsDeptId = deptMap.get('YL-OPS')!;
  const buRdId = buMap.get('BU-RD')!;
  const bu1stId = buMap.get('BU-1ST')!;
  const twHqCompanyId = companyMap.get('JP-B')!;
  const jpRegionId = regionMap.get('JP')!;
  const twRegionId = regionMap.get('TW')!;

  const existsAmy1 = await prisma.employeeCostAllocation.findFirst({ where: { userId: amyId, projectId: mpId, startedAt: new Date('2026-01-01') } });
  if (!existsAmy1) {
    await prisma.employeeCostAllocation.create({
      data: {
        userId: amyId, regionId: jpRegionId, companyId: twHqCompanyId,
        businessUnitId: buRdId, projectId: mpId, departmentId: mpFeDeptId,
        allocationPercent: 70, startedAt: new Date('2026-01-01'),
      },
    });
    await prisma.employeeCostAllocation.create({
      data: {
        userId: amyId, regionId: twRegionId, companyId: companyMap.get('TW-HQ')!,
        businessUnitId: bu1stId, projectId: ylId, departmentId: ylOpsDeptId,
        allocationPercent: 30, startedAt: new Date('2026-01-01'),
      },
    });
  }
  console.log(`   ✓ 員工成本分攤設定完成\n`);

  // ── 15. 審批模板 ──────────────────────────────────────
  console.log('⚙️  建立審批模板...');
  for (const tpl of APPROVAL_TEMPLATES) {
    let template = await prisma.approvalTemplate.findFirst({ where: { code: tpl.code } });
    if (!template) {
      template = await prisma.approvalTemplate.create({
        data: {
          code: tpl.code,
          name: tpl.name,
          formType: tpl.formType,
          approvalRouteType: tpl.approvalRouteType,
          priority: 100,
          isActive: true,
        },
      });
    }
    for (const step of tpl.steps) {
      const existsStep = await prisma.approvalTemplateStep.findFirst({
        where: { approvalTemplateId: template.id, stepOrder: step.stepOrder },
      });
      if (!existsStep) {
        const createdStep = await prisma.approvalTemplateStep.create({
          data: {
            approvalTemplateId: template.id,
            stepOrder: step.stepOrder,
            stepName: step.stepName,
            approvalMode: step.approvalMode,
            isRequired: true,
          },
        });
        await prisma.approvalTemplateStepApprover.create({
          data: {
            approvalTemplateStepId: createdStep.id,
            approverType: step.approverType,
          },
        });
      }
    }
  }
  console.log(`   ✓ ${APPROVAL_TEMPLATES.length} 個審批模板（每個 3 步驟）\n`);

  // ── 16. 測試用 OaFormRequest 資料 ────────────────────
  console.log('📝 建立測試電子表單...');

  const mark = userMap.get('11003')!; // 吳明峰（YL-OPS 員工）
  const nina = userMap.get('11004')!; // 黃怡寧（YL-RISK 員工）
  const amy  = userMap.get('13003')!; // 劉雅婷（MP-FE 員工）
  const eric = userMap.get('13005')!; // 陳怡仁（MP-API 主管）
  const ivy  = userMap.get('12002')!; // 李依琳（KX-OPS 員工）

  const ylBuId  = buMap.get('BU-1ST')!;
  const rdBuId  = buMap.get('BU-RD')!;
  const kxBuId  = buMap.get('BU-2ND')!;
  const ylProjId = projectMap.get('YL')!;
  const mpProjId = projectMap.get('MP')!;
  const kxProjId = projectMap.get('KX')!;
  const ylOpsDept = deptMap.get('YL-OPS')!;
  const ylRiskDept = deptMap.get('YL-RISK')!;
  const mpFeDept = deptMap.get('MP-FE')!;
  const mpApiDept = deptMap.get('MP-API')!;
  const kxOpsDept = deptMap.get('KX-OPS')!;
  const twHq  = companyMap.get('TW-HQ')!;
  const jpB   = companyMap.get('JP-B')!;
  const hkCo  = companyMap.get('HK-CO')!;
  const twReg = regionMap.get('TW')!;
  const jpReg = regionMap.get('JP')!;
  const hkReg = regionMap.get('HK')!;

  const testForms = [
    {
      formType: 'leave_request',
      submitterUserId: mark,
      businessUnitId: ylBuId, projectId: ylProjId, departmentId: ylOpsDept,
      companyId: twHq, regionId: twReg,
      status: 'pending', submittedAt: new Date('2026-05-20'),
      content: { leaveType: 'ANNUAL', startDate: '2026-06-10', endDate: '2026-06-12', totalDays: 3, reason: '家庭旅遊' },
    },
    {
      formType: 'overtime_request',
      submitterUserId: nina,
      businessUnitId: ylBuId, projectId: ylProjId, departmentId: ylRiskDept,
      companyId: twHq, regionId: twReg,
      status: 'approved', submittedAt: new Date('2026-05-18'),
      content: { overtimeDate: '2026-05-25', startTime: '18:00', endTime: '21:00', totalHours: 3, reason: '月底風控數據彙整' },
    },
    {
      formType: 'business_trip',
      submitterUserId: amy,
      businessUnitId: rdBuId, projectId: mpProjId, departmentId: mpFeDept,
      companyId: jpB, regionId: jpReg,
      status: 'pending', submittedAt: new Date('2026-05-25'),
      content: { destination: '台灣台北', departDate: '2026-06-15', returnDate: '2026-06-17', purpose: '與 YL 項目前端對接', estimatedCost: 25000, currency: 'JPY' },
    },
    {
      formType: 'purchase_request',
      submitterUserId: eric,
      businessUnitId: rdBuId, projectId: mpProjId, departmentId: mpApiDept,
      companyId: jpB, regionId: jpReg,
      status: 'approved', submittedAt: new Date('2026-05-10'),
      content: { title: '採購 API 壓力測試工具', vendor: 'LoadRunner', amount: 150000, currency: 'JPY', description: '年度 API 效能測試授權' },
    },
    {
      formType: 'reimbursement_request',
      submitterUserId: ivy,
      businessUnitId: kxBuId, projectId: kxProjId, departmentId: kxOpsDept,
      companyId: hkCo, regionId: hkReg,
      status: 'draft',
      content: { title: '五月份客戶招待費用', items: [{ date: '2026-05-15', type: '餐費', amount: 1200, currency: 'HKD', vendor: '○○餐廳' }] },
    },
    {
      formType: 'meal_allowance',
      submitterUserId: mark,
      businessUnitId: ylBuId, projectId: ylProjId, departmentId: ylOpsDept,
      companyId: twHq, regionId: twReg,
      status: 'approved', submittedAt: new Date('2026-05-22'),
      content: { date: '2026-05-22', reason: '加班誤餐', amount: 150, currency: 'TWD' },
    },
    {
      formType: 'it_request',
      submitterUserId: nina,
      businessUnitId: ylBuId, projectId: ylProjId, departmentId: ylRiskDept,
      companyId: twHq, regionId: twReg,
      status: 'pending', submittedAt: new Date('2026-05-28'),
      content: { requestType: '軟體授權', description: '申請 Excel 進階版授權 1 套', urgency: 'normal' },
    },
    {
      formType: 'headcount_request',
      submitterUserId: amy,
      businessUnitId: rdBuId, projectId: mpProjId, departmentId: mpFeDept,
      companyId: jpB, regionId: jpReg,
      status: 'pending', submittedAt: new Date('2026-05-30'),
      content: { position: '遊戲前端工程師', count: 2, expectedStartDate: '2026-08-01', reason: '新版本開發需求人力' },
    },
  ];

  for (const form of testForms) {
    const existing = await prisma.oaFormRequest.findFirst({
      where: { submitterUserId: form.submitterUserId, formType: form.formType, status: form.status },
    });
    if (!existing) {
      await prisma.oaFormRequest.create({ data: form as any });
    }
  }
  console.log(`   ✓ ${testForms.length} 筆測試電子表單\n`);

  // ── 17. 薪資結構 ──────────────────────────────────────
  console.log('💵 建立薪資結構...');

  interface SalarySeed {
    empNo: string;
    currencyCode: string;
    baseSalary: number;
  }

  // 依照各員工職級與所屬公司幣別設定月薪（TWD/JPY/HKD/PHP）
  const SALARY_STRUCTURES: SalarySeed[] = [
    { empNo: '11001', currencyCode: 'TWD', baseSalary: 180000 },
    { empNo: '11002', currencyCode: 'TWD', baseSalary: 120000 },
    { empNo: '11003', currencyCode: 'TWD', baseSalary: 55000 },
    { empNo: '11004', currencyCode: 'TWD', baseSalary: 55000 },
    { empNo: '11005', currencyCode: 'TWD', baseSalary: 90000 },
    { empNo: '11006', currencyCode: 'JPY', baseSalary: 550000 },
    { empNo: '11007', currencyCode: 'JPY', baseSalary: 280000 },
    { empNo: '12001', currencyCode: 'HKD', baseSalary: 80000 },
    { empNo: '12002', currencyCode: 'HKD', baseSalary: 25000 },
    { empNo: '12003', currencyCode: 'HKD', baseSalary: 25000 },
    { empNo: '13001', currencyCode: 'JPY', baseSalary: 700000 },
    { empNo: '13002', currencyCode: 'JPY', baseSalary: 550000 },
    { empNo: '13003', currencyCode: 'JPY', baseSalary: 350000 },
    { empNo: '13004', currencyCode: 'JPY', baseSalary: 350000 },
    { empNo: '13005', currencyCode: 'JPY', baseSalary: 420000 },
    { empNo: '13006', currencyCode: 'JPY', baseSalary: 280000 },
    { empNo: '10001', currencyCode: 'TWD', baseSalary: 120000 },
    { empNo: '10002', currencyCode: 'TWD', baseSalary: 120000 },
    { empNo: '10003', currencyCode: 'TWD', baseSalary: 40000 },
    { empNo: '14001', currencyCode: 'PHP', baseSalary: 38000 },
  ];

  const salaryStructureMap = new Map<string, string>(); // empNo → salaryStructureId
  for (const ss of SALARY_STRUCTURES) {
    const userId = userMap.get(ss.empNo)!;
    const existing = await prisma.salaryStructure.findFirst({
      where: { userId, currencyCode: ss.currencyCode, endDate: null },
    });
    if (!existing) {
      const created = await prisma.salaryStructure.create({
        data: {
          userId,
          currencyCode: ss.currencyCode,
          baseSalary: ss.baseSalary,
          effectiveDate: new Date('2026-01-01'),
          changeReason: '初始薪資設定',
          createdBy: adminUser.id,
        },
      });
      salaryStructureMap.set(ss.empNo, created.id);
    } else {
      salaryStructureMap.set(ss.empNo, existing.id);
    }
  }
  console.log(`   ✓ ${SALARY_STRUCTURES.length} 筆薪資結構\n`);

  // ── 18. 薪資期別（2026-05）────────────────────────────
  console.log('📅 建立薪資期別（2026-05）...');
  let payrollPeriod = await prisma.payrollPeriod.findFirst({ where: { year: 2026, month: 5 } });
  if (!payrollPeriod) {
    payrollPeriod = await prisma.payrollPeriod.create({
      data: {
        year: 2026,
        month: 5,
        periodStart: new Date('2026-05-01'),
        periodEnd: new Date('2026-05-31'),
        payDate: new Date('2026-05-31'),
        status: 'paid',
        lockedAt: new Date('2026-05-25'),
      },
    });
  }
  console.log(`   ✓ 薪資期別 2026-05（${payrollPeriod.status}）\n`);

  // ── 19. 薪資紀錄（2026-05 月薪）──────────────────────
  console.log('💰 建立薪資紀錄（2026-05）...');
  const payrollRecordMap = new Map<string, string>(); // empNo → payrollRecordId
  for (const ss of SALARY_STRUCTURES) {
    const userId = userMap.get(ss.empNo)!;
    const salaryStructureId = salaryStructureMap.get(ss.empNo);
    const grossSalary = ss.baseSalary;
    const incomeTax = Math.round(grossSalary * 0.1);
    const socialInsurance = Math.round(grossSalary * 0.1);
    const totalDeductions = incomeTax + socialInsurance;
    const netSalary = grossSalary - totalDeductions;

    const existing = await prisma.payrollRecord.findFirst({
      where: { payrollPeriodId: payrollPeriod.id, userId },
    });
    if (!existing) {
      const record = await prisma.payrollRecord.create({
        data: {
          payrollPeriodId: payrollPeriod.id,
          userId,
          salaryStructureId,
          currencyCode: ss.currencyCode,
          baseSalary: grossSalary,
          totalAllowances: 0,
          overtimePay: 0,
          bonus: 0,
          grossSalary,
          incomeTax,
          socialInsurance,
          otherDeductions: 0,
          totalDeductions,
          netSalary,
          status: 'paid',
        },
      });
      payrollRecordMap.set(ss.empNo, record.id);
    } else {
      payrollRecordMap.set(ss.empNo, existing.id);
    }
  }
  console.log(`   ✓ ${SALARY_STRUCTURES.length} 筆薪資紀錄\n`);

  // ── 20. 薪資成本分攤快照（2026-05）───────────────────
  console.log('📊 建立薪資成本分攤快照（2026-05）...');

  // Amy Liu（13003）特殊分攤：MP 70%、YL 30%；其他員工 100% 歸屬主要組織
  interface SnapshotAlloc {
    percent: number;
    regionCode: string;
    companyCode: string;
    buCode?: string;
    projCode?: string;
    deptCode: string;
  }
  const specialAllocation: Record<string, SnapshotAlloc[]> = {
    '13003': [
      { percent: 70, regionCode: 'JP', companyCode: 'JP-B', buCode: 'BU-RD', projCode: 'MP', deptCode: 'MP-FE' },
      { percent: 30, regionCode: 'TW', companyCode: 'TW-HQ', buCode: 'BU-1ST', projCode: 'YL', deptCode: 'YL-OPS' },
    ],
  };

  for (const ss of SALARY_STRUCTURES) {
    const payrollRecordId = payrollRecordMap.get(ss.empNo);
    if (!payrollRecordId) continue;
    const existing = await prisma.payrollCostAllocationSnapshot.findFirst({
      where: { payrollPeriodId: payrollPeriod.id, payrollRecordId },
    });
    if (existing) continue;

    const emp = EMPLOYEES.find(e => e.employeeNo === ss.empNo)!;
    const allocations: SnapshotAlloc[] = specialAllocation[ss.empNo] ?? [
      {
        percent: 100,
        regionCode: emp.regionCode,
        companyCode: emp.companyCode,
        buCode: emp.businessUnitCode,
        projCode: emp.projectCode,
        deptCode: emp.deptCode,
      },
    ];

    for (const alloc of allocations) {
      const allocatedAmount = Math.round(ss.baseSalary * (alloc.percent / 100));
      await prisma.payrollCostAllocationSnapshot.create({
        data: {
          payrollPeriodId: payrollPeriod.id,
          payrollRecordId,
          userId: userMap.get(ss.empNo)!,
          regionId: regionMap.get(alloc.regionCode),
          companyId: companyMap.get(alloc.companyCode),
          businessUnitId: alloc.buCode ? buMap.get(alloc.buCode) : undefined,
          projectId: alloc.projCode ? projectMap.get(alloc.projCode) : undefined,
          departmentId: deptMap.get(alloc.deptCode),
          allocationPercent: alloc.percent,
          allocatedAmount,
          currencyCode: ss.currencyCode,
        },
      });
    }
  }
  console.log(`   ✓ 薪資成本分攤快照建立完成（2026-05）\n`);

  // ── 完成 ──────────────────────────────────────────────
  console.log('✅ 種子資料植入完成！');
  console.log('\n📌 登入資訊（密碼均為）：', DEFAULT_PASSWORD);
  console.log('   工號  / Email                      | 身份              | 組織');
  console.log('   -----------------------------------|--------------------|---------------------');
  console.log(`   00001 / admin@oa.com               | 系統管理員         | —`);
  console.log(`   11001 / tom.lin@oa.com             | 第一事業部負責人   | BU-1ST / YL+LY 項目負責人`);
  console.log(`   11002 / alice.chen@oa.com          | YL 運營主管        | BU-1ST / YL / YL-OPS`);
  console.log(`   12001 / bob.zhang@oa.com           | 第二事業部+KX負責人| BU-2ND / KX / KX-OPS`);
  console.log(`   13001 / david.wang@oa.com          | 研發中心+MP負責人  | BU-RD / MP / MP-BE`);
  console.log(`   13002 / jack.huang@oa.com          | MP前端主管         | BU-RD / MP / MP-FE`);
  console.log(`   10001 / lily.zhang@oa.com          | HR管理員           | TW-HQ / HR`);
  console.log(`   10002 / ken.chen@oa.com            | 財務管理員         | TW-HQ / FIN`);
  console.log('   （其餘所有員工密碼相同）\n');
  console.log('📊 審批模板：13 種表單類型各一套 3 步驟審批流');
  console.log('📝 測試表單：8 筆（leave/overtime/trip/purchase/reimburse/meal/it/headcount）');
  console.log('💵 薪資結構：20 位員工（TWD/JPY/HKD/PHP）');
  console.log('📅 薪資期別：2026-05（paid），20 筆薪資紀錄＋成本分攤快照（Amy Liu 70/30 跨項目）');
}

main()
  .catch((e) => { console.error('❌ 種子資料植入失敗：', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
