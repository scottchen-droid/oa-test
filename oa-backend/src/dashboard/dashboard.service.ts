import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AnnouncementsService } from '../announcements/announcements.service'

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  async getDashboard(userId: string, loginIp?: string) {
    const [user, announcements] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          orgAssignments: {
            where: { isPrimary: true },
            include: {
              company: true,
              department: true,
              position: true,
              jobLevel: true,
            },
            take: 1,
          },
          userRoles: {
            include: { role: true },
            take: 1,
          },
        },
      }),
      this.announcementsService.findForDashboard(userId, 5),
    ])

    if (!user) return null

    const primaryOrg = user.orgAssignments[0]
    const primaryRole = user.userRoles[0]

    const currentUser = {
      id: user.id,
      chineseName: user.nameZh ?? user.displayName,
      englishName: user.nameEn ?? undefined,
      employeeNo: user.employeeNo ?? '',
      companyName: primaryOrg?.company?.name ?? '',
      companyCode: primaryOrg?.company?.code ?? '',
      departmentName: primaryOrg?.department?.name ?? '',
      positionName: primaryOrg?.position?.name ?? undefined,
      roleName: primaryRole?.role?.name ?? undefined,
      loginIp: loginIp ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
    }

    const shortcuts = this.buildShortcuts(user.isSuperAdmin)

    return {
      currentUser,
      shortcuts,
      todayReminders: [],
      tomorrowReminders: [],
      recentFunctions: [],
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        type: a.type,
        authorName: a.authorName,
        publishDate: a.publishDate,
        contentPreview: a.contentPreview ?? a.content.slice(0, 150),
        attachments: a.attachments,
        tags: a.tags.map((t) => t.tag),
        isPinned: a.isPinned,
        readStatus: 'unread' as const,
      })),
    }
  }

  private buildShortcuts(isSuperAdmin: boolean) {
    const all = [
      { id: 'notifications', name: '通知', icon: 'Bell', route: '/notifications', badgeCount: 0, permissionCode: null },
      { id: 'approvals', name: '簽核', icon: 'Check', route: '/approvals', badgeCount: 0, permissionCode: null },
      { id: 'leaves', name: '請假', icon: 'Calendar', route: '/leaves', badgeCount: 0, permissionCode: null },
      { id: 'announcements', name: '公告', icon: 'Notification', route: '/announcements', badgeCount: 0, permissionCode: null },
      { id: 'attendance', name: '考勤', icon: 'Clock', route: '/attendance', badgeCount: 0, permissionCode: null },
    ]
    return all
  }
}
