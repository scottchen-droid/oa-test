import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  QueryUsersDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { search, status, companyId, departmentId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { nameZh: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;

    if (companyId || departmentId) {
      where.orgAssignments = {
        some: {
          ...(companyId ? { companyId } : {}),
          ...(departmentId ? { departmentId } : {}),
          isPrimary: true,
        },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          employeeNo: true,
          email: true,
          displayName: true,
          nameZh: true,
          nameEn: true,
          status: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
          orgAssignments: {
            where: { isPrimary: true },
            select: {
              company: { select: { id: true, name: true, region: { select: { id: true, name: true, defaultLocale: true } } } },
              department: { select: { id: true, name: true } },
              position: { select: { id: true, name: true } },
            },
          },
          userRoles: {
            select: { role: { select: { id: true, code: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeNo: true,
        email: true,
        displayName: true,
        nameZh: true,
        nameEn: true,
        avatarUrl: true,
        status: true,
        authProvider: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
        employeeProfile: true,
        orgAssignments: {
          include: {
            company: true,
            department: true,
            businessUnit: true,
            project: true,
            position: true,
            jobLevel: true,
            directManager: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
        },
        userRoles: {
          select: {
            id: true,
            scopeType: true,
            scopeId: true,
            role: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const resetToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        passwordHash,
        passwordResetToken: resetToken,
        passwordResetExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending_activation',
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        employeeNo: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        displayName: true,
        nameZh: true,
        nameEn: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, operatorId: string) {
    const user = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, status: true, updatedAt: true },
    });

    await this.prisma.systemAuditLog.create({
      data: {
        operatorUserId: operatorId,
        action: `user.status_change`,
        targetType: 'user',
        targetId: id,
        oldData: { status: (user as any).status },
        newData: { status: dto.status },
      },
    });

    return updated;
  }

  async adminResetPassword(id: string, operatorId: string) {
    await this.findOne(id);
    const resetToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.systemAuditLog.create({
      data: {
        operatorUserId: operatorId,
        action: 'user.password_reset',
        targetType: 'user',
        targetId: id,
      },
    });

    return { message: 'Password reset link generated' };
  }
}
