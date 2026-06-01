import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── HR view: all employees ────────────────────────────────────────────────

  async findAllRecords(params: {
    userId?: string;
    deptId?: string;
    companyId?: string;
    status?: string;
    month?: string;     // YYYY-MM
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, deptId, companyId, status, month, startDate, endDate, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (status) where.status = status;

    // date range
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.workDate = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    } else {
      if (startDate || endDate) {
        where.workDate = {};
        if (startDate) where.workDate.gte = new Date(startDate);
        if (endDate) where.workDate.lte = new Date(endDate);
      }
    }

    // filter by dept/company via org assignment join
    if (deptId || companyId) {
      where.user = {
        orgAssignments: {
          some: {
            isPrimary: true,
            ...(deptId ? { departmentId: deptId } : {}),
            ...(companyId ? { companyId } : {}),
          },
        },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              employeeNo: true,
              displayName: true,
              orgAssignments: {
                where: { isPrimary: true },
                select: { department: { select: { name: true } } },
              },
            },
          },
          clockRecords: { orderBy: { clockTime: 'asc' } },
        },
        orderBy: [{ workDate: 'desc' }, { userId: 'asc' }],
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findSummary(params: { month?: string; deptId?: string; companyId?: string }) {
    const { month, deptId, companyId } = params;

    const dateWhere: any = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      dateWhere.workDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const userWhere: any = {};
    if (deptId || companyId) {
      userWhere.user = {
        orgAssignments: {
          some: {
            isPrimary: true,
            ...(deptId ? { departmentId: deptId } : {}),
            ...(companyId ? { companyId } : {}),
          },
        },
      };
    }

    const where = { ...dateWhere, ...userWhere };

    const [total, normalCount, lateCount, absentCount, leaveCount] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.count({ where: { ...where, status: 'normal' } }),
      this.prisma.attendanceRecord.count({ where: { ...where, status: 'late' } }),
      this.prisma.attendanceRecord.count({ where: { ...where, status: 'absent' } }),
      this.prisma.attendanceRecord.count({ where: { ...where, status: 'leave' } }),
    ]);

    const overtimeAgg = await this.prisma.attendanceRecord.aggregate({
      where,
      _sum: { overtimeMinutes: true },
    });

    return {
      total,
      normalCount,
      lateCount,
      absentCount,
      leaveCount,
      totalOvertimeMinutes: overtimeAgg._sum.overtimeMinutes ?? 0,
    };
  }

  async findOneRecord(id: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, employeeNo: true, displayName: true } },
        clockRecords: { orderBy: { clockTime: 'asc' } },
      },
    });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async updateRecord(id: string, dto: { actualClockIn?: string; actualClockOut?: string; status?: string; note?: string }) {
    const record = await this.prisma.attendanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');

    const data: any = {};
    if (dto.actualClockIn) data.actualClockIn = new Date(dto.actualClockIn);
    if (dto.actualClockOut) data.actualClockOut = new Date(dto.actualClockOut);
    if (dto.status) data.status = dto.status;
    if (dto.note !== undefined) data.note = dto.note;

    return this.prisma.attendanceRecord.update({ where: { id }, data });
  }

  // ─── Employee self-service ─────────────────────────────────────────────────

  async findTodayStatus(userId: string) {
    const today = new Date();
    const workDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const record = await this.prisma.attendanceRecord.findUnique({
      where: { userId_workDate: { userId, workDate } },
      include: { clockRecords: { orderBy: { clockTime: 'asc' } } },
    });

    return record ?? { userId, workDate, status: 'normal', clockRecords: [] };
  }

  async findMyRecords(userId: string, params: { month?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { month, startDate, endDate, page = 1, limit = 31 } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.workDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    } else if (startDate || endDate) {
      where.workDate = {};
      if (startDate) where.workDate.gte = new Date(startDate);
      if (endDate) where.workDate.lte = new Date(endDate);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        include: { clockRecords: { orderBy: { clockTime: 'asc' } } },
        orderBy: { workDate: 'desc' },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findMyClockPatches(userId: string, params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId, isManual: true };
    if (status === 'pending') where.approvedBy = null;
    else if (status === 'approved') where.approvedBy = { not: null };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.clockRecord.findMany({
        where,
        skip,
        take: limit,
        include: { approver: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clockRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async clockIn(userId: string, dto: { clockMethod?: string; latitude?: number; longitude?: number; locationName?: string; ipAddress?: string }) {
    const now = new Date();
    const workDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check no existing clock-in today
    const existingClockIn = await this.prisma.clockRecord.findFirst({
      where: { userId, clockType: 'clock_in', clockTime: { gte: workDate } },
    });
    if (existingClockIn) throw new ConflictException('Already clocked in today');

    // Get or create attendance record
    let record = await this.prisma.attendanceRecord.findUnique({
      where: { userId_workDate: { userId, workDate } },
    });
    if (!record) {
      record = await this.prisma.attendanceRecord.create({
        data: { userId, workDate, status: 'normal' },
      });
    }

    const clockRecord = await this.prisma.clockRecord.create({
      data: {
        userId,
        attendanceRecordId: record.id,
        clockType: 'clock_in',
        clockTime: now,
        clockMethod: dto.clockMethod ?? 'web',
        latitude: dto.latitude ? String(dto.latitude) as any : undefined,
        longitude: dto.longitude ? String(dto.longitude) as any : undefined,
        locationName: dto.locationName,
        ipAddress: dto.ipAddress,
      },
    });

    await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { actualClockIn: now },
    });

    return { message: 'Clocked in successfully', clockTime: now, clockRecord };
  }

  async clockOut(userId: string, dto: { clockMethod?: string; latitude?: number; longitude?: number; ipAddress?: string }) {
    const now = new Date();
    const workDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const record = await this.prisma.attendanceRecord.findUnique({
      where: { userId_workDate: { userId, workDate } },
    });
    if (!record || !record.actualClockIn) {
      throw new BadRequestException('Must clock in before clocking out');
    }

    // Prevent double clock-out
    const existingClockOut = await this.prisma.clockRecord.findFirst({
      where: { userId, clockType: 'clock_out', clockTime: { gte: workDate } },
    });
    if (existingClockOut) throw new ConflictException('Already clocked out today');

    const clockRecord = await this.prisma.clockRecord.create({
      data: {
        userId,
        attendanceRecordId: record.id,
        clockType: 'clock_out',
        clockTime: now,
        clockMethod: dto.clockMethod ?? 'web',
        latitude: dto.latitude ? String(dto.latitude) as any : undefined,
        longitude: dto.longitude ? String(dto.longitude) as any : undefined,
        ipAddress: dto.ipAddress,
      },
    });

    const workMinutes = Math.round((now.getTime() - record.actualClockIn.getTime()) / 60000);

    await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { actualClockOut: now, workMinutes: Math.max(workMinutes, 0) },
    });

    return { message: 'Clocked out successfully', clockTime: now, clockRecord, workMinutes };
  }

  // ─── Clock-patch (manual clock records) ───────────────────────────────────

  async findAllClockRecords(params: { userId?: string; date?: string }) {
    const { userId, date } = params;
    const where: any = {};
    if (userId) where.userId = userId;
    if (date) {
      const d = new Date(date);
      where.clockTime = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }
    const items = await this.prisma.clockRecord.findMany({
      where,
      include: { user: { select: { id: true, employeeNo: true, displayName: true } } },
      orderBy: { clockTime: 'desc' },
    });
    return { items, total: items.length };
  }

  async findClockPatches(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = { isManual: true };
    if (status === 'pending') where.approvedBy = null;
    if (status === 'approved') where.approvedBy = { not: null };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.clockRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, employeeNo: true, displayName: true } },
          approver: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clockRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async approveClockPatch(id: string, operatorId: string) {
    const record = await this.prisma.clockRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Clock record not found');
    if (!record.isManual) throw new BadRequestException('Not a manual clock record');

    return this.prisma.clockRecord.update({
      where: { id },
      data: { approvedBy: operatorId, approvedAt: new Date() },
    });
  }

  async rejectClockPatch(id: string, reason: string, operatorId: string) {
    const record = await this.prisma.clockRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Clock record not found');

    return this.prisma.clockRecord.update({
      where: { id },
      data: { manualReason: `[REJECTED] ${reason}`, approvedBy: operatorId, approvedAt: new Date() },
    });
  }

  async createClockPatch(userId: string, dto: {
    clockType: string;
    clockTime: string;
    reason: string;
    ipAddress?: string;
  }) {
    const clockTime = new Date(dto.clockTime);
    const workDate = new Date(clockTime.getFullYear(), clockTime.getMonth(), clockTime.getDate());

    let record = await this.prisma.attendanceRecord.findUnique({
      where: { userId_workDate: { userId, workDate } },
    });
    if (!record) {
      record = await this.prisma.attendanceRecord.create({ data: { userId, workDate, status: 'normal' } });
    }

    return this.prisma.clockRecord.create({
      data: {
        userId,
        attendanceRecordId: record.id,
        clockType: dto.clockType,
        clockTime,
        clockMethod: 'manual',
        isManual: true,
        manualReason: dto.reason,
        ipAddress: dto.ipAddress,
      },
    });
  }
}
