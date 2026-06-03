import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

const ALGORITHM = 'aes-256-gcm';

@Injectable()
export class EmployeesService {
  private readonly encKey: Buffer;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const key = this.config.get<string>('encryption.key') || '12345678901234567890123456789012';
    this.encKey = Buffer.from(key.padEnd(32).slice(0, 32), 'utf8');
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decrypt(encoded: string): string {
    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encKey, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  async findAll(query: {
    search?: string;
    status?: string;
    companyId?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status, companyId, departmentId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
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
          status: true,
          avatarUrl: true,
          createdAt: true,
          employeeProfile: {
            select: {
              hireDate: true,
              employmentType: true,
            },
          },
          orgAssignments: {
            where: { isPrimary: true },
            select: {
              company: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
              position: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        employeeNo: true,
        email: true,
        displayName: true,
        nameZh: true,
        nameEn: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        employeeProfile: true,
        orgAssignments: {
          include: {
            region: true,
            company: true,
            department: true,
            businessUnit: true,
            project: true,
            position: true,
            jobLevel: true,
            directManager: { select: { id: true, displayName: true } },
          },
        },
        userRoles: {
          select: { role: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('Employee not found');
    return user;
  }

  async create(dto: {
    email: string;
    displayName: string;
    nameZh?: string;
    nameEn?: string;
    employeeNo?: string;
    hireDate?: string;
    employmentType?: string;
    mobilePhone?: string;
    gender?: string;
    // org assignment
    regionId?: string;
    companyId?: string;
    businessUnitId?: string;
    projectId?: string;
    departmentId?: string;
    positionId?: string;
    jobLevelId?: string;
    directManagerUserId?: string;
  }) {
    const {
      email, displayName, nameZh, nameEn, employeeNo, hireDate, employmentType,
      mobilePhone, gender,
      regionId, companyId, businessUnitId, projectId, departmentId, positionId, jobLevelId, directManagerUserId,
    } = dto;

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const resetToken = crypto.randomBytes(32).toString('hex');

    const hasOrgData = companyId || regionId || businessUnitId || projectId || departmentId || positionId || jobLevelId;

    const user = await this.prisma.user.create({
      data: {
        email,
        displayName,
        nameZh,
        nameEn,
        employeeNo,
        passwordHash,
        passwordResetToken: resetToken,
        passwordResetExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending_activation',
        employeeProfile: {
          create: {
            hireDate: hireDate ? new Date(hireDate) : undefined,
            employmentType: employmentType || 'full_time',
            mobilePhone,
            gender,
          },
        },
      },
      select: { id: true, email: true, displayName: true, employeeNo: true, status: true, createdAt: true },
    });

    if (hasOrgData) {
      await this.prisma.userOrgAssignment.create({
        data: {
          userId: user.id,
          regionId: regionId || null,
          companyId: companyId || null,
          businessUnitId: businessUnitId || null,
          projectId: projectId || null,
          departmentId: departmentId || null,
          positionId: positionId || null,
          jobLevelId: jobLevelId || null,
          directManagerUserId: directManagerUserId || null,
          isPrimary: true,
          assignmentType: 'primary',
          isActive: true,
          startedAt: hireDate ? new Date(hireDate) : new Date(),
        },
      });
    }

    return user;
  }

  async updateOrgAssignment(userId: string, dto: {
    regionId?: string;
    companyId?: string;
    businessUnitId?: string;
    projectId?: string;
    departmentId?: string;
    positionId?: string;
    jobLevelId?: string;
    directManagerUserId?: string;
    assignmentType?: string;
  }) {
    const existing = await this.prisma.userOrgAssignment.findFirst({
      where: { userId, isPrimary: true },
    });

    const data = {
      regionId: dto.regionId || null,
      companyId: dto.companyId || null,
      businessUnitId: dto.businessUnitId || null,
      projectId: dto.projectId || null,
      departmentId: dto.departmentId || null,
      positionId: dto.positionId || null,
      jobLevelId: dto.jobLevelId || null,
      directManagerUserId: dto.directManagerUserId || null,
      assignmentType: dto.assignmentType || 'primary',
    };

    if (existing) {
      await this.prisma.userOrgAssignment.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.userOrgAssignment.create({
        data: { userId, isPrimary: true, isActive: true, ...data },
      });
    }

    return this.findOne(userId);
  }

  async update(userId: string, dto: any) {
    const { email, displayName, nameZh, nameEn, avatarUrl, employeeNo, status, ...profileData } = dto;

    const userUpdate: any = {};
    if (email) userUpdate.email = email;
    if (displayName) userUpdate.displayName = displayName;
    if (nameZh !== undefined) userUpdate.nameZh = nameZh;
    if (nameEn !== undefined) userUpdate.nameEn = nameEn;
    if (avatarUrl !== undefined) userUpdate.avatarUrl = avatarUrl;
    if (employeeNo !== undefined) userUpdate.employeeNo = employeeNo;
    if (status !== undefined) userUpdate.status = status;

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: userUpdate });
    }

    if (Object.keys(profileData).length > 0) {
      await this.prisma.employeeProfile.upsert({
        where: { userId },
        create: { userId, ...profileData },
        update: profileData,
      });
    }

    return this.findOne(userId);
  }

  async updateSensitiveData(userId: string, dto: {
    idNumber?: string;
    passportNo?: string;
    bankAccountNo?: string;
    bankName?: string;
    bankBranch?: string;
  }) {
    const data: any = {};
    if (dto.idNumber) data.idNumber = this.encrypt(dto.idNumber);
    if (dto.passportNo) data.passportNo = this.encrypt(dto.passportNo);
    if (dto.bankAccountNo) data.bankAccountNo = this.encrypt(dto.bankAccountNo);
    if (dto.bankName) data.bankName = dto.bankName;
    if (dto.bankBranch) data.bankBranch = dto.bankBranch;

    return this.prisma.employeeProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async offboard(userId: string, dto: {
    resignationDate: string;
    lastWorkingDate: string;
    terminationType: string;
    terminationReason?: string;
  }) {
    await this.prisma.$transaction([
      this.prisma.employeeProfile.upsert({
        where: { userId },
        create: {
          userId,
          resignationDate: new Date(dto.resignationDate),
          lastWorkingDate: new Date(dto.lastWorkingDate),
          terminationType: dto.terminationType,
          terminationReason: dto.terminationReason,
        },
        update: {
          resignationDate: new Date(dto.resignationDate),
          lastWorkingDate: new Date(dto.lastWorkingDate),
          terminationType: dto.terminationType,
          terminationReason: dto.terminationReason,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'resigned' },
      }),
    ]);

    return { message: 'Employee offboarded successfully' };
  }
}
