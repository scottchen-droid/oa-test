import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateRoleDto {
  code: string;
  name: string;
  description?: string;
}

export class AssignPermissionsDto {
  permissionIds: string[];
}

export class AssignRoleDto {
  roleId: string;
  scopeType?: string;
  scopeId?: string;
}

const ADMIN_CODE = 'ADMIN';

const DEFAULT_PERMISSIONS = [
  // 模塊入口
  { code: 'module.hr.access',             name: '進入人事模塊',           module: 'module' },
  { code: 'module.finance.access',         name: '進入財務模塊',           module: 'module' },
  { code: 'module.administration.access',  name: '進入行政模塊',           module: 'module' },
  { code: 'module.system.access',          name: '進入系統模塊',           module: 'module' },
  { code: 'module.home.access',            name: '進入首頁',               module: 'module' },
  { code: 'module.home_manager.access',    name: '主管功能入口',           module: 'module' },
  // 首頁個人功能
  { code: 'home.personal.notification.view',  name: '查看個人通知',         module: 'home' },
  { code: 'home.personal.payslip.view_self',  name: '查看自己的薪資單',     module: 'home' },
  { code: 'home.attendance.record.view_self', name: '查看自己的打卡記錄',   module: 'home' },
  { code: 'home.attendance.leave.apply',      name: '申請請假',             module: 'home' },
  { code: 'home.attendance.overtime.apply',   name: '申請加班',             module: 'home' },
  { code: 'home.attendance.exception.apply',  name: '申請異常打卡補正',     module: 'home' },
  { code: 'home.forms.purchase.create',       name: '建立採購申請單',       module: 'home' },
  { code: 'home.forms.reimbursement.create',  name: '建立費用報銷單',       module: 'home' },
  // 主管功能
  { code: 'home.manager.leave.approve',       name: '主管：審核請假申請',   module: 'home' },
  { code: 'home.manager.clock_patch.approve', name: '主管：審核補打卡申請', module: 'home' },
  { code: 'home.manager.overtime.approve',    name: '主管：審核加班申請',   module: 'home' },
  { code: 'home.manager.form.approve',        name: '主管：審核表單申請',   module: 'home' },
  // 人事模塊
  { code: 'hr.employee.view',       name: '查看員工資料',         module: 'hr' },
  { code: 'hr.employee.create',     name: '新增員工',             module: 'hr' },
  { code: 'hr.employee.edit',       name: '編輯員工',             module: 'hr' },
  { code: 'hr.employee.delete',     name: '刪除員工',             module: 'hr' },
  { code: 'hr.attendance.view_all', name: '查看所有打卡記錄',     module: 'hr' },
  { code: 'hr.attendance.edit',     name: '編輯出勤記錄',         module: 'hr' },
  { code: 'hr.leave.manage',        name: '管理假勤（假別/餘額）', module: 'hr' },
  { code: 'hr.payroll.manage',      name: '管理薪資',             module: 'hr' },
  { code: 'hr.performance.manage',  name: '管理績效考核',         module: 'hr' },
  // 財務模塊
  { code: 'finance.purchase.view_all',       name: '查看所有採購申請',   module: 'finance' },
  { code: 'finance.purchase.manage',          name: '管理採購申請',       module: 'finance' },
  { code: 'finance.reimbursement.review',     name: '審核費用報銷',       module: 'finance' },
  { code: 'finance.payment.confirm',          name: '確認付款',           module: 'finance' },
  { code: 'finance.report.view',              name: '查看財務報表',       module: 'finance' },
  // 行政模塊
  { code: 'administration.announcement.manage', name: '管理公告',         module: 'administration' },
  { code: 'administration.asset.manage',         name: '管理資產',         module: 'administration' },
  { code: 'administration.visitor.manage',       name: '管理訪客',         module: 'administration' },
  { code: 'administration.meeting_room.manage',  name: '管理會議室',       module: 'administration' },
  // 系統模塊
  { code: 'system.user.manage',      name: '管理帳號',             module: 'system' },
  { code: 'system.role.manage',      name: '管理角色與權限',       module: 'system' },
  { code: 'system.org.manage',       name: '管理組織架構',         module: 'system' },
  { code: 'system.workflow.manage',  name: '管理審批流',           module: 'system' },
  { code: 'system.audit_log.view',   name: '查看稽核日誌',         module: 'system' },
];

