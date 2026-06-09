import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkOrdersService } from '../work-orders/work-orders.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WorkOrdersService))
    private readonly workOrdersService: WorkOrdersService,
  ) {}

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
    const instance = await this.findInstance(id);

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

    // Check if all steps are now approved
    const remainingSteps = await this.prisma.approvalStep.count({
      where: { approvalInstanceId: id, status: 'pending' },
    });

    if (remainingSteps === 0) {
      await this.prisma.approvalInstance.update({
        where: { id },
        data: { status: 'approved', completedAt: new Date() },
      });

      // Trigger post-approval logic based on formType
      if (instance.formType === 'personnel_resource_request') {
        const formRequest = await this.prisma.oaFormRequest.findFirst({
          where: { approvalInstanceId: id },
          include: { personnelResourceRequest: true },
        });

        if (formRequest?.personnelResourceRequest) {
          await this.workOrdersService.generateFromPersonnelRequest(
            formRequest.personnelResourceRequest.id,
          );
        }
      }
    }

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
  // 審批對應關聯表 CRUD
  // ══════════════════════════════════════════════════════════════

  async listAssignments(params: {
    scopeType?: string; scopeId?: string | null; roleCode?: string; userId?: string;
    page?: number; limit?: number;
  }) {
    const { scopeType, scopeId, roleCode, userId, page = 1, limit = 100 } = params;
    const where: any = {};
    if (scopeType !== undefined) where.scopeType = scopeType;
    if (scopeId   !== undefined) where.scopeId   = scopeId;
    if (roleCode  !== undefined) where.roleCode  = roleCode;
    if (userId    !== undefined) where.userId    = userId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalAssignment.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        include: { user: { select: { id: true, displayName: true, employeeNo: true, avatarUrl: true } } },
        orderBy: [{ scopeType: 'asc' }, { roleCode: 'asc' }, { isDefault: 'desc' }],
      }),
      this.prisma.approvalAssignment.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async addAssignment(dto: {
    scopeType: string; scopeId?: string | null; roleCode: string; userId: string;
  }) {
    const { scopeType, scopeId = null, roleCode, userId } = dto;

    // 防止重複
    const existing = await this.prisma.approvalAssignment.findFirst({
      where: { scopeType, scopeId, roleCode, userId },
    });
    if (existing) return existing;

    // 是否為此分組+角色的第一筆
    const count = await this.prisma.approvalAssignment.count({
      where: { scopeType, scopeId, roleCode },
    });
    const isDefault = count === 0;

    return this.prisma.approvalAssignment.create({
      data: { scopeType, scopeId, roleCode, userId, isDefault },
      include: { user: { select: { id: true, displayName: true, employeeNo: true, avatarUrl: true } } },
    });
  }

  async removeAssignment(id: string) {
    const assignment = await this.prisma.approvalAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.prisma.approvalAssignment.delete({ where: { id } });

    // 若刪除的是預設，且同分組+角色還有其他人員，自動設第一筆為新預設
    if (assignment.isDefault) {
      const next = await this.prisma.approvalAssignment.findFirst({
        where: { scopeType: assignment.scopeType, scopeId: assignment.scopeId, roleCode: assignment.roleCode },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.approvalAssignment.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }

    return { message: 'Removed' };
  }

  async setDefaultAssignment(id: string) {
    const assignment = await this.prisma.approvalAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.$transaction([
      this.prisma.approvalAssignment.updateMany({
        where: { scopeType: assignment.scopeType, scopeId: assignment.scopeId, roleCode: assignment.roleCode },
        data:  { isDefault: false },
      }),
      this.prisma.approvalAssignment.update({
        where: { id },
        data:  { isDefault: true },
        include: { user: { select: { id: true, displayName: true, employeeNo: true, avatarUrl: true } } },
      }),
    ]);
  }

  // ══════════════════════════════════════════════════════════════
  // 審批對應解析引擎
  // ══════════════════════════════════════════════════════════════

  /** 依 roleCode + context 查詢預設審批人 */
  async resolveGroupApprovers(roleCode: string, context: {
    groupType: string;
    companyId?: string;
    regionId?: string;
    businessUnitId?: string;
    projectId?: string;
    departmentId?: string;
    formType?: string;
  }): Promise<{ userId: string; displayName: string; isDefault: boolean } | null> {

    const isSpecial = context.groupType === 'special';
    const scopeIdMap: Record<string, string | undefined> = {
      company:       context.companyId,
      business_unit: context.businessUnitId,
      project:       context.projectId,
      department:    context.departmentId,
    };
    const scopeId = isSpecial ? null : (scopeIdMap[context.groupType] ?? null);

    const assignment = await this.prisma.approvalAssignment.findFirst({
      where: {
        roleCode,
        scopeType: context.groupType,
        scopeId,
        isDefault: true,
      },
      include: { user: { select: { id: true, displayName: true } } },
    });

    if (!assignment) return null;

    return {
      userId:      assignment.userId,
      displayName: assignment.user.displayName,
      isDefault:   true,
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
            errors.push(`步驟「${step.stepName}」的審批角色「${t}」（分組：${groupType}）找不到預設審批人，請在帳號管理或分組管理中設定審批對應。`);
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
