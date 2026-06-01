import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payroll')
@ApiBearerAuth('access-token')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  // ─── Payroll Periods ───────────────────────────────────────────────────────

  @Get('periods')
  @ApiOperation({ summary: 'List payroll periods' })
  findAllPeriods(
    @Query('year') year?: number,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllPeriods({ year: year ? Number(year) : undefined, status, page: Number(page), limit: Number(limit) });
  }

  @Get('periods/:id')
  @ApiOperation({ summary: 'Get one payroll period with records' })
  findOnePeriod(@Param('id') id: string) {
    return this.service.findOnePeriod(id);
  }

  @Post('periods')
  @ApiOperation({ summary: 'Create payroll period' })
  createPeriod(@Body() dto: any) {
    return this.service.createPeriod(dto);
  }

  @Patch('periods/:id')
  @ApiOperation({ summary: 'Update payroll period' })
  updatePeriod(@Param('id') id: string, @Body() dto: any) {
    return this.service.updatePeriod(id, dto);
  }

  @Post('periods/:id/lock')
  @ApiOperation({ summary: 'Lock payroll period' })
  lockPeriod(@Param('id') id: string) {
    return this.service.lockPeriod(id);
  }

  // ─── Payroll Records ───────────────────────────────────────────────────────

  @Get('records')
  @ApiOperation({ summary: 'List payroll records' })
  findAllRecords(
    @Query('periodId') periodId?: string,
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllRecords({ periodId, userId, page: Number(page), limit: Number(limit) });
  }

  @Post('records/calculate')
  @ApiOperation({ summary: 'Calculate payroll records for a period' })
  calculateRecords(@Body() body: { periodId: string }) {
    return this.service.calculateRecords(body.periodId);
  }

  // ─── Salary Structures ─────────────────────────────────────────────────────

  @Get('structures')
  @ApiOperation({ summary: 'List salary structures' })
  findAllStructures(
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllStructures({ userId, page: Number(page), limit: Number(limit) });
  }

  @Post('structures')
  @ApiOperation({ summary: 'Create salary structure for an employee' })
  createStructure(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.createStructure(user.sub, dto);
  }

  @Patch('structures/:id')
  @ApiOperation({ summary: 'Update salary structure' })
  updateStructure(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateStructure(id, dto);
  }

  // ─── Employee self-service ─────────────────────────────────────────────────

  @Get('my-payslips')
  @ApiOperation({ summary: 'Employee: Get own payslips' })
  findMyPayslips(
    @CurrentUser() user: any,
    @Query('year') year?: number,
  ) {
    return this.service.findMyPayslips(user.sub, year ? Number(year) : undefined);
  }
}
