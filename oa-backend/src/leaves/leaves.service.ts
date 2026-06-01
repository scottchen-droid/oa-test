import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

function generateRequestNo(prefix: string): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${ym}-${rand}`;
}

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Leave Types ───────────────────────────────────────────────────────────

  async findLeaveTypes() {
    const items = await this.prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { items, total: items.length };
  }

  async createLeaveType(dto: {
    code: string;
    name: string;
    description?: string;
    requiresApproval?: boolean;
    isPaid?: boolean;
    isAnnual?: boolean;
    allowCarryOver?: boolean;
    carryOverLimitDays?: number;
    allowNegativeBalance?: boolean;
  }) {
    const existing = await this.prisma.leaveType.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Leave type code already exists');

    return this.prisma.leaveType.create({ data: dto as any });
  }

  async updateLeaveType(id: string, dto: Partial<{
    name: string;
    description: string;
    requiresApproval: boolean;
    isPaid: boolean;
    isAnnual: boolean;
    allowCarryOver: boolean;
    carryOverLimitDays: number;
    allowNegativeBalance: boolean;
    isActive: boolean;
  }>) {
    const existing = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leave type not found');

    return this.prisma.leaveType.update({ where: { id }, data: dto as any });
  }

  // ─── Leave Balances ────────────────────────────────────────────────────────

  async findBalances(params: { userId?: string; year?: number; leaveTypeId?: string }) {
    const { userId, year, leaveTypeId } = params;
    const where: any = {};
    if (userId) where.userId = userId;
    if (year) where.year = Number(year);
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;

    const items = await this.prisma.leaveBalance.findMany({
      where,
      include: {
        leaveType: { select: { id: true, code: true, name: true } },
        user: { select: { id: true, employeeNo: true, displayName: true } },
      },
      orderBy: [{ year: 'desc' }, { leaveType: { name: 'asc' } }],
    });

    return { items, total: items.length };
  }

  async updateBalance(id: string, dto: { adjustedDays?: number; entitledDays?: number; note?: string }) {
    const balance = await this.prisma.leaveBalance.findUnique({ where: { id } });
    if (!balance) throw new NotFoundException('Leave balance not found');

    const data: any = {};
    if (dto.adjustedDays !== undefined) data.adjustedDays = dto.adjustedDays;
    if (dto.entitledDays !== undefined) data.entitledDays = dto.entitledDays;

    return this.prisma.leaveBalance.update({ where: { id }, data });
  }

  async initYearBalances(year: number, companyId?: string) {
    const leaveTypes = await this.prisma.leaveType.findMany({
      where: { isActive: true, isAnnual: true },
      include: { leavePolicies: { where: { isActive: true } } },
    });

    let userWhere: any = { status: 'active' };
    if (companyId) {
      userWhere.orgAssignments = { some: { companyId, isPrimary: true } };
    }

    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    let created = 0;
    for (const user of users) {
      for (const lt of leaveTypes) {
        const policy = lt.leavePolicies[0];
        const entitledDays = policy ? Number(policy.annualDays) : 0;

        await this.prisma.leaveBalance.upsert({
          where: { userId_leaveTypeId_year: { userId: user.id, leaveTypeId: lt.id, year } },
          create: { userId: user.id, leaveTypeId: lt.id, year, entitledDays },
          update: {},
        });
        created++;
      }
    }

    return { message: `Initialized ${created} balance records for year ${year}` };
  }

  // ─── Leave Requests ────────────────────────────────────────────────────────

  async findAll(params: {
    userId?: string;
    leaveTypeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    companyId?: string;
    deptId?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, leaveTypeId, status, startDate, endDate, companyId, deptId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }
    if (companyId || deptId) {
      where.user = {
        orgAssignments: {
          some: {
            isPrimary: true,
            ...(companyId ? { companyId } : {}),
            ...(deptId ? { departmentId: deptId } : {}),
          },
        },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, employeeNo: true, displayName: true } },
          leaveType: { select: { id: true, code: true, name: true } },
          proxy: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const req = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, employeeNo: true, displayName: true } },
        leaveType: true,
        proxy: { select: { id: true, displayName: true } },
      },
    });
    if (!req) throw new NotFoundException('Leave request not found');
    return req;
  }

  async create(userId: string, dto: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    startPeriod?: string;
    endPeriod?: string;
    totalDays: number;
    reason?: string;
    proxyUserId?: string;
  }) {
    const leaveType = await this.prisma.leaveType.findUnique({ where: { id: dto.leaveTypeId } });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    // Check balance if it's an annual leave type
    if (leaveType.isAnnual) {
      const year = new Date(dto.startDate).getFullYear();
      const balance = await this.prisma.leaveBalance.findUnique({
        where: { userId_leaveTypeId_year: { userId, leaveTypeId: dto.leaveTypeId, year } },
      });

      if (balance) {
        const available = Number(balance.entitledDays) + Number(balance.carryOverDays) + Number(balance.adjustedDays) - Number(balance.usedDays) - Number(balance.pendingDays);
        if (!leaveType.allowNegativeBalance && available < dto.totalDays) {
          throw new BadRequestException(`Insufficient leave balance. Available: ${available.toFixed(1)} days`);
        }
        // Reserve pending days
        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { increment: dto.totalDays } },
        });
      }
    }

    return this.prisma.leaveRequest.create({
      data: {
        requestNo: generateRequestNo('LV'),
        userId,
        leaveTypeId: dto.leaveTypeId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        startPeriod: dto.startPeriod,
        endPeriod: dto.endPeriod,
        totalDays: dto.totalDays,
        reason: dto.reason,
        proxyUserId: dto.proxyUserId,
        status: leaveType.requiresApproval ? 'submitted' : 'approved',
        submittedAt: leaveType.requiresApproval ? new Date() : undefined,
        approvedAt: !leaveType.requiresApproval ? new Date() : undefined,
        createdBy: userId,
      },
    });
  }

  async update(id: string, userId: string, dto: Partial<{
    startDate: string;
    endDate: string;
    startPeriod: string;
    endPeriod: string;
    totalDays: number;
    reason: string;
    proxyUserId: string;
  }>) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Leave request not found');
    if (req.userId !== userId) throw new BadRequestException('Not authorized');
    if (req.status !== 'draft') throw new BadRequestException('Can only edit draft requests');

    const data: any = {};
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.startPeriod !== undefined) data.startPeriod = dto.startPeriod;
    if (dto.endPeriod !== undefined) data.endPeriod = dto.endPeriod;
    if (dto.totalDays !== undefined) data.totalDays = dto.totalDays;
    if (dto.reason !== undefined) data.reason = dto.reason;
    if (dto.proxyUserId !== undefined) data.proxyUserId = dto.proxyUserId;

    return this.prisma.leaveRequest.update({ where: { id }, data });
  }

  async cancel(id: string, userId: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Leave request not found');
    if (req.userId !== userId) throw new BadRequestException('Not authorized');
    if (!['draft', 'submitted'].includes(req.status)) {
      throw new BadRequestException('Can only cancel draft or submitted requests');
    }

    // Release pending balance
    if (req.status === 'submitted') {
      const year = req.startDate.getFullYear();
      const balance = await this.prisma.leaveBalance.findUnique({
        where: { userId_leaveTypeId_year: { userId, leaveTypeId: req.leaveTypeId, year } },
      });
      if (balance && Number(balance.pendingDays) > 0) {
        await this.prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { decrement: Number(req.totalDays) } },
        });
      }
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'canceled', canceledAt: new Date() },
    });
  }

  async remove(id: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Leave request not found');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'canceled', canceledAt: new Date() },
    });
  }

  // ─── HR approval ──────────────────────────────────────────────────────────

  async approve(id: string, operatorId: string, comment?: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Leave request not found');
    if (req.status !== 'submitted') throw new BadRequestException('Request is not in submitted status');

    const year = req.startDate.getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { userId_leaveTypeId_year: { userId: req.userId, leaveTypeId: req.leaveTypeId, year } },
    });

    if (balance) {
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: { increment: Number(req.totalDays) },
          pendingDays: { decrement: Number(req.totalDays) },
        },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date() },
    });
  }

  async reject(id: string, operatorId: string, reason: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Leave request not found');
    if (req.status !== 'submitted') throw new BadRequestException('Request is not in submitted status');

    // Release pending balance
    const year = req.startDate.getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { userId_leaveTypeId_year: { userId: req.userId, leaveTypeId: req.leaveTypeId, year } },
    });
    if (balance) {
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { decrement: Number(req.totalDays) } },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'rejected', rejectedAt: new Date() },
    });
  }
}
