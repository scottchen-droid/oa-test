import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OvertimeService } from './overtime.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Overtime')
@ApiBearerAuth('access-token')
@Controller('overtime')
export class OvertimeController {
  constructor(private readonly service: OvertimeService) {}

  @Get()
  @ApiOperation({ summary: 'List overtime requests (employee: own; HR: all with includeDeleted)' })
  findAll(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({
      userId,
      status,
      month,
      startDate,
      endDate,
      includeDeleted: includeDeleted === 'true',
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Employee: get own overtime requests' })
  findMy(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({
      userId: user.sub,
      status,
      month,
      startDate,
      endDate,
      includeDeleted: false,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one overtime request' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and submit overtime request' })
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update overtime request (submitted only)' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete overtime request (before approval)' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.softDelete(id, user.sub);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'HR: Approve overtime request' })
  approve(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.approve(id, user.sub);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'HR: Reject overtime request' })
  reject(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.reject(id, user.sub, body.reason);
  }
}
