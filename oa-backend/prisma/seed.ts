import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '!Aa123456';

// ── 權限與角色 ────────────────────────────────────────────────────────────────

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
  { code: 'SUPER_ADMIN',   name: '超級管理員',  description: '系統最高權限，可操作所有功能',          isSystem: true },
  { code: 'HR_ADMIN',      name: 'HR管理員',    description: '管理員工、薪資與假勤政策',              isSystem: true },
  { code: 'FINANCE_ADMIN', name: '財務管理員',  description: '管理採購申請與費用報銷',                isSystem: true },
  { code: 'DEPT_MANAGER',  name: '部門主管',    description: '審核部門內的假勤與採購申請',            isSystem: true },
  { code: 'APPROVER',      name: '審核人員',    description: '可審核各類申請',                       isSystem: true },
  { code: 'EMPLOYEE',      name: '一般員工',    description: 'OA基本功能',                          isSystem: true },
  { code: 'AUDITOR',       name: '稽核人員',    description: '唯讀存取所有財務文件',                  isSystem: true },
];

// ── 種子資料定義 ──────────────────────────────────────────────────────────────

const REGIONS = [
  { code: 'TW', name: '台灣',    timezone: 'Asia/Taipei',     currencyCode: 'TWD' },
  { code: 'HK', name: '香港',    timezone: 'Asia/Hong_Kong',  currencyCode: 'HKD' },
  { code: 'SG', name: '新加坡',  timezone: 'Asia/Singapore',  currencyCode: 'SGD' },
  { code: 'JP', name: '日本',    timezone: 'Asia/Tokyo',      currencyCode: 'JPY' },
  { code: 'US', name: '美國',    timezone: 'America/New_York', currencyCode: 'USD' },
];

const COMPANIES = [
  { regionCode: 'TW', code: 'TW-HQ',  name: '台灣總公司',        legalName: '○○股份有限公司',     currencyCode: 'TWD' },
  { regionCode: 'TW', code: 'TW-MFG', name: '台灣製造廠',        legalName: '○○製造股份有限公司', currencyCode: 'TWD' },
  { regionCode: 'HK', code: 'HK-CO',  name: '香港子公司',        legalName: 'OA Holdings HK Ltd', currencyCode: 'HKD' },
  { regionCode: 'SG', code: 'SG-CO',  name: '新加坡子公司',      legalName: 'OA Singapore Pte Ltd', currencyCode: 'SGD' },
];

const BUSINESS_UNITS = [
  { code: 'BU-IT',  name: '資訊事業部',  description: '負責集團資訊系統建置與維運' },
  { code: 'BU-FIN', name: '財務事業部',  description: '負責集團財務規劃與管理' },
  { code: 'BU-MKT', name: '行銷事業部',  description: '負責品牌行銷與市場推廣' },
  { code: 'BU-OPS', name: '營運事業部',  description: '負責供應鏈與日常營運管理' },
  { code: 'BU-RD',  name: '研發事業部',  description: '負責產品研發與技術創新' },
];

