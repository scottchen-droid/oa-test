import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async findAllTemplates(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.approvalTemplate.findMany({
        skip,
        take: limit,
        include: { steps: { include: { approvers: true } } },
        orderBy: { priority: 'asc' },
      }),
      this.prisma.approvalTemplate.count(),
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
    return this.prisma.approvalTemplate.create({ data: dto });
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

  // ── 員工審批職能角色 ──────────────────────────────────────

  async getEmployeeApproverRoles(userId: string) {
    return this.prisma.employeeApproverRole.findMany({
      where: { userId, isActive: true },
      include: {
        user: { select: { id: true, displayName: true, employeeNo: true } },
        company: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ scopeType: 'asc' }, { roleType: 'asc' }],
    });
  }

  /**
   * 查詢特定職能角色目前由誰擔任（用於前端顯示衝突資訊）
   * roleType + scopeType + scopeId 組合全系統只能有一個啟用記錄
   */
  async findApproverRoleHolder(dto: { roleType: string; scopeType: string; scopeId?: string }) {
    return this.prisma.employeeApproverRole.findFirst({
      where: {
        roleType:  dto.roleType,
        scopeType: dto.scopeType,
        scopeId:   dto.scopeId ?? null,
        isActive:  true,
      },
      include: {
        user:    { select: { id: true, displayName: true, employeeNo: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * 為員工指派審批職能角色
   * - 每個 (roleType + scopeType + scopeId) 全系統只能有一個啟用記錄
   * - forceReplace=false：若有人持有則拋出 409，附帶現持有人資訊
   * - forceReplace=true ：先停用現持有人，再指派給新員工（轉移）
   */
  async createEmployeeApproverRole(
    userId: string,
    dto: { roleType: string; scopeType: string; scopeId?: string; startedAt?: string; endedAt?: string },
    forceReplace = false,
  ) {
    const scopeId = dto.scopeId ?? null;

    // 檢查是否已有其他人持有此角色
    const existing = await this.prisma.employeeApproverRole.findFirst({
      where: {
        roleType:  dto.roleType,
        scopeType: dto.scopeType,
        scopeId,
        isActive:  true,
        userId:    { not: userId },   // 排除自己（同人重複設定不算衝突）
      },
      include: {
        user: { select: { id: true, displayName: true, employeeNo: true } },
      },
    });

    if (existing && !forceReplace) {
      throw new ConflictException({
        message: `此角色已由 ${existing.user.displayName}（工號 ${existing.user.employeeNo}）擔任`,
        currentHolder: {
          roleRecordId: existing.id,
          userId:       existing.userId,
          displayName:  existing.user.displayName,
          employeeNo:   existing.user.employeeNo,
        },
      });
    }

    if (existing && forceReplace) {
      // 停用原持有人
      await this.prisma.employeeApproverRole.update({
        where: { id: existing.id },
        data:  { isActive: false, endedAt: new Date() },
      });
    }

    // 檢查同一員工是否已持有此角色（避免重複指派）
    const selfExisting = await this.prisma.employeeApproverRole.findFirst({
      where: { roleType: dto.roleType, scopeType: dto.scopeType, scopeId, userId, isActive: true },
    });
    if (selfExisting) {
      return selfExisting; // 已存在，直接返回，不報錯
    }

    return this.prisma.employeeApproverRole.create({
      data: {
        userId,
        roleType:  dto.roleType,
        scopeType: dto.scopeType,
        scopeId,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        endedAt:   dto.endedAt   ? new Date(dto.endedAt)   : null,
      },
      include: {
        user:    { select: { id: true, displayName: true, employeeNo: true } },
        company: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async deleteEmployeeApproverRole(roleId: string) {
    return this.prisma.employeeApproverRole.update({
      where: { id: roleId },
      data:  { isActive: false, endedAt: new Date() },
    });
  }

  /** 查詢某公司/集團所有審批職能角色的當前持有人 */
  async listApproverRoleHolders(params: { scopeType?: string; scopeId?: string }) {
    return this.prisma.employeeApproverRole.findMany({
      where: {
        isActive:  true,
        ...(params.scopeType ? { scopeType: params.scopeType } : {}),
        ...(params.scopeId   ? { scopeId:   params.scopeId   } : {}),
      },
      include: {
        user:    { select: { id: true, displayName: true, employeeNo: true, avatarUrl: true } },
        company: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ roleType: 'asc' }, { scopeType: 'asc' }],
    });
  }
}
