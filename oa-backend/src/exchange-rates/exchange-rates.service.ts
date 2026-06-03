import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateExchangeRateDto {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  expiryDate?: string;
  notes?: string;
}

export interface UpdateExchangeRateDto {
  rate?: number;
  expiryDate?: string;
  notes?: string;
  isActive?: boolean;
}

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    fromCurrency?: string;
    toCurrency?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { fromCurrency, toCurrency, page = 1, limit = 50 } = params;
    const isActive = params.isActive !== undefined ? params.isActive : undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (fromCurrency) where.fromCurrency = fromCurrency.toUpperCase();
    if (toCurrency) where.toCurrency = toCurrency.toUpperCase();
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.exchangeRate.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fromCurrency: 'asc' }, { toCurrency: 'asc' }, { effectiveDate: 'desc' }],
        include: { creator: { select: { id: true, displayName: true } } },
      }),
      this.prisma.exchangeRate.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const rate = await this.prisma.exchangeRate.findUnique({
      where: { id },
      include: { creator: { select: { id: true, displayName: true } } },
    });
    if (!rate) throw new NotFoundException('匯率記錄不存在');
    return rate;
  }

  /** 查詢指定幣別對、指定日期的有效匯率（最新一筆） */
  async findCurrentRate(fromCurrency: string, toCurrency: string, onDate?: string) {
    const targetDate = onDate ? new Date(onDate) : new Date();

    // 若來源與目標相同，匯率為 1
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return { rate: new Decimal(1), exchangeRateId: null };
    }

    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        isActive: true,
        effectiveDate: { lte: targetDate },
        OR: [{ expiryDate: null }, { expiryDate: { gte: targetDate } }],
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) return null;
    return { rate: rate.rate, exchangeRateId: rate.id };
  }

  async create(createdBy: string, dto: CreateExchangeRateDto) {
    if (dto.fromCurrency.toUpperCase() === dto.toCurrency.toUpperCase()) {
      throw new BadRequestException('來源幣別與目標幣別不可相同');
    }
    if (dto.rate <= 0) {
      throw new BadRequestException('匯率必須大於 0');
    }

    return this.prisma.exchangeRate.create({
      data: {
        fromCurrency: dto.fromCurrency.toUpperCase(),
        toCurrency: dto.toCurrency.toUpperCase(),
        rate: dto.rate,
        effectiveDate: new Date(dto.effectiveDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        notes: dto.notes,
        createdBy,
      },
    });
  }

  async update(id: string, dto: UpdateExchangeRateDto) {
    await this.findOne(id);
    return this.prisma.exchangeRate.update({
      where: { id },
      data: {
        ...(dto.rate !== undefined && { rate: dto.rate }),
        ...(dto.expiryDate !== undefined && { expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.exchangeRate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /** 取得所有支援的幣別清單（用於前端下拉選單） */
  async getSupportedCurrencies() {
    const rates = await this.prisma.exchangeRate.findMany({
      where: { isActive: true },
      select: { fromCurrency: true, toCurrency: true },
      distinct: ['fromCurrency', 'toCurrency'],
    });

    const currencies = new Set<string>();
    rates.forEach(r => {
      currencies.add(r.fromCurrency);
      currencies.add(r.toCurrency);
    });

    return Array.from(currencies).sort();
  }
}