const PROJECTS = [
  { businessUnitCode: 'BU-IT',  code: 'PROJ-ERP',   name: 'ERP系統導入',           description: '集團ERP系統全面導入計畫',     startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') },
  { businessUnitCode: 'BU-IT',  code: 'PROJ-WEB',   name: '官方網站改版',          description: '集團官方網站全面改版計畫',     startDate: new Date('2024-03-01'), endDate: new Date('2024-08-31') },
  { businessUnitCode: 'BU-IT',  code: 'PROJ-CLOUD', name: '雲端基礎設施遷移',     description: '將現有系統全面遷移至GCP',     startDate: new Date('2024-06-01'), endDate: null },
  { businessUnitCode: 'BU-FIN', code: 'PROJ-AUDIT', name: '年度財務稽核',         description: '年度內外部稽核計畫',          startDate: new Date('2024-10-01'), endDate: new Date('2024-12-31') },
  { businessUnitCode: 'BU-RD',  code: 'PROJ-AI',    name: 'AI產品研發',           description: '人工智慧應用產品研發計畫',     startDate: new Date('2024-04-01'), endDate: null },
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

// 部門：[公司代碼, 部門代碼, 部門名稱, 父部門代碼(可空)]
const DEPARTMENTS: Array<{ companyCode: string; code: string; name: string; parentCode?: string }> = [
  // TW-HQ
  { companyCode: 'TW-HQ', code: 'IT',    name: '資訊部' },
  { companyCode: 'TW-HQ', code: 'FIN',   name: '財務部' },
  { companyCode: 'TW-HQ', code: 'SALES', name: '業務部' },
  { companyCode: 'TW-HQ', code: 'HR',    name: '人資部' },
  { companyCode: 'TW-HQ', code: 'ADMIN', name: '行政部' },
  { companyCode: 'TW-HQ', code: 'RD',    name: '研發部' },
  { companyCode: 'TW-HQ', code: 'IT-BE', name: '後端開發組', parentCode: 'IT' },
  { companyCode: 'TW-HQ', code: 'IT-FE', name: '前端開發組', parentCode: 'IT' },
  // TW-MFG
  { companyCode: 'TW-MFG', code: 'PROD', name: '生產部' },
  { companyCode: 'TW-MFG', code: 'QC',   name: '品管部' },
  { companyCode: 'TW-MFG', code: 'PUR',  name: '採購部' },
  // HK-CO
  { companyCode: 'HK-CO', code: 'SALES', name: '業務部' },
  { companyCode: 'HK-CO', code: 'FIN',   name: '財務部' },
  // SG-CO
  { companyCode: 'SG-CO', code: 'SALES', name: '業務部' },
  { companyCode: 'SG-CO', code: 'FIN',   name: '財務部' },
];

// 職位：[公司代碼(可空=集團通用), 職位代碼, 職位名稱]
const POSITIONS: Array<{ companyCode?: string; code: string; name: string; description?: string }> = [
  { code: 'SW-ENG',     name: '軟體工程師',      description: '負責系統軟體開發與維護' },
  { code: 'SR-ENG',     name: '資深軟體工程師',   description: '主導技術設計與開發' },
  { code: 'DEPT-MGR',   name: '部門主管',         description: '帶領部門，負責績效與目標' },
  { code: 'HR-SPEC',    name: '人資專員',          description: '執行招募、薪資與員工關係' },
  { code: 'FIN-ANALYST',name: '財務分析師',        description: '財務報告、預算與分析' },
  { code: 'SALES-REP',  name: '業務代表',          description: '開發與維護客戶關係' },
  { code: 'ADMIN-ASST', name: '行政助理',          description: '行政庶務支援' },
  { code: 'QC-ENG',     name: '品管工程師',        description: '負責產品品質管控' },
  { code: 'BUYER',      name: '採購專員',          description: '負責供應商管理與採購執行' },
];

// 員工資料
interface EmployeeSeed {
  employeeNo: string;
  email: string;
  nameZh: string;
  nameEn: string;
  displayName: string;
  companyCode: string;
  deptCode: string;
  positionCode: string;
  jobLevelCode: string;
  roleCode: string;
  hireDate: Date;
  gender: string;
  managerEmployeeNo?: string;
}

const EMPLOYEES: EmployeeSeed[] = [
  // 管理層
  { employeeNo: '10001', email: 'david.wang@oa.com',   nameZh: '王大明', nameEn: 'David Wang',   displayName: '王大明', companyCode: 'TW-HQ', deptCode: 'IT',    positionCode: 'DEPT-MGR',    jobLevelCode: 'L6', roleCode: 'DEPT_MANAGER', hireDate: new Date('2018-03-15'), gender: 'male' },
  { employeeNo: '10002', email: 'lily.zhang@oa.com',   nameZh: '張美玲', nameEn: 'Lily Zhang',   displayName: '張美玲', companyCode: 'TW-HQ', deptCode: 'HR',    positionCode: 'DEPT-MGR',    jobLevelCode: 'L6', roleCode: 'HR_ADMIN',     hireDate: new Date('2017-06-01'), gender: 'female' },
  { employeeNo: '10003', email: 'ken.chen@oa.com',     nameZh: '陳志遠', nameEn: 'Ken Chen',     displayName: '陳志遠', companyCode: 'TW-HQ', deptCode: 'FIN',   positionCode: 'DEPT-MGR',    jobLevelCode: 'L6', roleCode: 'FINANCE_ADMIN', hireDate: new Date('2016-09-20'), gender: 'male' },
  // 資訊部
  { employeeNo: '10004', email: 'jack.huang@oa.com',   nameZh: '黃建國', nameEn: 'Jack Huang',   displayName: '黃建國', companyCode: 'TW-HQ', deptCode: 'IT-BE', positionCode: 'SR-ENG',      jobLevelCode: 'L4', roleCode: 'EMPLOYEE',     hireDate: new Date('2020-02-10'), gender: 'male',   managerEmployeeNo: '10001' },
  { employeeNo: '10005', email: 'amy.liu@oa.com',      nameZh: '劉雅婷', nameEn: 'Amy Liu',      displayName: '劉雅婷', companyCode: 'TW-HQ', deptCode: 'IT-FE', positionCode: 'SW-ENG',      jobLevelCode: 'L3', roleCode: 'EMPLOYEE',     hireDate: new Date('2021-07-05'), gender: 'female', managerEmployeeNo: '10001' },
  { employeeNo: '10006', email: 'yang.wenbo@oa.com',   nameZh: '楊文博', nameEn: 'Wenbo Yang',   displayName: '楊文博', companyCode: 'TW-HQ', deptCode: 'IT-BE', positionCode: 'SW-ENG',      jobLevelCode: 'L2', roleCode: 'EMPLOYEE',     hireDate: new Date('2023-01-16'), gender: 'male',   managerEmployeeNo: '10004' },
  // 人資部
  { employeeNo: '10007', email: 'helen.lin@oa.com',    nameZh: '林佳蓉', nameEn: 'Helen Lin',    displayName: '林佳蓉', companyCode: 'TW-HQ', deptCode: 'HR',    positionCode: 'HR-SPEC',     jobLevelCode: 'L3', roleCode: 'HR_ADMIN',     hireDate: new Date('2019-11-20'), gender: 'female', managerEmployeeNo: '10002' },
  // 財務部
  { employeeNo: '10008', email: 'vivian.cai@oa.com',   nameZh: '蔡秀蘭', nameEn: 'Vivian Cai',   displayName: '蔡秀蘭', companyCode: 'TW-HQ', deptCode: 'FIN',   positionCode: 'FIN-ANALYST', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',     hireDate: new Date('2020-08-03'), gender: 'female', managerEmployeeNo: '10003' },
  // 業務部
  { employeeNo: '10009', email: 'will.wu@oa.com',      nameZh: '吳俊男', nameEn: 'Will Wu',      displayName: '吳俊男', companyCode: 'TW-HQ', deptCode: 'SALES', positionCode: 'SALES-REP',   jobLevelCode: 'L3', roleCode: 'APPROVER',     hireDate: new Date('2019-04-22'), gender: 'male' },
  // 行政部
  { employeeNo: '10010', email: 'grace.zhou@oa.com',   nameZh: '周佩珊', nameEn: 'Grace Zhou',   displayName: '周佩珊', companyCode: 'TW-HQ', deptCode: 'ADMIN', positionCode: 'ADMIN-ASST',  jobLevelCode: 'L2', roleCode: 'EMPLOYEE',     hireDate: new Date('2022-05-09'), gender: 'female' },
  // HK
  { employeeNo: '20001', email: 'peter.lee@oa.com',    nameZh: '李志明', nameEn: 'Peter Lee',    displayName: '李志明', companyCode: 'HK-CO', deptCode: 'SALES', positionCode: 'DEPT-MGR',    jobLevelCode: 'L6', roleCode: 'DEPT_MANAGER', hireDate: new Date('2019-01-07'), gender: 'male' },
  // SG
  { employeeNo: '30001', email: 'sarah.tan@oa.com',    nameZh: '陳小慧', nameEn: 'Sarah Tan',    displayName: '陳小慧', companyCode: 'SG-CO', deptCode: 'FIN',   positionCode: 'FIN-ANALYST', jobLevelCode: 'L3', roleCode: 'EMPLOYEE',     hireDate: new Date('2021-03-14'), gender: 'female' },
];

// ── 假別定義 ──────────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  {
    code: 'ANNUAL',
    name: '年假',
    description: '員工年度特休假',
    requiresApproval: true,
    isPaid: true,
    isAnnual: true,
    allowCarryOver: true,
    carryOverLimitDays: 5,
    allowNegativeBalance: false,
  },
  {
    code: 'PERSONAL',
    name: '事假',
    description: '個人事務請假',
    requiresApproval: true,
    isPaid: false,
    isAnnual: false,
    allowCarryOver: false,
    allowNegativeBalance: false,
  },
  {
    code: 'SICK',
    name: '病假',
    description: '因病請假',
    requiresApproval: true,
    isPaid: true,
    isAnnual: false,
    allowCarryOver: false,
    allowNegativeBalance: false,
  },
  {
    code: 'MARRIAGE',
    name: '婚假',
    description: '本人結婚請假，8天',
    requiresApproval: true,
    isPaid: true,
    isAnnual: false,
    allowCarryOver: false,
    allowNegativeBalance: false,
  },
  {
    code: 'BEREAVEMENT',
    name: '喪假',
    description: '直系親屬喪亡請假',
    requiresApproval: true,
    isPaid: true,
    isAnnual: false,
    allowCarryOver: false,
    allowNegativeBalance: false,
  },
  {
    code: 'MATERNITY',
    name: '產假',
    description: '女性員工生產請假，56天',
    requiresApproval: true,
    isPaid: true,
    isAnnual: false,
    allowCarryOver: false,
    allowNegativeBalance: false,
  },
  {
    code: 'PATERNITY',
    name: '陪產假',
    description: '男性員工配偶生產請假，5天',
    requiresApproval: true,
    isPaid: true,
    isAnnual: false,
    allowCarryOver: false,
    allowNegativeBalance: false,
  },
  {
    code: 'OFFICIAL',
    name: '公假',
    description: '公務或受召請假',
    requiresApproval: true,
    isPaid: true,
    isAnnual: false,
    allowCarryOver: false,
    allowNegativeBalance: false,
  },
];

// ── 主函式 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 開始植入種子資料...\n');

  // 1. 權限與角色
  console.log('📋 建立權限與角色...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code: p.code }, create: p, update: { name: p.name, module: p.module } });
  }
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { code: r.code }, create: r, update: {} });
  }
  console.log(`   ✓ ${PERMISSIONS.length} 個權限、${ROLES.length} 個角色\n`);

  // 1b. 假別
  console.log('📅 建立假別...');
  for (const lt of LEAVE_TYPES) {
    await prisma.leaveType.upsert({ where: { code: lt.code }, create: lt as any, update: { name: lt.name, description: lt.description } });
  }
  console.log(`   ✓ ${LEAVE_TYPES.length} 個假別\n`);

  // 2. 地區
  console.log('🌏 建立地區...');
  for (const r of REGIONS) {
    await prisma.region.upsert({ where: { code: r.code }, create: r, update: { name: r.name } });
  }
  console.log(`   ✓ ${REGIONS.length} 個地區\n`);

  // 3. 公司
  console.log('🏢 建立公司...');
  for (const c of COMPANIES) {
    const region = await prisma.region.findUniqueOrThrow({ where: { code: c.regionCode } });
    await prisma.company.upsert({
      where: { code: c.code },
      create: { regionId: region.id, code: c.code, name: c.name, legalName: c.legalName, currencyCode: c.currencyCode },
      update: { name: c.name },
    });
  }
  console.log(`   ✓ ${COMPANIES.length} 間公司\n`);

  // 4. 事業部
  console.log('🏭 建立事業部...');
  for (const bu of BUSINESS_UNITS) {
    await prisma.businessUnit.upsert({ where: { code: bu.code }, create: bu, update: { name: bu.name } });
  }
  console.log(`   ✓ ${BUSINESS_UNITS.length} 個事業部\n`);

  // 5. 職級
  console.log('📊 建立職級...');
  for (const jl of JOB_LEVELS) {
    await prisma.jobLevel.upsert({ where: { code: jl.code }, create: jl, update: { name: jl.name, levelOrder: jl.levelOrder } });
  }
  console.log(`   ✓ ${JOB_LEVELS.length} 個職級\n`);

  // 6. 項目
  console.log('📁 建立項目...');
  for (const p of PROJECTS) {
    const bu = p.businessUnitCode ? await prisma.businessUnit.findUnique({ where: { code: p.businessUnitCode } }) : null;
    await prisma.project.upsert({
      where: { code: p.code },
      create: { code: p.code, name: p.name, description: p.description, businessUnitId: bu?.id, startDate: p.startDate, endDate: p.endDate },
      update: { name: p.name },
    });
  }
  console.log(`   ✓ ${PROJECTS.length} 個項目\n`);

  // 7. 部門（先建頂層，再建子部門）
  console.log('🏬 建立部門...');
  const companyMap = new Map<string, string>(); // code → id
  for (const c of COMPANIES) {
    const found = await prisma.company.findUnique({ where: { code: c.code } });
    if (found) companyMap.set(c.code, found.id);
  }

  const deptMap = new Map<string, string>(); // `${companyCode}:${code}` → id

  // 先建沒有父部門的
  for (const d of DEPARTMENTS.filter((x) => !x.parentCode)) {
    const companyId = companyMap.get(d.companyCode)!;
    const existing = await prisma.department.findFirst({ where: { companyId, code: d.code } });
    if (!existing) {
      const created = await prisma.department.create({ data: { companyId, code: d.code, name: d.name } });
      deptMap.set(`${d.companyCode}:${d.code}`, created.id);
    } else {
      deptMap.set(`${d.companyCode}:${d.code}`, existing.id);
    }
  }
  // 再建有父部門的
  for (const d of DEPARTMENTS.filter((x) => x.parentCode)) {
    const companyId = companyMap.get(d.companyCode)!;
    const parentId = deptMap.get(`${d.companyCode}:${d.parentCode}`)!;
    const existing = await prisma.department.findFirst({ where: { companyId, code: d.code } });
    if (!existing) {
      const created = await prisma.department.create({ data: { companyId, code: d.code, name: d.name, parentDepartmentId: parentId } });
      deptMap.set(`${d.companyCode}:${d.code}`, created.id);
    } else {
      deptMap.set(`${d.companyCode}:${d.code}`, existing.id);
    }
  }
  console.log(`   ✓ ${DEPARTMENTS.length} 個部門\n`);

  // 8. 職位
  console.log('💼 建立職位...');
  for (const pos of POSITIONS) {
    const companyId = pos.companyCode ? companyMap.get(pos.companyCode) : undefined;
    const existing = await prisma.position.findFirst({ where: { companyId: companyId ?? null, code: pos.code } });
    if (!existing) {
      await prisma.position.create({ data: { companyId, code: pos.code, name: pos.name, description: pos.description } });
    }
  }
  console.log(`   ✓ ${POSITIONS.length} 個職位\n`);

  // 9. 更新 admin 帳號工號
  console.log('👑 更新超級管理員帳號...');
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin' } });
  if (adminUser) {
    await prisma.user.update({ where: { id: adminUser.id }, data: { employeeNo: '00001', displayName: '系統管理員', nameZh: '系統管理員', nameEn: 'System Admin' } });
    // 指派 SUPER_ADMIN 角色
    const superAdminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
    if (superAdminRole) {
      const exists = await prisma.userRole.findFirst({ where: { userId: adminUser.id, roleId: superAdminRole.id } });
      if (!exists) {
        await prisma.userRole.create({ data: { userId: adminUser.id, roleId: superAdminRole.id } });
      }
    }
    console.log('   ✓ admin (00001) 工號已設定、SUPER_ADMIN 角色已指派\n');
  } else {
    console.log('   ⚠ 未找到 admin 帳號，請先執行 bootstrap 或手動建立\n');
  }

  // 10. 建立員工帳號與組織歸屬
  console.log('👥 建立員工帳號...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const jobLevelMap = new Map<string, string>(); // code → id
  for (const jl of JOB_LEVELS) {
    const found = await prisma.jobLevel.findUnique({ where: { code: jl.code } });
    if (found) jobLevelMap.set(jl.code, found.id);
  }
  const positionMap = new Map<string, string>(); // code → id (global positions)
  for (const pos of POSITIONS) {
    const found = await prisma.position.findFirst({ where: { companyId: null, code: pos.code } });
    if (found) positionMap.set(pos.code, found.id);
  }

  const userMap = new Map<string, string>(); // employeeNo → id

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
          regularDate: new Date(emp.hireDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 試用期3個月後轉正
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

  // 11. 建立組織歸屬（需要 user map 完整後才能設定直屬主管）
  console.log('🔗 建立員工組織歸屬...');
  for (const emp of EMPLOYEES) {
    const userId = userMap.get(emp.employeeNo)!;
    const companyId = companyMap.get(emp.companyCode)!;
    const departmentId = deptMap.get(`${emp.companyCode}:${emp.deptCode}`)!;
    const positionId = positionMap.get(emp.positionCode);
    const jobLevelId = jobLevelMap.get(emp.jobLevelCode);
    const directManagerUserId = emp.managerEmployeeNo ? userMap.get(emp.managerEmployeeNo) : undefined;

    const existsOrg = await prisma.userOrgAssignment.findFirst({ where: { userId, isPrimary: true } });
    if (!existsOrg) {
      await prisma.userOrgAssignment.create({
        data: {
          userId,
          companyId,
          departmentId,
          positionId,
          jobLevelId,
          directManagerUserId,
          isPrimary: true,
          startedAt: emp.hireDate,
        },
      });
    }
  }
  console.log(`   ✓ 組織歸屬完成\n`);

  console.log('✅ 種子資料植入完成！');
  console.log('\n📌 登入資訊：');
  console.log('   帳號    | 密碼');
  console.log('   --------|----------');
  console.log(`   00001   | ${DEFAULT_PASSWORD}  (系統管理員)`);
  console.log(`   10001   | ${DEFAULT_PASSWORD}  (王大明 - IT部門主管)`);
  console.log(`   10002   | ${DEFAULT_PASSWORD}  (張美玲 - HR管理員)`);
  console.log(`   10003   | ${DEFAULT_PASSWORD}  (陳志遠 - 財務管理員)`);
  console.log(`   ...所有員工密碼均為 ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => { console.error('❌ 種子資料植入失敗：', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
