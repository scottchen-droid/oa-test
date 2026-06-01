import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

export class BootstrapDto {
  email: string;
  displayName: string;
  password: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getBootstrapStatus() {
    const count = await this.prisma.user.count({ where: { isSuperAdmin: true } });
    return { needed: count === 0 };
  }

  async bootstrap(dto: BootstrapDto) {
    const { needed } = await this.getBootstrapStatus();
    if (!needed) {
      throw new ConflictException('Super admin already exists. Bootstrap is disabled.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
        isSuperAdmin: true,
        status: 'active',
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        isSuperAdmin: true,
        status: true,
        createdAt: true,
      },
    });

    return { message: 'Super admin created successfully', user };
  }
}
