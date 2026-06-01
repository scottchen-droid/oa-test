import { Controller, Get, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { DashboardService } from './dashboard.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiOperation({ summary: '首頁 Dashboard 資料' })
  getDashboard(@CurrentUser() user: { sub: string }, @Req() req: any) {
    const ip = req.ip ?? req.connection?.remoteAddress
    return this.service.getDashboard(user.sub, ip)
  }
}
