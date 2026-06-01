import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Payroll Periods ───────────────────────────────────────────────────────

  async findAllPeriods(params: { year?: number; status?: string; page?: number; limit?: number }) {
    const { year, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (year) where.year = Number(year);
    if (status) where.status = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payrollPeriod.findMany({
        where,
        skip,
        take: limit,
        include: { _count: { select: { payrollRecords: true } } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.payrollPeriod.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOnePeriod(id: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        payrollRecords: {
          include: { user: { select: { id: true, employeeNo: true, displayName: true } } },
          orderBy: { user: { displayName: 'asc' } },
        },
      },
    });
    if (!period) throw new NotFoundException('Payroll period not found');
    return period;
  }

  async createPeriod(dto: { year: number; month: number; periodStart: string; periodEnd: string; payDate?: string }) {
    const existing = await this.prisma.payrollPeriod.findUnique({
      where: { year_month: { year: Number(dto.year), month: Number(dto.month) } },
    });
    if (existing) throw new ConflictException('Payroll period already exists for this year/month');

    return this.prisma.payrollPeriod.create({
      data: {
        year: Number(dto.year),
        month: Number(dto.month),
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        payDate: dto.payDate ? new Date(dto.payDate) : undefined,
        status: 'draft',
      },
    });
  }

  async updatePeriod(id: string, dto: { payDate?: string; status?: string }) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === 'locked' || period.status === 'paid') {
      throw new BadRequestException('Cannot modify a locked or paid period');
    }

    const data: any = {};
    if (dto.payDate) data.payDate = new Date(dto.payDate);
    if (dto.status) data.status = dto.status;

    return this.prisma.payrollPeriod.update({ where: { id }, data });
  }

  async lockPeriod(id: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === 'locked') throw new ConflictException('Period is already locked');

    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: 'locked', lockedAt: new Date() },
    });
  }

  // ─── Payroll Records ───────────────────────────────────────────────────────

  async findAllRecords(params: { periodId?: string; userId?: string; page?: number; limit?: number }) {
    const { periodId, userId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (periodId) where.payrollPeriodId = periodId;
    if (userId) where.userId = userId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payrollRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, employeeNo: true, displayName: true } },
          payrollPeriod: { select: { year: true, month: true } },
        },
        orderBy: [{ payrollPeriod: { year: 'desc' } }, { payrollPeriod: { month: 'desc' } }],
      }),
      this.prisma.payrollRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async calculateRecords(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status === 'locked') throw new BadRequestException('Cannot calculate for a locked period');

    // Get all active employees with salary structures
    const structures = await this.prisma.salaryStructure.findMany({
      where: { endDate: null },
      include: { user: { select: { id: true, status: true } } },
    });

    let count = 0;
    for (const structure of structures) {
      if (structure.user.status !== 'active') continue;

      const allowances = (structure.allowances as Record<string, number>) ?? {};
      const totalAllowances = Object.values(allowances).reduce((sum, v) => sum + (Number(v) || 0), 0);
      const grossSalary = Number(structure.baseSalary) + totalAllowances;
      const netSalary = grossSalary;

      await this.prisma.payrollRecord.upsert({
        where: { payrollPeriodId_userId: { payrollPeriodId: periodId, userId: structure.userId } },
        create: {
          payrollPeriodId: periodId,
          userId: structure.userId,
          salaryStructureId: structure.id,
          currencyCode: structure.currencyCode,
          baseSalary: structure.baseSalary,
          totalAllowances,
          grossSalary,
          netSalary,
          status: 'draft',
        },
        update: {
          salaryStructureId: structure.id,
          baseSalary: structure.baseSalary,
          totalAllowances,
          grossSalary,
          netSalary,
        },
      });
      count++;
    }

    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'calculating' },
    });

    return { message: `Calculated payroll for ${count} employees`, count };
  }

  // ─── Salary Structures ─────────────────────────────────────────────────────

  async findAllStructures(params: { userId?: string; page?: number; limit?: number }) {
    const { userId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.salaryStructure.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, employeeNo: true, displayName: true } } },
        orderBy: { effectiveDate: 'desc' },
      }),
      this.prisma.salaryStructure.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createStructure(operatorId: string, dto: {
    userId: string;
    currencyCode: string;
    baseSalary: number;
    allowances?: Record<string, number>;
    effectiveDate: string;
    changeReason?: string;
  }) {
    // End any currently active structure
    await this.prisma.salaryStructure.updateMany({
      where: { userId: dto.userId, endDate: null },
      data: { endDate: new Date(dto.effectiveDate) },
    });

    return this.prisma.salaryStructure.create({
      data: {
        userId: dto.userId,
        currencyCode: dto.currencyCode,
        baseSalary: dto.baseSalary,
        allowances: dto.allowances ?? {},
        effectiveDate: new Date(dto.effectiveDate),
        changeReason: dto.changeReason,
        createdBy: operatorId,
      },
    });
  }

  async updateStructure(id: string, dto: Partial<{
    baseSalary: number;
    allowances: Record<string, number>;
    payDate: string;
    changeReason: string;
  }>) {
    const structure = await this.prisma.salaryStructure.findUnique({ where: { id } });
    if (!structure) throw new NotFoundException('Salary structure not found');

    const data: any = {};
    if (dto.baseSalary !== undefined) data.baseSalary = dto.baseSalary;
    if (dto.allowances !== undefined) data.allowances = dto.allowances;
    if (dto.changeReason !== undefined) data.changeReason = dto.changeReason;

    return this.prisma.salaryStructure.update({ where: { id }, data });
  }

  // ─── Employee payslip (self-service) ──────────────────────────────────────

  async findMyPayslips(userId: string, year?: number) {
    const where: any = { userId };
    if (year) where.payrollPeriod = { year: Number(year) };

    const items = await this.prisma.payrollRecord.findMany({
      where,
      include: { payrollPeriod: { select: { year: true, month: true, payDate: true } } },
      orderBy: [{ payrollPeriod: { year: 'desc' } }, { payrollPeriod: { month: 'desc' } }],
    });

    return { items, total: items.length };
  }
}
