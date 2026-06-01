import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReimbursementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: string;
    claimantUserId?: string;
    companyId?: string;
    page?: number;
    limit?: number;
  }) {
    return { items: [], total: 0, page: params.page ?? 1, limit: params.limit ?? 20 };
  }

  async findOne(id: string) {
    return null;
  }

  async create(dto: any) {
    return {};
  }

  async update(id: string, dto: any) {
    return {};
  }

  async submit(id: string) {
    return {};
  }

  async cancel(id: string) {
    return {};
  }

  async pay(id: string) {
    return {};
  }
}
