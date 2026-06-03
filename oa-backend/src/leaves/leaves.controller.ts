import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Leaves')
@ApiBearerAuth('access-token')
@Controller('leaves')
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  // ─── Leave Types ───────────────────────────────────────────────────────────

  @Get('types')
  @ApiOperation({ summary: 'List active leave types' })
  findLeaveTypes() {
    return this.service.findLeaveTypes();
  }

  @Post('types')
  @ApiOperation({ summary: 'HR: Create leave type' })
  createLeaveType(@Body() dto: any) {
    return this.service.createLeaveType(dto);
  }

  @Patch('types/:id')
  @ApiOperation({ summary: 'HR: Update leave type' })
  updateLeaveType(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateLeaveType(id, dto);
  }

  // ─── Leave Balances ────────────────────────────────────────────────────────

  @Get('balances')
  @ApiOperation({ summary: 'Get leave balances' })
  findBalances(
    @Query('userId') userId?: string,
    @Query('year') year?: number,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    return this.service.findBalances({ userId, year: year ? Number(year) : undefined, leaveTypeId });
  }

  @Patch('balances/:id')
  @ApiOperation({ summary: 'HR: Adjust leave balance' })
  updateBalance(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateBalance(id, dto);
  }

  @Post('init-year-balances')
  @ApiOperation({ summary: 'HR: Initialize leave balances for a year' })
  initYearBalances(@Body() body: { year: number; companyId?: string }) {
    return this.service.initYearBalances(body.year, body.companyId);
  }

  // ─── Leave Requests ────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List leave requests (employee: own; HR: all with includeDeleted)' })
  findAll(
    @Query('userId') userId?: string,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('companyId') companyId?: string,
    @Query('deptId') deptId?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({
      userId, leaveTypeId, status, month, startDate, endDate, companyId, deptId,
      includeDeleted: includeDeleted === 'true',
      page: Number(page), limit: Number(limit),
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Employee: get own leave requests (excludes deleted)' })
  findMy(
    @CurrentUser() user: any,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({
      userId: user.sub, leaveTypeId, status, month, startDate, endDate,
      includeDeleted: false,
      page: Number(page), limit: Number(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one leave request' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Employee: Submit leave request' })
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Employee: Update draft leave request' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.service.update(id, user.sub, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Employee: Cancel leave request' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.cancel(id, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Employee: Soft-delete own leave request (before approval)' })
  softDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.softDelete(id, user.sub);
  }

  // ─── HR approval ──────────────────────────────────────────────────────────

  @Post(':id/approve')
  @ApiOperation({ summary: 'HR: Approve leave request' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { comment?: string },
  ) {
    return this.service.approve(id, user.sub, body.comment);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'HR: Reject leave request' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { reason: string },
  ) {
    return this.service.reject(id, user.sub, body.reason);
  }
}
