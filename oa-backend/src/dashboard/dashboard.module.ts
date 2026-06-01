import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { PrismaModule } from '../prisma/prisma.module'
import { AnnouncementsModule } from '../announcements/announcements.module'

@Module({
  imports: [PrismaModule, AnnouncementsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
