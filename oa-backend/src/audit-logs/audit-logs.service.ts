import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    operatorUserId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return { items: [], total: 0, page: params.page ?? 1, limit: params.limit ?? 20 };
  }

  async findOne(id: string) {
    return null;
  }
}
