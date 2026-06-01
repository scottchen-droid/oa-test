import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs' })
  findAll(
    @Query('operatorUserId') operatorUserId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({ operatorUserId, action, targetType, startDate, endDate, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one audit log entry' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
