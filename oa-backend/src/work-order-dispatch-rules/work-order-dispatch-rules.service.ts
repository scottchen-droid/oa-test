import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DispatchContext {
  regionId?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  businessUnitId?: string | null;
  projectId?: string | null;
}

@Injectable()
export class WorkOrderDispatchRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { resourceItemId?: string }) {
    const where: Record<string, unknown> = {};
    if (params.resourceItemId) where['resourceItemId'] = params.resourceItemId;

    return this.prisma.workOrderDispatchRule.findMany({
      where,
      include: {
        resourceItem: { select: { id: true, code: true, name: true } },
        workOrderGroup: { select: { id: true, name: true } },
      },
      orderBy: [{ resourceItemId: 'asc' }, { priority: 'desc' }],
    });
  }

  async create(dto: {
    resourceItemId: string;
    workOrderGroupId: string;
    regionId?: string;
    companyId?: string;
    departmentId?: string;
    businessUnitId?: string;
    projectId?: string;
    priority?: number;
  }) {
    return this.prisma.workOrderDispatchRule.create({
      data: dto,
      include: {
        resourceItem: { select: { id: true, code: true, name: true } },
        workOrderGroup: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    dto: {
      workOrderGroupId?: string;
      regionId?: string | null;
      companyId?: string | null;
      departmentId?: string | null;
      businessUnitId?: string | null;
      projectId?: string | null;
      priority?: number;
      isEnabled?: boolean;
    },
  ) {
    const rule = await this.prisma.workOrderDispatchRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Dispatch rule not found');
    return this.prisma.workOrderDispatchRule.update({
      where: { id },
      data: dto,
      include: {
        resourceItem: { select: { id: true, code: true, name: true } },
        workOrderGroup: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    const rule = await this.prisma.workOrderDispatchRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Dispatch rule not found');
    await this.prisma.workOrderDispatchRule.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  /**
   * 核心派發邏輯：
   * 1. 取出該 resourceItemId 所有 isEnabled=true 的規則
   * 2. 對每條規則計算「符合分數」：project=5, department=4, businessUnit=3, company=2, region=1
   * 3. 規則中某 field 非 null 時，必須與 context 完全相符
   * 4. 回傳最高分的規則的 workOrderGroupId
   */
  async findMatchingGroup(
    resourceItemId: string,
    context: DispatchContext,
  ): Promise<string | null> {
    const rules = await this.prisma.workOrderDispatchRule.findMany({
      where: { resourceItemId, isEnabled: true },
      orderBy: { priority: 'desc' },
    });

    const FIELD_SCORES: Array<[keyof DispatchContext, number]> = [
      ['projectId', 5],
      ['departmentId', 4],
      ['businessUnitId', 3],
      ['companyId', 2],
      ['regionId', 1],
    ];

    let bestGroupId: string | null = null;
    let bestScore = -1;
    let bestPriority = -1;

    for (const rule of rules) {
      let score = 0;
      let matched = true;

      for (const [field, points] of FIELD_SCORES) {
        const ruleValue = (rule as Record<string, unknown>)[field] as string | null;
        const contextValue = context[field] ?? null;

        if (ruleValue !== null) {
          // rule has a constraint: context must match exactly
          if (ruleValue !== contextValue) {
            matched = false;
            break;
          }
          score += points;
        }
        // ruleValue === null means "no restriction", doesn't add to score but still valid
      }

      if (!matched) continue;

      if (
        score > bestScore ||
        (score === bestScore && rule.priority > bestPriority)
      ) {
        bestScore = score;
        bestPriority = rule.priority;
        bestGroupId = rule.workOrderGroupId;
      }
    }

    return bestGroupId;
  }
}
