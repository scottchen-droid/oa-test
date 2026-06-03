import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Approvals')
@ApiBearerAuth('access-token')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly service: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List pending approvals for current user, optionally filtered by formType' })
  findPending(
    @CurrentUser() user: any,
    @Query('formType') formType?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findPending({ userId: user.sub, formType, page: Number(page), limit: Number(limit) });
  }

  @Get('pending/counts')
  @ApiOperation({ summary: 'Get pending approval counts grouped by formType' })
  findPendingCounts(@CurrentUser() user: any) {
    return this.service.findPendingCounts(user.sub);
  }

  @Get('completed')
  @ApiOperation({ summary: 'List completed approvals by current user' })
  findCompleted(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findCompleted({ userId: user.sub, page: Number(page), limit: Number(limit) });
  }

  @Get('cc')
  @ApiOperation({ summary: 'List CC items for current user' })
  findCc(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findCc({ userId: user.sub, page: Number(page), limit: Number(limit) });
  }

  @Get('templates')
  @ApiOperation({ summary: 'List approval templates' })
  findAllTemplates(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllTemplates({ page: Number(page), limit: Number(limit) });
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get approval template with steps' })
  getTemplate(@Param('id') id: string) {
    return this.service.getTemplate(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create approval template' })
  createTemplate(@Body() dto: any) {
    return this.service.createTemplate(dto);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update approval template basic info' })
  updateTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateTemplate(id, dto);
  }

  @Put('templates/:id/steps')
  @ApiOperation({ summary: 'Replace all steps of an approval template' })
  replaceTemplateSteps(@Param('id') id: string, @Body() body: { steps: any[] }) {
    return this.service.replaceTemplateSteps(id, body.steps ?? []);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get approval instance detail' })
  findInstance(@Param('id') id: string) {
    return this.service.findInstance(id);
  }

  @Post('instances/:id/approve')
  @ApiOperation({ summary: 'Approve a step' })
  approve(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.service.approve(id, { ...dto, approverId: user.sub });
  }

  @Post('instances/:id/reject')
  @ApiOperation({ summary: 'Reject a step' })
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.service.reject(id, { ...dto, approverId: user.sub });
  }

  // ── 員工審批職能角色 ──────────────────────────────────────

  // ── 員工審批職能角色 ──────────────────────────────────────

  @Get('employee-approver-roles/:userId')
  @ApiOperation({ summary: '取得員工的審批職能角色列表' })
  getEmployeeApproverRoles(@Param('userId') userId: string) {
    return this.service.getEmployeeApproverRoles(userId);
  }

  @Get('approver-role-holder')
  @ApiOperation({ summary: '查詢特定職能角色目前由誰擔任' })
  findApproverRoleHolder(
    @Query('roleType')  roleType:  string,
    @Query('scopeType') scopeType: string,
    @Query('scopeId')   scopeId?:  string,
  ) {
    return this.service.findApproverRoleHolder({ roleType, scopeType, scopeId });
  }

  @Get('approver-role-holders')
  @ApiOperation({ summary: '列出特定公司/集團所有職能角色的持有人' })
  listApproverRoleHolders(
    @Query('scopeType') scopeType?: string,
    @Query('scopeId')   scopeId?:  string,
  ) {
    return this.service.listApproverRoleHolders({ scopeType, scopeId });
  }

  @Post('employee-approver-roles/:userId')
  @ApiOperation({ summary: '為員工指派審批職能角色（forceReplace=true 時轉移）' })
  createEmployeeApproverRole(
    @Param('userId') userId: string,
    @Body() dto: any,
  ) {
    const { forceReplace, ...rest } = dto;
    return this.service.createEmployeeApproverRole(userId, rest, !!forceReplace);
  }

  @Delete('employee-approver-roles/:roleId')
  @ApiOperation({ summary: '移除員工審批職能角色（軟刪除）' })
  deleteEmployeeApproverRole(@Param('roleId') roleId: string) {
    return this.service.deleteEmployeeApproverRole(roleId);
  }
}
