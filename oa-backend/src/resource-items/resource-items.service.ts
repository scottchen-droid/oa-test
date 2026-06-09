import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourceItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { isEnabled?: boolean }) {
    const where: Record<string, unknown> = {};
    if (params.isEnabled !== undefined) {
      where['isEnabled'] = params.isEnabled;
    }
    return this.prisma.resourceItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.resourceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Resource item not found');
    return item;
  }

  async create(dto: {
    code: string;
    name: string;
    category: string;
    responsibleUnit?: string;
    availableOnOnboard?: boolean;
    requiredOnOffboard?: boolean;
    availableOnAdd?: boolean;
    availableOnChange?: boolean;
    requiresAccountFill?: boolean;
    requiresAttachment?: boolean;
    isEnabled?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.resourceItem.create({ data: dto });
  }

  async update(
    id: string,
    dto: {
      code?: string;
      name?: string;
      category?: string;
      responsibleUnit?: string;
      availableOnOnboard?: boolean;
      requiredOnOffboard?: boolean;
      availableOnAdd?: boolean;
      availableOnChange?: boolean;
      requiresAccountFill?: boolean;
      requiresAttachment?: boolean;
      isEnabled?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.findById(id);
    return this.prisma.resourceItem.update({ where: { id }, data: dto });
  }

  async toggleEnabled(id: string) {
    const item = await this.findById(id);
    return this.prisma.resourceItem.update({
      where: { id },
      data: { isEnabled: !item.isEnabled },
    });
  }
}
