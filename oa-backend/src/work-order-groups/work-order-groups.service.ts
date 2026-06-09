import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MEMBER_SELECT = {
  id: true,
  groupId: true,
  userId: true,
  isLeader: true,
  joinedAt: true,
  user: {
    select: { id: true, displayName: true, employeeNo: true },
  },
};

@Injectable()
export class WorkOrderGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.workOrderGroup.findMany({
      include: { members: { select: MEMBER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    const group = await this.prisma.workOrderGroup.findUnique({
      where: { id },
      include: { members: { select: MEMBER_SELECT } },
    });
    if (!group) throw new NotFoundException('Work order group not found');
    return group;
  }

  async create(dto: { name: string; description?: string }) {
    return this.prisma.workOrderGroup.create({
      data: { name: dto.name, description: dto.description },
      include: { members: { select: MEMBER_SELECT } },
    });
  }

  async update(id: string, dto: { name?: string; description?: string }) {
    await this.findById(id);
    return this.prisma.workOrderGroup.update({
      where: { id },
      data: dto,
      include: { members: { select: MEMBER_SELECT } },
    });
  }

  async toggleEnabled(id: string) {
    const group = await this.findById(id);
    return this.prisma.workOrderGroup.update({
      where: { id },
      data: { isEnabled: !group.isEnabled },
      include: { members: { select: MEMBER_SELECT } },
    });
  }

  async addMember(groupId: string, userId: string, isLeader = false) {
    await this.findById(groupId);
    return this.prisma.workOrderGroupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, isLeader },
      update: { isLeader },
      select: MEMBER_SELECT,
    });
  }

  async removeMember(groupId: string, userId: string) {
    await this.findById(groupId);
    await this.prisma.workOrderGroupMember.deleteMany({
      where: { groupId, userId },
    });
    return { message: 'Member removed' };
  }

  async getMyGroups(userId: string) {
    const memberships = await this.prisma.workOrderGroupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: { members: { select: MEMBER_SELECT } },
        },
      },
    });
    return memberships.map((m) => ({ ...m.group, isLeader: m.isLeader }));
  }
}
