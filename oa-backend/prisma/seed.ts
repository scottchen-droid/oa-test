/**
 * seed.ts — 系統初始化資料
 *
 * 僅包含系統運作所需的最小設定：
 *   - 權限定義（permissions）
 *   - 角色定義（roles）+ 角色權限指派
 *   - 假別定義（leave_types）
 *   - 職級定義（job_levels）
 *   - 審批模板（approval_templates + steps）
 *   - 管理員帳號 00001
 *
 * 不包含任何業務測試資料（地區、公司、員工、薪資等）。
 * Usage: npm run db:init  或  npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '!Aa123456';

// ══════════════════════════════════════════════════════
// 1. 權限定義
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

// ══════════════════════════════════════════════════════
// 2. 角色定義
// ══════════════════════════════════════════════════════

const ROLES = [
  { code: 'ADMIN',         name: '系統管理員',  description: '持有全部權限的系統管理角色',       isSystem: true },
  { code: 'HR_ADMIN',      name: 'HR管理員',    description: '管理員工、薪資與假勤政策',         isSystem: true },
  { code: 'FINANCE_ADMIN', name: '財務管理員',  description: '管理採購申請與費用報銷',           isSystem: true },
  { code: 'DEPT_MANAGER',  name: '部門主管',    description: '審核部門內的假勤與採購申請',       isSystem: true },
  { code: 'APPROVER',      name: '審核人員',    description: '可審核各類申請',                  isSystem: true },
  { code: 'EMPLOYEE',      name: '一般員工',    description: 'OA 基本功能',                   isSystem: true },
  { code: 'AUDITOR',       name: '稽核人員',    description: '唯讀存取所有財務文件',             isSystem: true },
];

// ══════════════════════════════════════════════════════
// 3. 假別定義
// ══════════════════════════════════════════════════════

const LEAVE_TYPES = [
  { code: 'ANNUAL',      name: '年假',   description: '員工年度特休假',       requiresApproval: true,  isPaid: true,  isAnnual: true,  allowCarryOver: true,  carryOverLimitDays: 5,  allowNegativeBalance: false },
  { code: 'PERSONAL',    name: '事假',   description: '個人事務請假',         requiresApproval: true,  isPaid: false, isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'SICK',        name: '病假',   description: '因病請假',             requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'MARRIAGE',    name: '婚假',   description: '本人結婚請假',          requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'BEREAVEMENT', name: '喪假',   description: '直系親屬喪亡請假',      requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'MATERNITY',   name: '產假',   description: '女性員工生產請假',      requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'PATERNITY',   name: '陪產假', description: '男性員工配偶生產請假', requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
  { code: 'OFFICIAL',    name: '公假',   description: '公務或受召請假',        requiresApproval: true,  isPaid: true,  isAnnual: false, allowCarryOver: false, allowNegativeBalance: false },
];

// ══════════════════════════════════════════════════════
// 4. 職級定義（P/M 雙軌制）
//    P1~P16：一般員工（levelOrder 1~16）
//    M1~M7 ：管理崗（levelOrder 101~107，高於所有 P 等）
//    注意：舊版 L1~L7 已移除，改用 P/M 制，由 migrations/006_org_structure_data.sql 初始化
// ══════════════════════════════════════════════════════

const JOB_LEVELS: Array<{ code: string; name: string; levelOrder: number; description: string }> = [
  // P 等：一般員工
  { code: 'P1',  name: 'P1',  levelOrder: 1,   description: '一般員工職級' },
  { code: 'P2',  name: 'P2',  levelOrder: 2,   description: '一般員工職級' },
  { code: 'P3',  name: 'P3',  levelOrder: 3,   description: '一般員工職級' },
  { code: 'P4',  name: 'P4',  levelOrder: 4,   description: '一般員工職級' },
  { code: 'P5',  name: 'P5',  levelOrder: 5,   description: '一般員工職級' },
  { code: 'P6',  name: 'P6',  levelOrder: 6,   description: '一般員工職級' },
  { code: 'P7',  name: 'P7',  levelOrder: 7,   description: '一般員工職級' },
  { code: 'P8',  name: 'P8',  levelOrder: 8,   description: '一般員工職級' },
  { code: 'P9',  name: 'P9',  levelOrder: 9,   description: '一般員工職級' },
  { code: 'P10', name: 'P10', levelOrder: 10,  description: '一般員工職級' },
  { code: 'P11', name: 'P11', levelOrder: 11,  description: '一般員工職級' },
  { code: 'P12', name: 'P12', levelOrder: 12,  description: '一般員工職級' },
  { code: 'P13', name: 'P13', levelOrder: 13,  description: '一般員工職級' },
  { code: 'P14', name: 'P14', levelOrder: 14,  description: '一般員工職級' },
  { code: 'P15', name: 'P15', levelOrder: 15,  description: '一般員工職級' },
  { code: 'P16', name: 'P16', levelOrder: 16,  description: '一般員工職級' },
  // M 等：管理崗
  { code: 'M1',  name: 'M1',  levelOrder: 101, description: '管理崗職級' },
  { code: 'M2',  name: 'M2',  levelOrder: 102, description: '管理崗職級' },
  { code: 'M3',  name: 'M3',  levelOrder: 103, description: '管理崗職級' },
  { code: 'M4',  name: 'M4',  levelOrder: 104, description: '管理崗職級' },
  { code: 'M5',  name: 'M5',  levelOrder: 105, description: '管理崗職級' },
  { code: 'M6',  name: 'M6',  levelOrder: 106, description: '管理崗職級' },
  { code: 'M7',  name: 'M7',  levelOrder: 107, description: '管理崗職級' },
];

// ══════════════════════════════════════════════════════
// 5. 審批模板（標準三步驟流程）
// ══════════════════════════════════════════════════════

interface TemplateStepDef {
  stepOrder: number;
  stepName: string;
  approverType: string;
  approvalMode: string;
  scopeConfig?: Record<string, string>;
}

interface TemplateDef {
  code: string;
  name: string;
  formType: string;
  approvalRouteType: string;
  steps: TemplateStepDef[];
}

const PROJECT_LEAD = { approverType: 'lead',    scopeConfig: { groupType: 'project',       groupResolution: 'applicant_project' } };
const BU_LEAD      = { approverType: 'lead',    scopeConfig: { groupType: 'business_unit', groupResolution: 'applicant_bu' } };
const CO_HR        = { approverType: 'hr',      scopeConfig: { groupType: 'company',       groupResolution: 'applicant_company' } };
const CO_FINANCE   = { approverType: 'finance', scopeConfig: { groupType: 'company',       groupResolution: 'applicant_company' } };

const APPROVAL_TEMPLATES: TemplateDef[] = [
  {
    code: 'TPL-LEAVE',     name: '請假申請審批流',      formType: 'leave_request',         approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-OT',        name: '加班申請審批流',      formType: 'overtime_request',       approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-CLOCK',     name: '補卡申請審批流',      formType: 'clock_patch_request',    approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-PURCHASE',  name: '採購申請審批流',      formType: 'purchase_request',       approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-REIMBURSE', name: '費用報銷審批流',      formType: 'reimbursement_request',  approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-TRIP',      name: '出差申請審批流',      formType: 'business_trip',          approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-ASSET',     name: 'OA 資產申請審批流',  formType: 'asset_request',          approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-MEAL',      name: '誤餐費申請審批流',    formType: 'meal_allowance',         approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-IT',        name: '資訊需求申請審批流',  formType: 'it_request',             approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-HEADCOUNT', name: '人力需求申請審批流',  formType: 'headcount_request',      approvalRouteType: 'group_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管審核',   approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管審核',   approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '項目負責人確認', ...PROJECT_LEAD,                           approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-RESIGN',    name: '離職申請審批流',      formType: 'resignation',            approvalRouteType: 'mixed',
    steps: [
      { stepOrder: 1, stepName: '直屬主管確認',    approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管確認',    approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '事業部負責人確認', ...BU_LEAD,                               approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-LWP',       name: '留職停薪申請審批流',  formType: 'leave_without_pay',      approvalRouteType: 'mixed',
    steps: [
      { stepOrder: 1, stepName: '直屬主管確認',    approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '部門主管確認',    approverType: 'department_manager',       approvalMode: 'any' },
      { stepOrder: 3, stepName: '事業部負責人確認', ...BU_LEAD,                               approvalMode: 'any' },
    ],
  },
  {
    code: 'TPL-PAYROLL',   name: '薪資申請審批流',      formType: 'payroll_request',        approvalRouteType: 'office_org',
    steps: [
      { stepOrder: 1, stepName: '直屬主管確認', approverType: 'applicant_direct_manager', approvalMode: 'any' },
      { stepOrder: 2, stepName: '公司人事審核', ...CO_HR,                                  approvalMode: 'any' },
      { stepOrder: 3, stepName: '公司財務確認', ...CO_FINANCE,                             approvalMode: 'any' },
    ],
  },
];

// ══════════════════════════════════════════════════════
// 主函式
// ══════════════════════════════════════════════════════

async function main() {
  console.log('🌱 系統初始化開始...\n');

  // ── 1. 權限 ────────────────────────────────────────────────
  console.log('📋 建立權限...');
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: { name: p.name, module: p.module },
    });
  }
  console.log(`   ✓ ${PERMISSIONS.length} 個權限\n`);

  // ── 2. 角色 ────────────────────────────────────────────────
  console.log('🎭 建立角色...');
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { code: r.code }, create: r, update: {} });
  }
  // ADMIN 角色取得全部權限
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const allPerms  = await prisma.permission.findMany({ select: { id: true } });
  if (adminRole) {
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${ROLES.length} 個角色（ADMIN 已取得全部 ${allPerms.length} 個權限）\n`);

  // ── 3. 假別 ────────────────────────────────────────────────
  console.log('📅 建立假別...');
  for (const lt of LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      create: lt as any,
      update: { name: lt.name },
    });
  }
  console.log(`   ✓ ${LEAVE_TYPES.length} 個假別\n`);

  // ── 4. 職級 ────────────────────────────────────────────────
  console.log('📊 建立職級...');
  for (const jl of JOB_LEVELS) {
    await prisma.jobLevel.upsert({
      where: { code: jl.code },
      create: jl,
      update: { name: jl.name, levelOrder: jl.levelOrder },
    });
  }
  console.log(`   ✓ ${JOB_LEVELS.length} 個職級\n`);

  // ── 5. 審批模板 ────────────────────────────────────────────
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
    } else {
      await prisma.approvalTemplate.update({
        where: { id: template.id },
        data: { name: tpl.name, approvalRouteType: tpl.approvalRouteType },
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
            scopeConfig: step.scopeConfig ?? undefined,
          },
        });
      }
    }
  }
  console.log(`   ✓ ${APPROVAL_TEMPLATES.length} 個審批模板\n`);

  // ── 6. 管理員帳號 00001 ─────────────────────────────────────
  console.log('🔑 建立管理員帳號 00001...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  let adminUser = await prisma.user.findFirst({
    where: { OR: [{ employeeNo: '00001' }, { email: 'admin@oa.com' }] },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        employeeNo: '00001',
        email: 'admin@oa.com',
        displayName: '系統管理員',
        nameZh: '系統管理員',
        nameEn: 'System Admin',
        passwordHash,
        status: 'active',
        passwordChangedAt: new Date(),
      },
    });
    console.log('   ✓ 帳號已建立');
  } else {
    console.log('   ✓ 帳號已存在，跳過建立');
  }

  // 確保 00001 持有 ADMIN 角色
  if (adminRole) {
    const existsRole = await prisma.userRole.findFirst({
      where: { userId: adminUser.id, roleId: adminRole.id },
    });
    if (!existsRole) {
      await prisma.userRole.create({
        data: { userId: adminUser.id, roleId: adminRole.id },
      });
      console.log('   ✓ ADMIN 角色已指派');
    }
  }

  console.log('\n✅ 系統初始化完成！');
  console.log('\n📌 管理員登入資訊');
  console.log('   工號：00001');
  console.log('   Email：admin@oa.com');
  console.log(`   密碼：${ADMIN_PASSWORD}`);
  console.log('\n⚠️  請在首次登入後立即修改密碼！');
  console.log('\n📋 接下來需要手動設定：');
  console.log('   1. 地區與公司（系統管理 → 組織架構）');
  console.log('   2. 事業部與項目');
  console.log('   3. 部門');
  console.log('   4. 職位');
  console.log('   5. 員工帳號與組織歸屬');
}

main()
  .catch((e) => { console.error('❌ 初始化失敗：', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
