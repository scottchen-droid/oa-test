import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Performance Cycles ───────────────────────────────────────────────────

  async findAllCycles(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.performanceCycle.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { goals: true, reviews: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.performanceCycle.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOneCycle(id: string) {
    const cycle = await this.prisma.performanceCycle.findUnique({
      where: { id },
      include: {
        _count: { select: { goals: true, reviews: true } },
      },
    });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    return cycle;
  }

  async createCycle(dto: {
    code: string;
    name: string;
    cycleType: string;
    startDate: string;
    endDate: string;
    goalSettingStart?: string;
    goalSettingEnd?: string;
    reviewStartDate?: string;
    reviewEndDate?: string;
  }) {
    return this.prisma.performanceCycle.create({
      data: {
        code: dto.code,
        name: dto.name,
        cycleType: dto.cycleType,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        goalSettingStart: dto.goalSettingStart ? new Date(dto.goalSettingStart) : undefined,
        goalSettingEnd: dto.goalSettingEnd ? new Date(dto.goalSettingEnd) : undefined,
        reviewStartDate: dto.reviewStartDate ? new Date(dto.reviewStartDate) : undefined,
        reviewEndDate: dto.reviewEndDate ? new Date(dto.reviewEndDate) : undefined,
        status: 'draft',
      },
    });
  }

  async updateCycle(id: string, dto: Partial<{
    name: string;
    goalSettingStart: string;
    goalSettingEnd: string;
    reviewStartDate: string;
    reviewEndDate: string;
    status: string;
  }>) {
    const cycle = await this.prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.goalSettingStart) data.goalSettingStart = new Date(dto.goalSettingStart);
    if (dto.goalSettingEnd) data.goalSettingEnd = new Date(dto.goalSettingEnd);
    if (dto.reviewStartDate) data.reviewStartDate = new Date(dto.reviewStartDate);
    if (dto.reviewEndDate) data.reviewEndDate = new Date(dto.reviewEndDate);
    if (dto.status) data.status = dto.status;

    return this.prisma.performanceCycle.update({ where: { id }, data });
  }

  async activateCycle(id: string) {
    const cycle = await this.prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    if (cycle.status !== 'draft') throw new BadRequestException('Only draft cycles can be activated');

    return this.prisma.performanceCycle.update({
      where: { id },
      data: { status: 'goal_setting' },
    });
  }

  async completeCycle(id: string) {
    const cycle = await this.prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');

    return this.prisma.performanceCycle.update({
      where: { id },
      data: { status: 'completed' },
    });
  }

  // ─── Performance Goals ────────────────────────────────────────────────────

  async findAllGoals(params: { cycleId?: string; userId?: string; page?: number; limit?: number }) {
    const { cycleId, userId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (cycleId) where.performanceCycleId = cycleId;
    if (userId) where.userId = userId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.performanceGoal.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, employeeNo: true, displayName: true } },
          cycle: { select: { id: true, name: true, cycleType: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.performanceGoal.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createGoal(userId: string, dto: {
    performanceCycleId: string;
    title: string;
    description?: string;
    targetValue?: string;
    weight?: number;
  }) {
    const cycle = await this.prisma.performanceCycle.findUnique({ where: { id: dto.performanceCycleId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    if (!['goal_setting', 'reviewing'].includes(cycle.status)) {
      throw new BadRequestException('Goals can only be added during goal_setting or reviewing phase');
    }

    return this.prisma.performanceGoal.create({
      data: {
        performanceCycleId: dto.performanceCycleId,
        userId,
        title: dto.title,
        description: dto.description,
        targetValue: dto.targetValue,
        weight: dto.weight ?? 100,
        status: 'draft',
      },
    });
  }

  async updateGoal(id: string, userId: string, dto: Partial<{
    title: string;
    description: string;
    targetValue: string;
    weight: number;
    selfAssessment: string;
    selfRating: number;
    managerAssessment: string;
    managerRating: number;
    status: string;
  }>) {
    const goal = await this.prisma.performanceGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Performance goal not found');

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.targetValue !== undefined) data.targetValue = dto.targetValue;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.selfAssessment !== undefined) data.selfAssessment = dto.selfAssessment;
    if (dto.selfRating !== undefined) data.selfRating = dto.selfRating;
    if (dto.managerAssessment !== undefined) data.managerAssessment = dto.managerAssessment;
    if (dto.managerRating !== undefined) data.managerRating = dto.managerRating;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.performanceGoal.update({ where: { id }, data });
  }

  // ─── Performance Reviews ──────────────────────────────────────────────────

  async findAllReviews(params: {
    cycleId?: string;
    revieweeUserId?: string;
    reviewerUserId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { cycleId, revieweeUserId, reviewerUserId, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (cycleId) where.performanceCycleId = cycleId;
    if (revieweeUserId) where.revieweeUserId = revieweeUserId;
    if (reviewerUserId) where.reviewerUserId = reviewerUserId;
    if (status) where.status = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.performanceReview.findMany({
        where,
        skip,
        take: limit,
        include: {
          cycle: { select: { id: true, name: true, cycleType: true } },
          reviewee: { select: { id: true, employeeNo: true, displayName: true } },
          reviewer: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.performanceReview.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createReview(reviewerUserId: string, dto: {
    performanceCycleId: string;
    revieweeUserId: string;
    overallComment?: string;
    finalRating?: number;
    ratingLabel?: string;
  }) {
    const cycle = await this.prisma.performanceCycle.findUnique({ where: { id: dto.performanceCycleId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');

    return this.prisma.performanceReview.create({
      data: {
        performanceCycleId: dto.performanceCycleId,
        revieweeUserId: dto.revieweeUserId,
        reviewerUserId,
        overallComment: dto.overallComment,
        finalRating: dto.finalRating,
        ratingLabel: dto.ratingLabel,
        status: 'pending',
      },
    });
  }

  async updateReview(id: string, dto: Partial<{
    overallComment: string;
    finalRating: number;
    ratingLabel: string;
    status: string;
  }>) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Performance review not found');

    const data: any = {};
    if (dto.overallComment !== undefined) data.overallComment = dto.overallComment;
    if (dto.finalRating !== undefined) data.finalRating = dto.finalRating;
    if (dto.ratingLabel !== undefined) data.ratingLabel = dto.ratingLabel;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'completed') data.completedAt = new Date();
    }

    return this.prisma.performanceReview.update({ where: { id }, data });
  }
}
