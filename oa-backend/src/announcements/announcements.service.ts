import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto/announcement.dto'

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AnnouncementQueryDto, userId?: string) {
    const { category, type, isPinned, page = 1, limit = 20 } = query
    const skip = (Number(page) - 1) * Number(limit)

    const where: Record<string, unknown> = { isActive: true }
    if (category) where.category = category
    if (type) where.type = type
    if (isPinned !== undefined) where.isPinned = isPinned

    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: { attachments: true, tags: true },
        orderBy: [{ isPinned: 'desc' }, { publishDate: 'desc' }],
        skip,
        take: Number(limit),
      }),
      this.prisma.announcement.count({ where }),
    ])

    return { items, total, page: Number(page), limit: Number(limit) }
  }

  async findForDashboard(userId?: string, limit = 5) {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      include: { attachments: true, tags: true },
      orderBy: [{ isPinned: 'desc' }, { publishDate: 'desc' }],
      take: limit,
    })
  }

  async findOne(id: string) {
    const item = await this.prisma.announcement.findUnique({
      where: { id },
      include: { attachments: true, tags: true },
    })
    if (!item || !item.isActive) throw new NotFoundException('公告不存在')
    return item
  }

  async create(dto: CreateAnnouncementDto) {
    const { attachments, tags, ...data } = dto
    return this.prisma.announcement.create({
      data: {
        ...data,
        publishDate: new Date(data.publishDate),
        attachments: attachments?.length
          ? { create: attachments }
          : undefined,
        tags: tags?.length
          ? { create: tags.map((tag) => ({ tag })) }
          : undefined,
      },
      include: { attachments: true, tags: true },
    })
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.findOne(id)
    const { attachments, tags, ...data } = dto
    const updateData: Record<string, unknown> = { ...data }
    if (data.publishDate) updateData.publishDate = new Date(data.publishDate)

    if (attachments !== undefined) {
      await this.prisma.announcementAttachment.deleteMany({ where: { announcementId: id } })
      if (attachments.length) {
        await this.prisma.announcementAttachment.createMany({
          data: attachments.map((a) => ({ ...a, announcementId: id })),
        })
      }
    }

    if (tags !== undefined) {
      await this.prisma.announcementTag.deleteMany({ where: { announcementId: id } })
      if (tags.length) {
        await this.prisma.announcementTag.createMany({
          data: tags.map((t) => ({ tag: t, announcementId: id })),
        })
      }
    }

    return this.prisma.announcement.update({
      where: { id },
      data: updateData,
      include: { attachments: true, tags: true },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    })
  }
}
