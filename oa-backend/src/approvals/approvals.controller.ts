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

  // ══════════════════════════════════════════════════════════════
  // 審批對應關聯表 CRUD
  // ══════════════════════════════════════════════════════════════

  @Get('assignments')
  @ApiOperation({ summary: '查詢審批對應（?scopeType=&scopeId=&roleCode=&userId=）' })
  listAssignments(
    @Query('scopeType') scopeType?: string,
    @Query('scopeId') scopeId?: string,
    @Query('roleCode') roleCode?: string,
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 100,
  ) {
    return this.service.listAssignments({
      scopeType,
      scopeId: scopeId === 'null' ? null : scopeId,
      roleCode,
      userId,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Post('assignments')
  @ApiOperation({ summary: '新增審批對應（分組+角色+人員，第一筆自動設為預設）' })
  addAssignment(@Body() dto: any) {
    return this.service.addAssignment(dto);
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: '移除審批對應（刪除預設時自動遞補）' })
  removeAssignment(@Param('id') id: string) {
    return this.service.removeAssignment(id);
  }

  @Patch('assignments/:id/default')
  @ApiOperation({ summary: '設為預設審批人' })
  setDefault(@Param('id') id: string) {
    return this.service.setDefaultAssignment(id);
  }

  // ── 解析與驗證 ─────────────────────────────────────────────────

  @Get('resolve/:roleCode')
  @ApiOperation({ summary: '解析指定角色在上下文中的預設審批人（groupType 必填）' })
  resolveGroup(
    @Param('roleCode') roleCode: string,
    @Query('groupType') groupType: string,
    @Query('companyId') companyId?: string,
    @Query('regionId') regionId?: string,
    @Query('businessUnitId') businessUnitId?: string,
    @Query('projectId') projectId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('formType') formType?: string,
  ) {
    return this.service.resolveGroupApprovers(roleCode, { groupType, companyId, regionId, businessUnitId, projectId, departmentId, formType });
  }

  @Post('validate-form')
  @ApiOperation({ summary: '送出前驗證表單的審批流程是否完整' })
  validateForm(@Body() dto: any) {
    return this.service.validateFormApprovalReady(dto);
  }
}
