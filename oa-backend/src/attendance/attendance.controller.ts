import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  // ─── HR admin endpoints ────────────────────────────────────────────────────

  @Get('records')
  @ApiOperation({ summary: 'HR: List all attendance records' })
  findAllRecords(
    @Query('userId') userId?: string,
    @Query('deptId') deptId?: string,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllRecords({ userId, deptId, companyId, status, month, startDate, endDate, page: Number(page), limit: Number(limit) });
  }

  @Get('summary')
  @ApiOperation({ summary: 'HR: Attendance summary counts by month' })
  findSummary(
    @Query('month') month?: string,
    @Query('deptId') deptId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.findSummary({ month, deptId, companyId });
  }

  @Get('records/:id')
  @ApiOperation({ summary: 'Get one attendance record' })
  findOneRecord(@Param('id') id: string) {
    return this.service.findOneRecord(id);
  }

  @Patch('records/:id')
  @ApiOperation({ summary: 'HR: Update attendance record' })
  updateRecord(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateRecord(id, dto);
  }

  @Get('clock-records')
  @ApiOperation({ summary: 'HR: List clock records' })
  findAllClockRecords(
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findAllClockRecords({ userId, date });
  }

  @Get('clock-patches')
  @ApiOperation({ summary: 'HR: List manual clock patch requests' })
  findClockPatches(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findClockPatches({ status, page: Number(page), limit: Number(limit) });
  }

  @Patch('clock-patches/:id/approve')
  @ApiOperation({ summary: 'HR: Approve clock patch' })
  approveClockPatch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.approveClockPatch(id, user.sub);
  }

  @Patch('clock-patches/:id/reject')
  @ApiOperation({ summary: 'HR: Reject clock patch' })
  rejectClockPatch(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.service.rejectClockPatch(id, body.reason, user.sub);
  }

  // ─── Employee self-service ─────────────────────────────────────────────────

  @Get('today')
  @ApiOperation({ summary: 'Employee: Get today attendance status' })
  findTodayStatus(@CurrentUser() user: any) {
    return this.service.findTodayStatus(user.sub);
  }

  @Get('my-records')
  @ApiOperation({ summary: 'Employee: Get own attendance records with optional date range' })
  findMyRecords(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 31,
  ) {
    return this.service.findMyRecords(user.sub, { month, startDate, endDate, page: Number(page), limit: Number(limit) });
  }

  @Get('my-clock-patches')
  @ApiOperation({ summary: 'Employee: Get own clock patch requests' })
  findMyClockPatches(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findMyClockPatches(user.sub, { status, page: Number(page), limit: Number(limit) });
  }

  @Post('clock-in')
  @ApiOperation({ summary: 'Employee: Clock in' })
  clockIn(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.clockIn(user.sub, dto);
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Employee: Clock out' })
  clockOut(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.clockOut(user.sub, dto);
  }

  @Post('clock-patches')
  @ApiOperation({ summary: 'Employee: Submit manual clock patch request' })
  createClockPatch(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.createClockPatch(user.sub, dto);
  }
}
