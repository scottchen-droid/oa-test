import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface ReimbursementItemDto {
  expenseDate?: string;
  expenseType?: string;
  originalCurrencyCode: string;
  originalAmount: number;
  exchangeRateId?: string;
  exchangeRateSnapshot?: number;
  amount: number;            // 換算後基礎幣別金額
  currencyCode: string;      // 基礎幣別
  vendorName?: string;
  invoiceNo?: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateReimbursementDto {
  title: string;
  description?: string;
  currencyCode: string;
  purchaseRequestId?: string;
  purchaseAllocationId?: string;
  businessTripFormId?: string;
  sourceFormType?: string;
  reimbursementCompanyId: string;
  reimbursementRegionId: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  items?: ReimbursementItemDto[];
}

export interface UpdateReimbursementDto {
  title?: string;
  description?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  items?: ReimbursementItemDto[];
}

@Injectable()
export class ReimbursementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: string;
    claimantUserId?: string;
    companyId?: string;
    purchaseRequestId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, claimantUserId, companyId, purchaseRequestId, dateFrom, dateTo, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (claimantUserId) where.claimantUserId = claimantUserId;
    if (companyId) where.reimbursementCompanyId = companyId;
    if (purchaseRequestId) where.purchaseRequestId = purchaseRequestId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reimbursementRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          claimant: { select: { id: true, displayName: true, employeeNo: true } },
          company: { select: { id: true, name: true } },
          purchaseRequest: { select: { id: true, requestNo: true, title: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.reimbursementRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const req = await this.prisma.reimbursementRequest.findUnique({
      where: { id },
      include: {
        claimant: { select: { id: true, displayName: true, employeeNo: true } },
        company: { select: { id: true, name: true, currencyCode: true } },
        region: { select: { id: true, name: true } },
        purchaseRequest: {
          select: {
            id: true, requestNo: true, title: true, totalAmount: true, currencyCode: true,
            allocations: {
              select: {
                id: true, amount: true, currencyCode: true, reimbursedAmount: true, description: true,
                company: { select: { id: true, name: true } },
                businessUnit: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
              },
            },
          },
        },
        purchaseAllocation: {
          select: {
            id: true, amount: true, currencyCode: true, reimbursedAmount: true,
            company: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
          },
        },
        businessTripForm: {
          select: {
            id: true, formType: true, content: true, status: true,
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exchangeRate: { select: { id: true, fromCurrency: true, toCurrency: true, rate: true } },
          },
        },
        creator: { select: { id: true, displayName: true } },
      },
    });

    if (!req) throw new NotFoundException('報銷單不存在');
    return req;
  }

  async create(createdBy: string, dto: CreateReimbursementDto) {
    // 驗證來源申請的存在性
    if (dto.purchaseRequestId) {
      const pr = await this.prisma.purchaseRequest.findUnique({ where: { id: dto.purchaseRequestId } });
      if (!pr) throw new NotFoundException('關聯採購申請不存在');
      if (pr.status !== 'approved') throw new BadRequestException('採購申請尚未核准，無法報銷');
    }

    if (dto.businessTripFormId) {
      const bt = await this.prisma.oaFormRequest.findUnique({ where: { id: dto.businessTripFormId } });
      if (!bt) throw new NotFoundException('關聯出差申請不存在');
      if (bt.status !== 'approved') throw new BadRequestException('出差申請尚未核准，無法報銷');
    }

    const items = dto.items ?? [];
    const totalAmount = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

    const reimbursementNo = await this.generateReimbursementNo();

    return this.prisma.reimbursementRequest.create({
      data: {
        reimbursementNo,
        title: dto.title,
        description: dto.description,
        currencyCode: dto.currencyCode,
        purchaseRequestId: dto.purchaseRequestId ?? null,
        purchaseAllocationId: dto.purchaseAllocationId ?? null,
        businessTripFormId: dto.businessTripFormId ?? null,
        sourceFormType: dto.sourceFormType ?? null,
        claimantUserId: createdBy,
        reimbursementCompanyId: dto.reimbursementCompanyId,
        reimbursementRegionId: dto.reimbursementRegionId,
        bankName: dto.bankName ?? null,
        bankAccountNo: dto.bankAccountNo ?? null,
        bankAccountName: dto.bankAccountName ?? null,
        totalAmount,
        status: 'draft',
        createdBy,
        items: {
          create: items.map((item, idx) => ({
            expenseDate: item.expenseDate ? new Date(item.expenseDate) : null,
            expenseType: item.expenseType ?? null,
            originalCurrencyCode: item.originalCurrencyCode,
            originalAmount: item.originalAmount,
            exchangeRateId: item.exchangeRateId ?? null,
            exchangeRateSnapshot: item.exchangeRateSnapshot ?? null,
            amount: item.amount,
            currencyCode: item.currencyCode,
            vendorName: item.vendorName ?? null,
            invoiceNo: item.invoiceNo ?? null,
            description: item.description ?? null,
            sortOrder: item.sortOrder ?? idx,
          })),
        },
      },
      include: {
        items: true,
        claimant: { select: { id: true, displayName: true } },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateReimbursementDto) {
    const req = await this.findOne(id);
    if (req.status !== 'draft') throw new BadRequestException('只有草稿狀態的報銷單可以修改');
    if (req.claimantUserId !== userId) throw new ForbiddenException('只有申請人可以修改此報銷單');

    const items = dto.items;

    return this.prisma.$transaction(async (tx) => {
      // 替換所有明細項目
      if (items !== undefined) {
        await tx.reimbursementItem.deleteMany({ where: { reimbursementRequestId: id } });
      }

      const totalAmount = items
        ? items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
        : undefined;

      return tx.reimbursementRequest.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.bankName !== undefined && { bankName: dto.bankName }),
          ...(dto.bankAccountNo !== undefined && { bankAccountNo: dto.bankAccountNo }),
          ...(dto.bankAccountName !== undefined && { bankAccountName: dto.bankAccountName }),
          ...(totalAmount !== undefined && { totalAmount }),
          updatedBy: userId,
          ...(items !== undefined && {
            items: {
              create: items.map((item, idx) => ({
                expenseDate: item.expenseDate ? new Date(item.expenseDate) : null,
                expenseType: item.expenseType ?? null,
                originalCurrencyCode: item.originalCurrencyCode,
                originalAmount: item.originalAmount,
                exchangeRateId: item.exchangeRateId ?? null,
                exchangeRateSnapshot: item.exchangeRateSnapshot ?? null,
                amount: item.amount,
                currencyCode: item.currencyCode,
                vendorName: item.vendorName ?? null,
                invoiceNo: item.invoiceNo ?? null,
                description: item.description ?? null,
                sortOrder: item.sortOrder ?? idx,
              })),
            },
          }),
        },
        include: { items: true },
      });
    });
  }

  async submit(id: string, userId: string) {
    const req = await this.findOne(id);
    if (req.status !== 'draft') throw new BadRequestException('只有草稿狀態可以提交');
    if (req.claimantUserId !== userId) throw new ForbiddenException('只有申請人可以提交此報銷單');
    if (!req.items || req.items.length === 0) throw new BadRequestException('報銷單必須包含至少一筆費用明細');

    // 驗證報銷金額不超過採購分攤金額
    if (req.purchaseAllocationId) {
      await this.validateAllocationAmount(id, req.purchaseAllocationId, req.totalAmount);
    }

    // 驗證報銷金額不超過出差申請預算
    if (req.businessTripFormId && req.businessTripForm) {
      await this.validateBusinessTripBudget(req);
    }

    return this.prisma.$transaction(async (tx) => {
      // 更新採購分攤的已報銷金額
      if (req.purchaseAllocationId) {
        await tx.purchaseRequestAllocation.update({
          where: { id: req.purchaseAllocationId },
          data: { reimbursedAmount: { increment: req.totalAmount } },
        });
      }

      return tx.reimbursementRequest.update({
        where: { id },
        data: {
          status: 'submitted',
          submittedAt: new Date(),
          updatedBy: userId,
        },
      });
    });
  }

  async cancel(id: string, userId: string) {
    const req = await this.findOne(id);
    if (!['draft', 'submitted'].includes(req.status)) {
      throw new BadRequestException('只有草稿或待審核狀態可以取消');
    }
    if (req.claimantUserId !== userId) throw new ForbiddenException('只有申請人可以取消此報銷單');

    return this.prisma.$transaction(async (tx) => {
      // 若已提交，回退已報銷金額
      if (req.status === 'submitted' && req.purchaseAllocationId) {
        await tx.purchaseRequestAllocation.update({
          where: { id: req.purchaseAllocationId },
          data: { reimbursedAmount: { decrement: req.totalAmount } },
        });
      }

      return tx.reimbursementRequest.update({
        where: { id },
        data: { status: 'canceled', canceledAt: new Date(), updatedBy: userId },
      });
    });
  }

  async pay(id: string, userId: string) {
    const req = await this.prisma.reimbursementRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('報銷單不存在');
    if (req.status !== 'approved') throw new BadRequestException('只有已批准的報銷單可以標記付款');

    return this.prisma.reimbursementRequest.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), updatedBy: userId },
    });
  }

  /** 取得我的報銷單列表（員工視角） */
  async findMyReimbursements(userId: string, params: { status?: string; page?: number; limit?: number }) {
    return this.findAll({ ...params, claimantUserId: userId });
  }

  private async generateReimbursementNo(): Promise<string> {
    const now = new Date();
    const prefix = `RE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;

    const last = await this.prisma.reimbursementRequest.findFirst({
      where: { reimbursementNo: { startsWith: prefix } },
      orderBy: { reimbursementNo: 'desc' },
    });

    const seq = last ? parseInt(last.reimbursementNo.split('-')[2] ?? '0', 10) + 1 : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  private async validateAllocationAmount(
    reimbursementId: string,
    allocationId: string,
    newTotalAmount: Decimal | number,
  ) {
    const allocation = await this.prisma.purchaseRequestAllocation.findUnique({
      where: { id: allocationId },
    });
    if (!allocation) throw new NotFoundException('採購分攤項目不存在');

    // 計算此分攤已有的已提交/核准報銷金額（排除本單）
    const existing = await this.prisma.reimbursementRequest.aggregate({
      where: {
        purchaseAllocationId: allocationId,
        status: { in: ['submitted', 'approved', 'paid'] },
        id: { not: reimbursementId },
      },
      _sum: { totalAmount: true },
    });

    const existingSum = existing._sum.totalAmount ?? new Decimal(0);
    const newAmount = new Decimal(newTotalAmount.toString());
    const total = existingSum.add(newAmount);

    if (total.greaterThan(allocation.amount)) {
      throw new BadRequestException(
        `報銷金額超過採購分攤上限。分攤金額：${allocation.amount} ${allocation.currencyCode}，已報銷：${existingSum}，本次：${newAmount}`,
      );
    }
  }

  private async validateBusinessTripBudget(req: any) {
    const content = req.businessTripForm?.content as Record<string, any>;
    const budget = content?.estimatedBudget;
    if (!budget) return;

    const existing = await this.prisma.reimbursementRequest.aggregate({
      where: {
        businessTripFormId: req.businessTripFormId,
        status: { in: ['submitted', 'approved', 'paid'] },
        id: { not: req.id },
      },
      _sum: { totalAmount: true },
    });

    const existingSum = existing._sum.totalAmount ?? new Decimal(0);
    const newAmount = new Decimal(req.totalAmount.toString());
    const total = existingSum.add(newAmount);

    if (total.greaterThan(new Decimal(budget.toString()))) {
      throw new BadRequestException(
        `報銷金額超過出差申請預算。預算：${budget} ${req.currencyCode}，已報銷：${existingSum}，本次：${newAmount}`,
      );
    }
  }
}
