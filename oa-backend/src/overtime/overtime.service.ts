import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

function generateRequestNo(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `OT-${ym}-${rand}`;
}

@Injectable()
export class OvertimeService {
  constructor(private readonly prisma: PrismaService) {}

  /** 查詢列表（員工視角：只看自己的且未刪除；HR視角：全部含已刪除） */
  async findAll(params: {
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    month?: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { userId, status, startDate, endDate, month, includeDeleted = false, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.overtimeDate = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    } else if (startDate || endDate) {
      where.overtimeDate = {};
      if (startDate) where.overtimeDate.gte = new Date(startDate);
      if (endDate) where.overtimeDate.lte = new Date(endDate);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.overtimeRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { overtimeDate: 'desc' },
        include: {
          user: { select: { id: true, employeeNo: true, displayName: true } },
          approver: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.overtimeRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const req = await this.prisma.overtimeRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, employeeNo: true, displayName: true } },
        approver: { select: { id: true, displayName: true } },
      },
    });
    if (!req) throw new NotFoundException('加班申請不存在');
    return req;
  }

  async create(userId: string, dto: {
    overtimeDate: string;
    startTime: string;
    endTime: string;
    overtimeType: string;
    compensationType: string;
    reason?: string;
  }) {
    const [startH, startM] = dto.startTime.split(':').map(Number);
    const [endH, endM] = dto.endTime.split(':').map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes <= 0) throw new BadRequestException('結束時間必須晚於開始時間');
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

    // startTime/endTime store as time-of-day using a fixed date base
    const baseDate = new Date(dto.overtimeDate);
    const startDateTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), startH, startM);
    const endDateTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), endH, endM);

    return this.prisma.overtimeRequest.create({
      data: {
        requestNo: generateRequestNo(),
        userId,
        overtimeDate: new Date(dto.overtimeDate),
        startTime: startDateTime,
        endTime: endDateTime,
        totalHours,
        overtimeType: dto.overtimeType,
        compensationType: dto.compensationType,
        reason: dto.reason,
        status: 'submitted',
        submittedAt: new Date(),
        createdBy: userId,
      },
    });
  }

  async update(id: string, userId: string, dto: Partial<{
    overtimeDate: string;
    startTime: string;
    endTime: string;
    overtimeType: string;
    compensationType: string;
    reason: string;
  }>) {
    const req = await this.findOne(id);
    if (req.userId !== userId) throw new ForbiddenException('只有申請人可以修改');
    if (req.status !== 'submitted') throw new BadRequestException('只有待審核的申請可以修改');

    const data: any = {};
    if (dto.overtimeDate) data.overtimeDate = new Date(dto.overtimeDate);
    if (dto.overtimeType) data.overtimeType = dto.overtimeType;
    if (dto.compensationType) data.compensationType = dto.compensationType;
    if (dto.reason !== undefined) data.reason = dto.reason;

    if (dto.startTime || dto.endTime) {
      const baseDate = dto.overtimeDate ? new Date(dto.overtimeDate) : req.overtimeDate;
      if (dto.startTime) {
        const [h, m] = dto.startTime.split(':').map(Number);
        data.startTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m);
      }
      if (dto.endTime) {
        const [h, m] = dto.endTime.split(':').map(Number);
        data.endTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m);
      }
      if (data.startTime && data.endTime) {
        const totalMinutes = (data.endTime.getHours() * 60 + data.endTime.getMinutes()) - (data.startTime.getHours() * 60 + data.startTime.getMinutes());
        data.totalHours = parseFloat((totalMinutes / 60).toFixed(1));
      }
    }

    return this.prisma.overtimeRequest.update({ where: { id }, data });
  }

  /** 員工軟刪除自己的未完成申請 */
  async softDelete(id: string, userId: string) {
    const req = await this.findOne(id);
    if (req.userId !== userId) throw new ForbiddenException('只有申請人可以刪除');
    if (!['submitted', 'draft'].includes(req.status)) {
      throw new BadRequestException('只有待審核的申請可以刪除');
    }
    if (req.deletedAt) throw new BadRequestException('申請已被刪除');

    return this.prisma.overtimeRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** HR 核准 */
  async approve(id: string, operatorId: string) {
    const req = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('加班申請不存在');
    if (req.status !== 'submitted') throw new BadRequestException('申請狀態不是待審核');

    return this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: operatorId,
      },
    });
  }

  /** HR 駁回 */
  async reject(id: string, operatorId: string, reason: string) {
    const req = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('加班申請不存在');
    if (req.status !== 'submitted') throw new BadRequestException('申請狀態不是待審核');

    return this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        approvedBy: operatorId,
        rejectedReason: reason,
      },
    });
  }
}
