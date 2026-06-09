import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const VALID_FORM_TYPES = [
  'purchase_request', 'business_trip', 'asset_request', 'meal_allowance',
  'it_request', 'headcount_request', 'resignation', 'expense_reimbursement',
  'personnel_resource_request',
];

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 正式申請 ───────────────────────────────────────

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
        submittedAt: new Date(),
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

  async copyRequest(userId: string, sourceId: string) {
    const source = await this.prisma.oaFormRequest.findUnique({ where: { id: sourceId } });
    if (!source) throw new NotFoundException('申請單不存在');
    if (source.submitterUserId !== userId) throw new ForbiddenException('無法複製他人申請單');

    const { id: _id, submittedAt: _s, approvalInstanceId: _a, status: _st, createdAt: _c, updatedAt: _u, ...copyable } = source as any;
    return this.prisma.oaFormRequest.create({
      data: {
        ...copyable,
        submitterUserId: userId,
        status: 'draft',
        submittedAt: null,
        approvalInstanceId: null,
      },
    });
  }

  // ─── 草稿 ───────────────────────────────────────────

  async saveDraft(creatorUserId: string, dto: { formType: string; title?: string; content: Record<string, unknown> }) {
    if (!VALID_FORM_TYPES.includes(dto.formType)) {
      throw new BadRequestException(`Invalid formType: ${dto.formType}`);
    }
    return this.prisma.oaFormDraft.create({
      data: {
        formType: dto.formType,
        creatorUserId,
        title: dto.title,
        content: (dto.content ?? {}) as any,
      },
    });
  }

  async updateDraft(creatorUserId: string, id: string, dto: { title?: string; content?: Record<string, unknown> }) {
    const draft = await this.prisma.oaFormDraft.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException('草稿不存在');
    if (draft.creatorUserId !== creatorUserId) throw new ForbiddenException('無法修改他人草稿');

    return this.prisma.oaFormDraft.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content as any }),
      },
    });
  }

  async findMyDrafts(creatorUserId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.oaFormDraft.findMany({
        where: { creatorUserId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.oaFormDraft.count({ where: { creatorUserId } }),
    ]);

    return { items, total, page, limit };
  }

  async deleteDraft(creatorUserId: string, id: string) {
    const draft = await this.prisma.oaFormDraft.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException('草稿不存在');
    if (draft.creatorUserId !== creatorUserId) throw new ForbiddenException('無法刪除他人草稿');
    await this.prisma.oaFormDraft.delete({ where: { id } });
  }

  async submitDraft(creatorUserId: string, id: string) {
    const draft = await this.prisma.oaFormDraft.findUnique({ where: { id } });
    if (!draft) throw new NotFoundException('草稿不存在');
    if (draft.creatorUserId !== creatorUserId) throw new ForbiddenException('無法送出他人草稿');
    if (!VALID_FORM_TYPES.includes(draft.formType)) {
      throw new BadRequestException(`Invalid formType: ${draft.formType}`);
    }

    const [request] = await this.prisma.$transaction([
      this.prisma.oaFormRequest.create({
        data: {
          formType: draft.formType,
          submitterUserId: creatorUserId,
          content: draft.content as any,
          status: 'pending',
          submittedAt: new Date(),
        },
      }),
      this.prisma.oaFormDraft.delete({ where: { id } }),
    ]);

    if (draft.formType === 'personnel_resource_request') {
      await this.handlePersonnelRequestSubmit(request.id, draft.content as Record<string, unknown>);
    }

    return request;
  }

  async handlePersonnelRequestSubmit(
    formRequestId: string,
    content: Record<string, unknown>,
  ) {
    const {
      requestType,
      targetUserId,
      effectiveDate,
      reason,
      remark,
      resourceItemIds,
    } = content as {
      requestType: string;
      targetUserId: string;
      effectiveDate: string;
      reason?: string;
      remark?: string;
      resourceItemIds: string[];
    };

    await this.prisma.$transaction(async (tx) => {
      const personnelRequest = await tx.personnelResourceRequest.create({
        data: {
          formRequestId,
          requestType,
          targetUserId,
          effectiveDate: new Date(effectiveDate),
          reason,
          remark,
          status: 'pending',
        },
      });

      for (const resourceItemId of resourceItemIds ?? []) {
        await tx.personnelResourceRequestItem.create({
          data: {
            requestId: personnelRequest.id,
            resourceItemId,
          },
        });
      }
    });
  }

  async handlePersonnelRequestApproved(approvalInstanceId: string) {
    const formRequest = await this.prisma.oaFormRequest.findFirst({
      where: { approvalInstanceId },
      include: { personnelResourceRequest: true },
    });

    if (!formRequest?.personnelResourceRequest) return;

    await this.prisma.personnelResourceRequest.update({
      where: { id: formRequest.personnelResourceRequest.id },
      data: { status: 'approved' },
    });
  }

  // ─── 填寫模板 ────────────────────────────────────────

  async createFillTemplate(creatorUserId: string, dto: { formType: string; name: string; description?: string; content: Record<string, unknown>; isFavorite?: boolean }) {
    if (!VALID_FORM_TYPES.includes(dto.formType)) {
      throw new BadRequestException(`Invalid formType: ${dto.formType}`);
    }
    return this.prisma.oaFillTemplate.create({
      data: {
        formType: dto.formType,
        creatorUserId,
        name: dto.name,
        description: dto.description,
        content: (dto.content ?? {}) as any,
        isFavorite: dto.isFavorite ?? false,
      },
    });
  }

  async updateFillTemplate(creatorUserId: string, id: string, dto: { name?: string; description?: string; content?: Record<string, unknown>; isFavorite?: boolean; isEnabled?: boolean }) {
    const tmpl = await this.prisma.oaFillTemplate.findUnique({ where: { id } });
    if (!tmpl) throw new NotFoundException('填寫模板不存在');
    if (tmpl.creatorUserId !== creatorUserId) throw new ForbiddenException('無法修改他人填寫模板');

    return this.prisma.oaFillTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.content !== undefined && { content: dto.content as any }),
        ...(dto.isFavorite !== undefined && { isFavorite: dto.isFavorite }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
      },
    });
  }

  async findMyFillTemplates(creatorUserId: string, params: { formType?: string; page?: number; limit?: number }) {
    const { formType, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where = { creatorUserId, ...(formType && { formType }) };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.oaFillTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.oaFillTemplate.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async deleteFillTemplate(creatorUserId: string, id: string) {
    const tmpl = await this.prisma.oaFillTemplate.findUnique({ where: { id } });
    if (!tmpl) throw new NotFoundException('填寫模板不存在');
    if (tmpl.creatorUserId !== creatorUserId) throw new ForbiddenException('無法刪除他人填寫模板');
    await this.prisma.oaFillTemplate.delete({ where: { id } });
  }

  async useFillTemplate(creatorUserId: string, id: string) {
    const tmpl = await this.prisma.oaFillTemplate.findUnique({ where: { id } });
    if (!tmpl) throw new NotFoundException('填寫模板不存在');
    if (tmpl.creatorUserId !== creatorUserId) throw new ForbiddenException('無法使用他人填寫模板');

    await this.prisma.oaFillTemplate.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });

    return { formType: tmpl.formType, content: tmpl.content };
  }
}
