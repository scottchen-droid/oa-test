import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List employees' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll({ search, status, companyId, departmentId, page, limit });
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get employee details' })
  findOne(@Param('userId') userId: string) {
    return this.service.findOne(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create employee (HR Admin)' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update employee profile' })
  update(@Param('userId') userId: string, @Body() dto: any) {
    return this.service.update(userId, dto);
  }

  @Patch(':userId/sensitive')
  @ApiOperation({ summary: 'Update sensitive employee data (HR Admin, encrypted)' })
  updateSensitive(@Param('userId') userId: string, @Body() dto: any) {
    return this.service.updateSensitiveData(userId, dto);
  }

  @Post(':userId/offboard')
  @ApiOperation({ summary: 'Offboard employee (HR Admin)' })
  offboard(@Param('userId') userId: string, @Body() dto: any) {
    return this.service.offboard(userId, dto);
  }
}