const DEFAULT_ROLES = [
  { code: ADMIN_CODE,       name: '系統管理員', description: '具備所有功能的管理角色，由角色權限控管',  isSystem: true },
  { code: 'HR_ADMIN',       name: 'HR管理員',   description: '管理員工、薪資與假勤政策',              isSystem: true },
  { code: 'FINANCE_ADMIN',  name: '財務管理員', description: '管理採購申請與費用報銷',                isSystem: true },
  { code: 'DEPT_MANAGER',   name: '部門主管',   description: '審核部門內的假勤與採購申請',            isSystem: true },
  { code: 'APPROVER',       name: '審核人員',   description: '可審核各類申請',                       isSystem: true },
  { code: 'EMPLOYEE',       name: '一般員工',   description: 'OA基本功能',                          isSystem: true },
  { code: 'AUDITOR',        name: '稽核人員',   description: '唯讀存取所有財務文件',                  isSystem: true },
];

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedDefaultRolesAndPermissions();
    } catch {
      // Non-fatal — DB may not be ready yet during cold start
    }
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  }

  async findAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });

    const grouped: Record<string, typeof permissions> = {};
    for (const p of permissions) {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    }
    return grouped;
  }

  async createRole(dto: CreateRoleDto, operatorId: string) {
    const existing = await this.prisma.role.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Role code already exists');

    const role = await this.prisma.role.create({ data: dto });

    await this.prisma.systemAuditLog.create({
      data: { operatorUserId: operatorId, action: 'role.create', targetType: 'role', targetId: role.id, newData: dto as any },
    });

    return role;
  }

  async updateRole(id: string, dto: Partial<CreateRoleDto>, operatorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ConflictException('Cannot modify system roles');

    const updated = await this.prisma.role.update({ where: { id }, data: dto });

    await this.prisma.systemAuditLog.create({
      data: { operatorUserId: operatorId, action: 'role.update', targetType: 'role', targetId: id, oldData: role as any, newData: dto as any },
    });

    return updated;
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[], operatorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }

    await this.prisma.systemAuditLog.create({
      data: { operatorUserId: operatorId, action: 'role.permissions_updated', targetType: 'role', targetId: roleId, newData: { permissionIds } as any },
    });

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async assignRoleToUser(userId: string, dto: AssignRoleDto, operatorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId: dto.roleId, scopeType: dto.scopeType ?? null, scopeId: dto.scopeId ?? null },
    });

    const userRole = existing
      ? await this.prisma.userRole.update({ where: { id: existing.id }, data: { grantedBy: operatorId } })
      : await this.prisma.userRole.create({
          data: { userId, roleId: dto.roleId, scopeType: dto.scopeType, scopeId: dto.scopeId, grantedBy: operatorId },
        });

    await this.prisma.systemAuditLog.create({
      data: { operatorUserId: operatorId, action: 'role.assign', targetType: 'user', targetId: userId, newData: { roleId: dto.roleId, scopeType: dto.scopeType } as any },
    });

    return userRole;
  }

  async revokeRoleFromUser(userId: string, roleId: string, operatorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });

    await this.prisma.systemAuditLog.create({
      data: { operatorUserId: operatorId, action: 'role.revoke', targetType: 'user', targetId: userId, newData: { roleId } as any },
    });
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isSuperAdmin: true,
        userRoles: {
          select: { role: { select: { rolePermissions: { select: { permission: { select: { code: true } } } } } } },
        },
      },
    });

    if (!user) return [];

    const codes = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        codes.add(rp.permission.code);
      }
    }
    return Array.from(codes);
  }

  async seedDefaultRolesAndPermissions() {
    for (const perm of DEFAULT_PERMISSIONS) {
      await this.prisma.permission.upsert({ where: { code: perm.code }, create: perm, update: { name: perm.name, module: perm.module } });
    }

    for (const role of DEFAULT_ROLES) {
      await this.prisma.role.upsert({ where: { code: role.code }, create: role, update: {} });
    }

    // ADMIN 角色自動擁有所有權限
    const adminRole = await this.prisma.role.findUnique({ where: { code: ADMIN_CODE } });
    const allPerms = await this.prisma.permission.findMany({ select: { id: true } });
    if (adminRole && allPerms.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: allPerms.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }

    return { message: 'Default roles and permissions seeded', roles: DEFAULT_ROLES.length, permissions: DEFAULT_PERMISSIONS.length };
  }
}
