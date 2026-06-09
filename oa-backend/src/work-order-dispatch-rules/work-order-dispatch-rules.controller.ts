import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrderDispatchRulesService } from './work-order-dispatch-rules.service';

@ApiTags('System - Work Order Dispatch Rules')
@ApiBearerAuth('access-token')
@Controller('system/work-order-dispatch-rules')
export class WorkOrderDispatchRulesController {
  constructor(private readonly service: WorkOrderDispatchRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List dispatch rules' })
  findAll(@Query('resourceItemId') resourceItemId?: string) {
    return this.service.findAll({ resourceItemId });
  }

  @Post()
  @ApiOperation({ summary: 'Create dispatch rule' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dispatch rule' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dispatch rule' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
