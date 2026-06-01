import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createTemplate(dto: any) {
    return this.prisma.approvalTemplate.create({ data: dto });
  }

  async updateTemplate(id: string, dto: any) {
    return this.prisma.approvalTemplate.update({ where: { id }, data: dto });
  }
}
