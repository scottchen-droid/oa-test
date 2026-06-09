import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Work Orders')
@ApiBearerAuth('access-token')
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Get my work orders (assigned or in my groups)' })
  findMyWorkOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findMyWorkOrders(user.sub, { status, page: +page, limit: +limit });
  }

  @Get('group')
  @ApiOperation({ summary: 'Get work orders of my groups' })
  findGroupWorkOrders(
    @CurrentUser() user: JwtPayload,
    @Query('groupId') groupId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findGroupWorkOrders(user.sub, { groupId, status, page: +page, limit: +limit });
  }

  @Get('request/:requestId')
  @ApiOperation({ summary: 'Get work orders by personnel resource request' })
  findByRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findWorkOrdersByRequest(requestId, user.sub);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start processing a work order' })
  startProcessing(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.startProcessing(id, user.sub);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a work order' })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { resultData?: Record<string, unknown> },
  ) {
    return this.service.complete(id, user.sub, dto.resultData);
  }

  @Post(':id/fail')
  @ApiOperation({ summary: 'Mark a work order as failed' })
  markFailed(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { reason: string },
  ) {
    return this.service.markFailed(id, user.sub, dto.reason);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Return a work order' })
  returnWorkOrder(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { reason: string },
  ) {
    return this.service.returnWorkOrder(id, user.sub, dto.reason);
  }

  @Post(':id/reassign')
  @ApiOperation({ summary: 'Reassign a work order to another group' })
  reassign(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { newGroupId: string; reason: string },
  ) {
    return this.service.reassign(id, user.sub, dto.newGroupId, dto.reason);
  }

  @Post(':id/note')
  @ApiOperation({ summary: 'Add a note to a work order' })
  addNote(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { content: string },
  ) {
    return this.service.addNote(id, user.sub, dto.content);
  }
}
