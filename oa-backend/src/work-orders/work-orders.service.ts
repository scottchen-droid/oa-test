import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkOrderDispatchRulesService } from '../work-order-dispatch-rules/work-order-dispatch-rules.service';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchRulesService: WorkOrderDispatchRulesService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // 工作單產生（審批通過後呼叫）
  // ─────────────────────────────────────────────────────────────────

  async generateFromPersonnelRequest(personnelRequestId: string): Promise<void> {
    const request = await this.prisma.personnelResourceRequest.findUnique({
      where: { id: personnelRequestId },
      include: {
        items: {
          include: { resourceItem: true },
        },
        formRequest: {
          select: {
            companyId: true,
            departmentId: true,
            businessUnitId: true,
            projectId: true,
            regionId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Personnel resource request not found');
    }

    const orgContext = {
      regionId: request.formRequest.regionId,
      companyId: request.formRequest.companyId,
      departmentId: request.formRequest.departmentId,
      businessUnitId: request.formRequest.businessUnitId,
      projectId: request.formRequest.projectId,
    };

    // Create work orders for each item and update request status in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of request.items) {
        const groupId = await this.dispatchRulesService.findMatchingGroup(
          item.resourceItemId,
          orgContext,
        );

        const status = groupId ? 'pending' : 'dispatch_error';
        const dispatchErrorMsg = groupId
          ? null
          : `No matching dispatch rule found for resource item "${item.resourceItem.name}" with given org context.`;

        const workOrder = await tx.workOrder.create({
          data: {
            requestId: request.id,
            requestItemId: item.id,
            resourceItemId: item.resourceItemId,
            workOrderGroupId: groupId,
            status,
            dispatchErrorMsg,
          },
        });

        await tx.workOrderHistory.create({
          data: {
            workOrderId: workOrder.id,
            operatorUserId: request.targetUserId,
            action: 'dispatch',
            fromStatus: null,
            toStatus: status,
            toGroupId: groupId,
            content: dispatchErrorMsg ?? `Dispatched to group ${groupId}`,
          },
        });
      }

      await tx.personnelResourceRequest.update({
        where: { id: personnelRequestId },
        data: { status: 'processing' },
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 查詢
  // ─────────────────────────────────────────────────────────────────

  async findMyWorkOrders(
    userId: string,
    params: { status?: string; page?: number; limit?: number },
  ) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Find groups that the user belongs to
    const memberships = await this.prisma.workOrderGroupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = memberships.map((m) => m.groupId);

    const where: Record<string, unknown> = {
      OR: [
        { assignedUserId: userId },
        ...(groupIds.length > 0 ? [{ workOrderGroupId: { in: groupIds } }] : []),
      ],
    };
    if (status) where['status'] = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          resourceItem: { select: { id: true, code: true, name: true } },
          workOrderGroup: { select: { id: true, name: true } },
          request: {
            select: {
              id: true,
              requestType: true,
              targetUserId: true,
              effectiveDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findGroupWorkOrders(
    userId: string,
    params: { groupId?: string; status?: string; page?: number; limit?: number },
  ) {
    const { groupId, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Ensure user belongs to the groups being queried
    const membershipWhere: Record<string, unknown> = { userId };
    if (groupId) membershipWhere['groupId'] = groupId;

    const memberships = await this.prisma.workOrderGroupMember.findMany({
      where: membershipWhere,
      select: { groupId: true },
    });
    const allowedGroupIds = memberships.map((m) => m.groupId);

    if (allowedGroupIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const where: Record<string, unknown> = {
      workOrderGroupId: { in: allowedGroupIds },
    };
    if (status) where['status'] = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          resourceItem: { select: { id: true, code: true, name: true } },
          workOrderGroup: { select: { id: true, name: true } },
          request: {
            select: {
              id: true,
              requestType: true,
              targetUserId: true,
              effectiveDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findWorkOrdersByRequest(requestId: string, requestingUserId: string) {
    const request = await this.prisma.personnelResourceRequest.findUnique({
      where: { id: requestId },
      select: { targetUserId: true, formRequest: { select: { submitterUserId: true } } },
    });

    if (!request) throw new NotFoundException('Personnel resource request not found');

    const isSubmitter = request.formRequest.submitterUserId === requestingUserId;
    const isTarget = request.targetUserId === requestingUserId;

    if (!isSubmitter && !isTarget) {
      throw new ForbiddenException('No permission to view these work orders');
    }

    return this.prisma.workOrder.findMany({
      where: { requestId },
      include: {
        resourceItem: { select: { id: true, code: true, name: true } },
        workOrderGroup: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, displayName: true } },
        histories: {
          orderBy: { createdAt: 'asc' },
          include: { operatorUser: { select: { id: true, displayName: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 工作單操作
  // ─────────────────────────────────────────────────────────────────

  async startProcessing(workOrderId: string, operatorUserId: string) {
    const workOrder = await this.findWorkOrderOrThrow(workOrderId);
    const fromStatus = workOrder.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: 'processing' },
      });
      await tx.workOrderHistory.create({
        data: {
          workOrderId,
          operatorUserId,
          action: 'start',
          fromStatus,
          toStatus: 'processing',
        },
      });
      return wo;
    });

    return updated;
  }

  async complete(
    workOrderId: string,
    operatorUserId: string,
    resultData?: Record<string, unknown>,
  ) {
    const workOrder = await this.findWorkOrderOrThrow(workOrderId);
    const fromStatus = workOrder.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          ...(resultData !== undefined && { resultData: resultData as any }),
        },
      });
      await tx.workOrderHistory.create({
        data: {
          workOrderId,
          operatorUserId,
          action: 'complete',
          fromStatus,
          toStatus: 'completed',
        },
      });
      return wo;
    });

    // Bind employee resource after completion
    await this.bindEmployeeResource({ ...updated, resultData: resultData ?? updated.resultData });

    // Check if entire request is complete
    await this.checkAndCloseRequest(updated.requestId);

    return updated;
  }

  async markFailed(workOrderId: string, operatorUserId: string, reason: string) {
    const workOrder = await this.findWorkOrderOrThrow(workOrderId);
    const fromStatus = workOrder.status;

    return this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: 'failed' },
      });
      await tx.workOrderHistory.create({
        data: {
          workOrderId,
          operatorUserId,
          action: 'fail',
          fromStatus,
          toStatus: 'failed',
          content: reason,
        },
      });
      return wo;
    });
  }

  async returnWorkOrder(workOrderId: string, operatorUserId: string, reason: string) {
    const workOrder = await this.findWorkOrderOrThrow(workOrderId);
    const fromStatus = workOrder.status;

    return this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: 'returned' },
      });
      await tx.workOrderHistory.create({
        data: {
          workOrderId,
          operatorUserId,
          action: 'return',
          fromStatus,
          toStatus: 'returned',
          content: reason,
        },
      });
      return wo;
    });
  }

  async reassign(
    workOrderId: string,
    operatorUserId: string,
    newGroupId: string,
    reason: string,
  ) {
    const workOrder = await this.findWorkOrderOrThrow(workOrderId);
    const fromGroupId = workOrder.workOrderGroupId;

    return this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id: workOrderId },
        data: { workOrderGroupId: newGroupId },
      });
      await tx.workOrderHistory.create({
        data: {
          workOrderId,
          operatorUserId,
          action: 'reassign',
          fromGroupId,
          toGroupId: newGroupId,
          content: reason,
        },
      });
      return wo;
    });
  }

  async addNote(workOrderId: string, operatorUserId: string, content: string) {
    await this.findWorkOrderOrThrow(workOrderId);
    return this.prisma.workOrderHistory.create({
      data: {
        workOrderId,
        operatorUserId,
        action: 'note',
        content,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────

  private async findWorkOrderOrThrow(workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });
    if (!workOrder) throw new NotFoundException('Work order not found');
    return workOrder;
  }

  private async bindEmployeeResource(workOrder: {
    id: string;
    requestId: string;
    resourceItemId: string;
    resultData: unknown;
  }) {
    const request = await this.prisma.personnelResourceRequest.findUnique({
      where: { id: workOrder.requestId },
      select: { targetUserId: true, requestType: true },
    });

    if (!request) return;

    const isOffboard = request.requestType === 'offboard';
    const isActive = !isOffboard;

    let value: string | undefined;
    if (workOrder.resultData && typeof workOrder.resultData === 'object') {
      const rd = workOrder.resultData as Record<string, unknown>;
      // Try common keys for account/card values
      value =
        (rd['account'] as string | undefined) ??
        (rd['cardNo'] as string | undefined) ??
        (rd['extension'] as string | undefined) ??
        (rd['value'] as string | undefined);
    }

    await this.prisma.employeeResource.upsert({
      where: {
        userId_resourceItemId: {
          userId: request.targetUserId,
          resourceItemId: workOrder.resourceItemId,
        },
      },
      create: {
        userId: request.targetUserId,
        resourceItemId: workOrder.resourceItemId,
        value,
        isActive,
        workOrderId: workOrder.id,
      },
      update: {
        value,
        isActive,
        workOrderId: workOrder.id,
      },
    });
  }

  async checkAndCloseRequest(requestId: string) {
    const workOrders = await this.prisma.workOrder.findMany({
      where: { requestId },
      select: { status: true },
    });

    const allDone = workOrders.every((wo) =>
      ['completed', 'canceled'].includes(wo.status),
    );

    if (allDone && workOrders.length > 0) {
      await this.prisma.personnelResourceRequest.update({
        where: { id: requestId },
        data: { status: 'completed' },
      });
    }
  }
}
