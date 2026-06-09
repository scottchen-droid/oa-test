import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkOrderGroupsService } from './work-order-groups.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('System - Work Order Groups')
@ApiBearerAuth('access-token')
@Controller('system/work-order-groups')
export class WorkOrderGroupsController {
  constructor(private readonly service: WorkOrderGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List all work order groups' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order group by id' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create work order group' })
  create(@Body() dto: { name: string; description?: string }) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update work order group' })
  update(@Param('id') id: string, @Body() dto: { name?: string; description?: string }) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle work order group enabled status' })
  toggle(@Param('id') id: string) {
    return this.service.toggleEnabled(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to work order group' })
  addMember(@Param('id') id: string, @Body() dto: { userId: string; isLeader?: boolean }) {
    return this.service.addMember(id, dto.userId, dto.isLeader ?? false);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from work order group' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.service.removeMember(id, userId);
  }
}

@ApiTags('Work Order Groups')
@ApiBearerAuth('access-token')
@Controller('work-order-groups')
export class WorkOrderGroupsEmployeeController {
  constructor(private readonly service: WorkOrderGroupsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user\'s work order groups' })
  getMyGroups(@CurrentUser() user: JwtPayload) {
    return this.service.getMyGroups(user.sub);
  }
}
