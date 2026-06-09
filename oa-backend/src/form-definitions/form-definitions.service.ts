import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateFormDefinitionDto {
  formType: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  isEnabled?: boolean;
  allowDraft?: boolean;
  allowFillTemplate?: boolean;
  allowCopyHistory?: boolean;
  sortOrder?: number;
}

export type UpdateFormDefinitionDto = Partial<CreateFormDefinitionDto>;

export interface PermissionRule {
  targetType: string;
  targetId?: string;
}

@Injectable()
export class FormDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 員工端：依使用者權限篩選可見表單定義
   */
  async getAccessibleDefinitions(userId: string) {
    // 取得使用者的 org assignments（companyId, departmentId 列表）
    const orgAssignments = await this.prisma.userOrgAssignment.findMany({
      where: { userId, isActive: true },
      select: { companyId: true, departmentId: true },
    });

    const companyIds = orgAssignments
      .map((a) => a.companyId)
      .filter((id): id is string => id !== null);

    const departmentIds = orgAssignments
      .map((a) => a.departmentId)
      .filter((id): id is string => id !== null);

    // 取得使用者的 roleIds
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map((r) => r.roleId);

    // 取得所有啟用的表單定義（含 permissions）
    const definitions = await this.prisma.oaFormDefinition.findMany({
      where: { isEnabled: true },
      include: { permissions: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    // 過濾出使用者有權限查看的表單
    return definitions.filter((def) => {
      const perms = def.permissions;

      // 沒有任何 permission 設定 → 相容舊資料，開放給所有人
      if (perms.length === 0) return true;

      return perms.some((p) => {
        if (p.targetType === 'all') return true;
        if (p.targetType === 'company' && p.targetId && companyIds.includes(p.targetId)) return true;
        if (p.targetType === 'department' && p.targetId && departmentIds.includes(p.targetId)) return true;
        if (p.targetType === 'role' && p.targetId && roleIds.includes(p.targetId)) return true;
        if (p.targetType === 'user' && p.targetId === userId) return true;
        return false;
      });
    });
  }

  /**
   * 管理端：取得所有表單定義（無篩選）
   */
  async findAll(params?: { category?: string; isEnabled?: boolean }) {
    const where: Record<string, unknown> = {};
    if (params?.category !== undefined) where['category'] = params.category;
    if (params?.isEnabled !== undefined) where['isEnabled'] = params.isEnabled;

    return this.prisma.oaFormDefinition.findMany({
      where,
      include: { permissions: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  /**
   * 管理端：建立新表單定義
   */
  async create(dto: CreateFormDefinitionDto) {
    return this.prisma.oaFormDefinition.create({
      data: {
        formType: dto.formType,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        icon: dto.icon,
        iconColor: dto.iconColor,
        isEnabled: dto.isEnabled ?? true,
        allowDraft: dto.allowDraft ?? true,
        allowFillTemplate: dto.allowFillTemplate ?? true,
        allowCopyHistory: dto.allowCopyHistory ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: { permissions: true },
    });
  }

  /**
   * 管理端：更新表單定義
   */
  async update(id: string, dto: UpdateFormDefinitionDto) {
    await this.ensureExists(id);

    return this.prisma.oaFormDefinition.update({
      where: { id },
      data: {
        ...(dto.formType !== undefined && { formType: dto.formType }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.iconColor !== undefined && { iconColor: dto.iconColor }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.allowDraft !== undefined && { allowDraft: dto.allowDraft }),
        ...(dto.allowFillTemplate !== undefined && { allowFillTemplate: dto.allowFillTemplate }),
        ...(dto.allowCopyHistory !== undefined && { allowCopyHistory: dto.allowCopyHistory }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: { permissions: true },
    });
  }

  /**
   * 管理端：替換某表單的所有 permissions（先 deleteMany 再 createMany）
   */
  async setPermissions(id: string, rules: PermissionRule[]) {
    await this.ensureExists(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.oaFormPermission.deleteMany({
        where: { formDefinitionId: id },
      });

      if (rules.length > 0) {
        await tx.oaFormPermission.createMany({
          data: rules.map((r) => ({
            formDefinitionId: id,
            targetType: r.targetType,
            targetId: r.targetId ?? null,
          })),
        });
      }

      return tx.oaFormPermission.findMany({
        where: { formDefinitionId: id },
      });
    });
  }

  /**
   * 管理端：取得某表單的 permissions，附帶 targetName
   */
  async getPermissions(id: string) {
    await this.ensureExists(id);

    const permissions = await this.prisma.oaFormPermission.findMany({
      where: { formDefinitionId: id },
    });

    // 批次查詢所有需要解析名稱的 targetId
    const companyIds = permissions.filter((p) => p.targetType === 'company' && p.targetId).map((p) => p.targetId as string);
    const departmentIds = permissions.filter((p) => p.targetType === 'department' && p.targetId).map((p) => p.targetId as string);
    const roleIds = permissions.filter((p) => p.targetType === 'role' && p.targetId).map((p) => p.targetId as string);
    const userIds = permissions.filter((p) => p.targetType === 'user' && p.targetId).map((p) => p.targetId as string);

    const [companies, departments, roles, users] = await Promise.all([
      companyIds.length > 0
        ? this.prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } })
        : [],
      departmentIds.length > 0
        ? this.prisma.department.findMany({ where: { id: { in: departmentIds } }, select: { id: true, name: true } })
        : [],
      roleIds.length > 0
        ? this.prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } })
        : [],
      userIds.length > 0
        ? this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true, email: true } })
        : [],
    ]);

    const companyMap = new Map<string, string>(companies.map((c) => [c.id, c.name] as [string, string]));
    const departmentMap = new Map<string, string>(departments.map((d) => [d.id, d.name] as [string, string]));
    const roleMap = new Map<string, string>(roles.map((r) => [r.id, r.name] as [string, string]));
    const userMap = new Map<string, string>(users.map((u) => [u.id, u.displayName ?? u.email] as [string, string]));

    return permissions.map((p) => {
      let targetName: string | null = null;

      if (p.targetId) {
        switch (p.targetType) {
          case 'company':
            targetName = companyMap.get(p.targetId) ?? null;
            break;
          case 'department':
            targetName = departmentMap.get(p.targetId) ?? null;
            break;
          case 'role':
            targetName = roleMap.get(p.targetId) ?? null;
            break;
          case 'user':
            targetName = userMap.get(p.targetId) ?? null;
            break;
        }
      }

      return { ...p, targetName };
    });
  }

  private async ensureExists(id: string) {
    const def = await this.prisma.oaFormDefinition.findUnique({ where: { id } });
    if (!def) throw new NotFoundException(`表單定義不存在: ${id}`);
    return def;
  }
}
