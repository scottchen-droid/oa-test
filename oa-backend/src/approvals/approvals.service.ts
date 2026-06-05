import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPending(params: { userId: string; formType?: string; page?: number; limit?: number }) {
    const { userId, formType, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Find approval instances where this user is an approver with pending status
    const instanceWhere: any = {
      status: 'pending',
      steps: {
        some: {
          status: 'pending',
          approvers: {
            some: { approverUserId: userId, status: 'pending' },
          },
        },
      },
    };

    if (formType) instanceWhere.formType = formType;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalInstance.findMany({
        where: instanceWhere,
        skip,
        take: limit,
        include: {
          steps: {
            where: { status: 'pending' },
            include: { approvers: { where: { approverUserId: userId } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalInstance.count({ where: instanceWhere }),
    ]);

    return { items, total, page, limit };
  }

  async findPendingCounts(userId: string) {
    const formTypes = ['leave', 'clock_patch', 'overtime', 'form'];
    const counts: Record<string, number> = {};

    await Promise.all(
      formTypes.map(async (formType) => {
        counts[formType] = await this.prisma.approvalInstance.count({
          where: {
            status: 'pending',
            formType,
            steps: {
              some: {
                status: 'pending',
                approvers: {
                  some: { approverUserId: userId, status: 'pending' },
                },
              },
            },
          },
        });
      }),
    );

    return counts;
  }

  async findCompleted(params: { userId: string; page?: number; limit?: number }) {
    const { userId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      steps: {
        some: {
          approvers: {
            some: { approverUserId: userId, status: { not: 'pending' } },
          },
        },
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalInstance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.approvalInstance.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findCc(params: { userId: string; page?: number; limit?: number }) {
    const { userId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = { ccUserId: userId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalCcUser.findMany({
        where,
        skip,
        take: limit,
        include: { instance: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalCcUser.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findInstance(id: string) {
    const instance = await this.prisma.approvalInstance.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            approvers: {
              include: { approver: { select: { id: true, displayName: true } } },
            },
            actions: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { stepOrder: 'asc' },
        },
        actions: {
          include: { approver: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        ccUsers: {
          include: { user: { select: { id: true, displayName: true } } },
        },
      },
    });
    if (!instance) throw new NotFoundException('Approval instance not found');
    return instance;
  }

  async approve(id: string, dto: { approverId: string; comment?: string }) {
    await this.findInstance(id);

    const step = await this.prisma.approvalStep.findFirst({
      where: { approvalInstanceId: id, status: 'pending' },
      include: { approvers: true },
      orderBy: { stepOrder: 'asc' },
    });
    if (!step) throw new NotFoundException('No pending step found');

    await this.prisma.$transaction([
      this.prisma.approvalStepApprover.updateMany({
        where: { approvalStepId: step.id, approverUserId: dto.approverId },
        data: { status: 'approved', actedAt: new Date(), comment: dto.comment },
      }),
      this.prisma.approvalAction.create({
        data: {
          approvalInstanceId: id,
          approvalStepId: step.id,
          approverUserId: dto.approverId,
          action: 'approve',
          comment: dto.comment,
        },
      }),
    ]);

    return { message: 'Approved' };
  }

  async reject(id: string, dto: { approverId: string; comment: string }) {
    await this.findInstance(id);

    const step = await this.prisma.approvalStep.findFirst({
      where: { approvalInstanceId: id, status: 'pending' },
      orderBy: { stepOrder: 'asc' },
    });
    if (!step) throw new NotFoundException('No pending step found');

    await this.prisma.$transaction([
      this.prisma.approvalStepApprover.updateMany({
        where: { approvalStepId: step.id, approverUserId: dto.approverId },
        data: { status: 'rejected', actedAt: new Date(), comment: dto.comment },
      }),
      this.prisma.approvalStep.update({
        where: { id: step.id },
        data: { status: 'rejected', completedAt: new Date() },
      }),
      this.prisma.approvalInstance.update({
        where: { id },
        data: { status: 'rejected', completedAt: new Date() },
      }),
      this.prisma.approvalAction.create({
        data: {
          approvalInstanceId: id,
          approvalStepId: step.id,
          approverUserId: dto.approverId,
          action: 'reject',
          comment: dto.comment,
        },
      }),
    ]);

    return { message: 'Rejected' };
  }

  async findAllTemplates(params: { formType?: string; page?: number; limit?: number }) {
    const { formType, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: any = formType ? { formType } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalTemplate.findMany({
        where,
        skip,
        take: limit,
        include: { steps: { include: { approvers: true }, orderBy: { stepOrder: 'asc' } } },
        orderBy: { priority: 'asc' },
      }),
      this.prisma.approvalTemplate.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getTemplate(id: string) {
    const t = await this.prisma.approvalTemplate.findUnique({
      where: { id },
      include: {
        steps: {
          include: { approvers: true },
          orderBy: { stepOrder: 'asc' },
        },
      },
    });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async createTemplate(dto: any) {
    // Auto-generate a unique code if not provided
    const code = dto.code?.trim()
      || `TPL-${(dto.formType ?? 'GENERAL').toUpperCase().replace(/_/g, '-')}-${Date.now()}`;
    return this.prisma.approvalTemplate.create({ data: { ...dto, code } });
  }

  async updateTemplate(id: string, dto: any) {
    const { steps: _steps, ...rest } = dto;
    return this.prisma.approvalTemplate.update({ where: { id }, data: rest });
  }

  async replaceTemplateSteps(id: string, steps: Array<{
    stepOrder: number;
    stepName: string;
    approvalMode: string;
    isRequired?: boolean;
    allowDynamicAdding?: boolean;
    approvers: Array<{
      approverType: string;
      approverUserId?: string;
      approverRoleCode?: string;
      scopeConfig?: Record<string, unknown>;
    }>;
  }>) {
    await this.getTemplate(id);

    return this.prisma.$transaction(async (tx) => {
      const existingSteps = await tx.approvalTemplateStep.findMany({
        where: { approvalTemplateId: id },
        select: { id: true },
      });
      if (existingSteps.length > 0) {
        await tx.approvalTemplateStepApprover.deleteMany({
          where: { approvalTemplateStepId: { in: existingSteps.map((s) => s.id) } },
        });
        await tx.approvalTemplateStep.deleteMany({ where: { approvalTemplateId: id } });
      }

      for (const step of steps) {
        const created = await tx.approvalTemplateStep.create({
          data: {
            approvalTemplateId: id,
            stepOrder:          step.stepOrder,
            stepName:           step.stepName,
            approvalMode:       step.approvalMode,
            isRequired:         step.isRequired ?? true,
            allowDynamicAdding: step.allowDynamicAdding ?? false,
          },
        });
        const approverList = step.approvers?.length
          ? step.approvers
          : [{ approverType: 'applicant_direct_manager' }];

        for (const approver of approverList) {
          await tx.approvalTemplateStepApprover.create({
            data: {
              approvalTemplateStepId: created.id,
              approverType:     approver.approverType,
              approverUserId:   approver.approverUserId   ?? null,
              approverRoleCode: approver.approverRoleCode ?? null,
              scopeConfig:      (approver.scopeConfig ?? undefined) as any,
            },
          });
        }
      }

      return tx.approvalTemplate.findUnique({
        where: { id },
        include: {
          steps: { include: { approvers: true }, orderBy: { stepOrder: 'asc' } },
        },
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // 審批群組 CRUD
  // ══════════════════════════════════════════════════════════════

  private groupInclude = {
    members: {
      where: { isActive: true },
      include: { user: { select: { id: true, displayName: true, employeeNo: true, avatarUrl: true } } },
      orderBy: { memberType: 'asc' as const },
    },
    scopes: { orderBy: { scopeType: 'asc' as const } },
  };

  async findAllGroups(params: { roleCode?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { roleCode, isActive, page = 1, limit = 50 } = params;
    const where: any = {};
    if (roleCode)               where.roleCode = roleCode;
    if (isActive !== undefined)  where.isActive = isActive;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalGroup.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: this.groupInclude,
        orderBy: [{ roleCode: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.approvalGroup.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getGroup(id: string) {
    const g = await this.prisma.approvalGroup.findUnique({
      where: { id },
      include: this.groupInclude,
    });
    if (!g) throw new NotFoundException('Approval group not found');
    return g;
  }

  async createGroup(dto: { name: string; roleCode: string; mode?: string; description?: string }) {
    return this.prisma.approvalGroup.create({
      data: {
        name:        dto.name,
        roleCode:    dto.roleCode,
        mode:        dto.mode ?? 'primary',
        description: dto.description,
      },
      include: this.groupInclude,
    });
  }

  async updateGroup(id: string, dto: { name?: string; mode?: string; description?: string; isActive?: boolean }) {
    await this.getGroup(id);
    return this.prisma.approvalGroup.update({
      where: { id },
      data:  dto,
      include: this.groupInclude,
    });
  }

  // ── 群組成員 ──────────────────────────────────────────────────

  async addGroupMember(groupId: string, dto: {
    userId: string; memberType?: string; startedAt?: string; endedAt?: string;
  }) {
    await this.getGroup(groupId);
    const existing = await this.prisma.approvalGroupMember.findFirst({
      where: { groupId, userId: dto.userId, isActive: true },
    });
    if (existing) {
      // 更新既有記錄的 memberType
      return this.prisma.approvalGroupMember.update({
        where: { id: existing.id },
        data: {
          memberType: dto.memberType ?? existing.memberType,
          startedAt:  dto.startedAt ? new Date(dto.startedAt) : existing.startedAt,
          endedAt:    dto.endedAt   ? new Date(dto.endedAt)   : existing.endedAt,
        },
        include: { user: { select: { id: true, displayName: true, employeeNo: true, avatarUrl: true } } },
      });
    }
    return this.prisma.approvalGroupMember.create({
      data: {
        groupId,
        userId:     dto.userId,
        memberType: dto.memberType ?? 'member',
        startedAt:  dto.startedAt ? new Date(dto.startedAt) : null,
        endedAt:    dto.endedAt   ? new Date(dto.endedAt)   : null,
      },
      include: { user: { select: { id: true, displayName: true, employeeNo: true, avatarUrl: true } } },
    });
  }

  async removeGroupMember(memberId: string) {
    return this.prisma.approvalGroupMember.update({
      where: { id: memberId },
      data:  { isActive: false, endedAt: new Date() },
    });
  }

  // ── 群組服務範圍 ───────────────────────────────────────────────

  async addGroupScope(groupId: string, dto: {
    scopeType: string; scopeId?: string; formType?: string;
  }) {
    await this.getGroup(groupId);
    const existing = await this.prisma.approvalGroupScope.findFirst({
      where: {
        groupId,
        scopeType: dto.scopeType,
        scopeId:   dto.scopeId   ?? null,
        formType:  dto.formType  ?? null,
      },
    });
    if (existing) return existing; // 已存在，不重複新增
    return this.prisma.approvalGroupScope.create({
      data: {
        groupId,
        scopeType: dto.scopeType,
        scopeId:   dto.scopeId  ?? null,
        formType:  dto.formType ?? null,
      },
    });
  }

  async removeGroupScope(scopeId: string) {
    return this.prisma.approvalGroupScope.delete({ where: { id: scopeId } });
  }

  // ══════════════════════════════════════════════════════════════
  // 審批群組解析引擎
  // 依據 roleCode + 申請人組織上下文，找出最匹配的群組，再取得審批人
  // ══════════════════════════════════════════════════════════════

  /**
   * 解析群組審批人
   * context.groupType 決定用哪個分組維度來匹配：
   *   company | business_unit | project | department → 嚴格比對對應 scope
   *   special → 比對 scopeType=all（執行長、董事長等集團層級）
   */
  async resolveGroupApprovers(roleCode: string, context: {
    groupType: string;           // 分組類型（來自 scopeConfig.groupType）
    companyId?: string;
    regionId?: string;
    businessUnitId?: string;
    projectId?: string;
    departmentId?: string;
    formType?: string;
  }): Promise<{ userId: string; displayName: string; memberType: string; groupId: string; groupName: string; mode: string } | null> {

    const allGroups = await this.prisma.approvalGroup.findMany({
      where: { roleCode, isActive: true },
      include: {
        scopes: true,
        members: {
          where: { isActive: true },
          include: { user: { select: { id: true, displayName: true } } },
        },
      },
    });

    if (!allGroups.length) return null;

    // 依 groupType 決定比對的 scopeType 與對應的 context 值
    const scopeContextMap: Record<string, string | undefined> = {
      company:       context.companyId,
      business_unit: context.businessUnitId,
      project:       context.projectId,
      department:    context.departmentId,
    };
    const isSpecial = context.groupType === 'special';
    const targetScopeId = scopeContextMap[context.groupType];

    const matchedGroup = allGroups.find((group) =>
      group.scopes.some((scope) => {
        if (isSpecial) return scope.scopeType === 'all';
        return scope.scopeType === context.groupType && scope.scopeId === targetScopeId;
      }),
    );

    if (!matchedGroup) return null;

    const member = matchedGroup.mode === 'primary'
      ? matchedGroup.members.find(m => m.memberType === 'primary') ?? matchedGroup.members[0]
      : matchedGroup.members[0];

    if (!member) return null;

    return {
      userId:      member.userId,
      displayName: member.user.displayName,
      memberType:  member.memberType,
      groupId:     matchedGroup.id,
      groupName:   matchedGroup.name,
      mode:        matchedGroup.mode,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 送出前審批流驗證
  // ══════════════════════════════════════════════════════════════

  /** 驗證某表單是否有可用的審批模板，以及是否能解析出所有必要的審批人 */
  async validateFormApprovalReady(params: {
    formType:      string;
    amount?:       number;
    companyId?:    string;
    regionId?:     string;
    businessUnitId?: string;
    projectId?:    string;
    departmentId?: string;
    applicantId?:  string;
  }) {
    const { formType, amount } = params;

    // 1. 是否有啟用的模板
    const templates = await this.prisma.approvalTemplate.findMany({
      where: {
        formType,
        isActive: true,
        ...(amount !== undefined ? {
          AND: [
            { OR: [{ minAmount: null }, { minAmount: { lte: amount } }] },
            { OR: [{ maxAmount: null }, { maxAmount: { gte: amount } }] },
          ],
        } : {}),
      },
      include: {
        steps: {
          include: { approvers: true },
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { priority: 'asc' },
    });

    if (!templates.length) {
      throw new BadRequestException({
        code: 'NO_TEMPLATE',
        message: `表單類型「${formType}」沒有符合條件的啟用審批模板，請聯繫系統管理員。`,
      });
    }

    // 選擇優先序最高的模板
    const template = templates[0];
    const errors: string[] = [];

    // 2. 驗證每個必要步驟是否能解析審批人
    const GROUP_BASED_TYPES = ['lead', 'hr', 'hr_manager', 'finance', 'finance_manager', 'ceo', 'chairman'];

    for (const step of template.steps) {
      if (!step.isRequired) continue;
      for (const approver of step.approvers) {
        const t = approver.approverType;

        if (t === 'applicant_direct_manager') {
          if (params.applicantId) {
            const org = await this.prisma.userOrgAssignment.findFirst({
              where: { userId: params.applicantId, isPrimary: true, directManagerUserId: { not: null } },
            });
            if (!org?.directManagerUserId) {
              errors.push(`步驟「${step.stepName}」需要直屬主管，但申請人尚未設定直屬主管。`);
            }
          }
        } else if (GROUP_BASED_TYPES.includes(t)) {
          const scopeConfig = (approver.scopeConfig ?? {}) as Record<string, string>;
          const groupType = scopeConfig['groupType'] ?? 'special';
          const resolved = await this.resolveGroupApprovers(t, { groupType, ...params });
          if (!resolved) {
            errors.push(`步驟「${step.stepName}」的審批角色「${t}」（分組：${groupType}）找不到符合條件的審批群組，請在「審批群組」頁面設定。`);
          }
        } else if (t === 'user' && !approver.approverUserId) {
          errors.push(`步驟「${step.stepName}」指定了「指定人員」但未選擇人員。`);
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({ code: 'APPROVAL_RESOLVE_FAILED', message: '審批流程驗證失敗', errors });
    }

    return { valid: true, templateId: template.id, templateName: template.name };
  }
}
