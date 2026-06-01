import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_FORM_TYPES = ['asset_request', 'meal_allowance', 'it_request', 'headcount_request', 'resignation'];

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(submitterUserId: string, dto: { formType: string; content: Record<string, unknown> }) {
    if (!VALID_FORM_TYPES.includes(dto.formType)) {
      throw new BadRequestException(`Invalid formType: ${dto.formType}`);
    }
    return this.prisma.oaFormRequest.create({
      data: {
        formType: dto.formType,
        submitterUserId,
        content: (dto.content ?? {}) as any,
        status: 'pending',
      },
    });
  }

  async findMyRequests(submitterUserId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.oaFormRequest.findMany({
        where: { submitterUserId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.oaFormRequest.count({ where: { submitterUserId } }),
    ]);

    return { items, total, page, limit };
  }
}
