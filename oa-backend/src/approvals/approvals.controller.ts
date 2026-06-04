import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, ParseBoolPipe, Optional } from '@nestjs/common';
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
    @Query('formType') formType?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllTemplates({ formType, page: Number(page), limit: Number(limit) });
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

  // ══════════════════════════════════════════════════════════════
  // 審批群組 CRUD
  // ══════════════════════════════════════════════════════════════

  @Get('groups')
  @ApiOperation({ summary: '列出審批群組' })
  findGroups(
    @Query('roleCode') roleCode?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findAllGroups({ roleCode, page: Number(page), limit: Number(limit) });
  }

  @Get('groups/:id')
  @ApiOperation({ summary: '取得審批群組詳情（含成員與範圍）' })
  getGroup(@Param('id') id: string) {
    return this.service.getGroup(id);
  }

  @Post('groups')
  @ApiOperation({ summary: '新增審批群組' })
  createGroup(@Body() dto: any) {
    return this.service.createGroup(dto);
  }

  @Patch('groups/:id')
  @ApiOperation({ summary: '更新審批群組基本資訊' })
  updateGroup(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateGroup(id, dto);
  }

  // ── 群組成員 ──────────────────────────────────────────────────

  @Post('groups/:groupId/members')
  @ApiOperation({ summary: '加入群組成員' })
  addMember(@Param('groupId') groupId: string, @Body() dto: any) {
    return this.service.addGroupMember(groupId, dto);
  }

  @Delete('group-members/:memberId')
  @ApiOperation({ summary: '移除群組成員（軟刪除）' })
  removeMember(@Param('memberId') memberId: string) {
    return this.service.removeGroupMember(memberId);
  }

  // ── 群組服務範圍 ───────────────────────────────────────────────

  @Post('groups/:groupId/scopes')
  @ApiOperation({ summary: '新增群組服務範圍' })
  addScope(@Param('groupId') groupId: string, @Body() dto: any) {
    return this.service.addGroupScope(groupId, dto);
  }

  @Delete('group-scopes/:scopeId')
  @ApiOperation({ summary: '刪除群組服務範圍' })
  removeScope(@Param('scopeId') scopeId: string) {
    return this.service.removeGroupScope(scopeId);
  }

  // ── 解析與驗證 ─────────────────────────────────────────────────

  @Get('groups/resolve/:roleCode')
  @ApiOperation({ summary: '解析指定角色代碼在上下文中的審批人' })
  resolveGroup(
    @Param('roleCode') roleCode: string,
    @Query('companyId') companyId?: string,
    @Query('regionId') regionId?: string,
    @Query('businessUnitId') businessUnitId?: string,
    @Query('projectId') projectId?: string,
    @Query('formType') formType?: string,
  ) {
    return this.service.resolveGroupApprovers(roleCode, { companyId, regionId, businessUnitId, projectId, formType });
  }

  @Post('validate-form')
  @ApiOperation({ summary: '送出前驗證表單的審批流程是否完整' })
  validateForm(@Body() dto: any) {
    return this.service.validateFormApprovalReady(dto);
  }
}
