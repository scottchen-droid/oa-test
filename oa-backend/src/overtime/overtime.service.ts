import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OvertimeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    userId?: string;
    status?: string;
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

  async remove(id: string) {
    return {};
  }
}
