import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Forms')
@ApiBearerAuth('access-token')
@Controller('forms')
export class FormsController {
  constructor(private readonly service: FormsService) {}

  // ─── 正式申請 ───────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Submit a new OA form request' })
  create(
    @CurrentUser() user: any,
    @Body() dto: { formType: string; content: Record<string, unknown> },
  ) {
    return this.service.create(user.sub, dto);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get current user submitted form requests' })
  findMyRequests(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findMyRequests(user.sub, { page: Number(page), limit: Number(limit) });
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy a historical form request as a new draft' })
  copyRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.copyRequest(user.sub, id);
  }

  // ─── 草稿 ───────────────────────────────────────────

  @Post('drafts')
  @ApiOperation({ summary: 'Save a form draft' })
  saveDraft(
    @CurrentUser() user: any,
    @Body() dto: { formType: string; title?: string; content: Record<string, unknown> },
  ) {
    return this.service.saveDraft(user.sub, dto);
  }

  @Get('drafts')
  @ApiOperation({ summary: 'Get current user form drafts' })
  findMyDrafts(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findMyDrafts(user.sub, { page: Number(page), limit: Number(limit) });
  }

  @Patch('drafts/:id')
  @ApiOperation({ summary: 'Update a form draft' })
  updateDraft(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { title?: string; content?: Record<string, unknown> },
  ) {
    return this.service.updateDraft(user.sub, id, dto);
  }

  @Delete('drafts/:id')
  @ApiOperation({ summary: 'Delete a form draft' })
  deleteDraft(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteDraft(user.sub, id);
  }

  @Post('drafts/:id/submit')
  @ApiOperation({ summary: 'Submit a draft as a formal form request' })
  submitDraft(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.submitDraft(user.sub, id);
  }

  // ─── 填寫模板 ────────────────────────────────────────

  @Post('fill-templates')
  @ApiOperation({ summary: 'Save a fill template' })
  createFillTemplate(
    @CurrentUser() user: any,
    @Body() dto: { formType: string; name: string; description?: string; content: Record<string, unknown>; isFavorite?: boolean },
  ) {
    return this.service.createFillTemplate(user.sub, dto);
  }

  @Get('fill-templates')
  @ApiOperation({ summary: 'Get current user fill templates' })
  findMyFillTemplates(
    @CurrentUser() user: any,
    @Query('formType') formType?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findMyFillTemplates(user.sub, { formType, page: Number(page), limit: Number(limit) });
  }

  @Patch('fill-templates/:id')
  @ApiOperation({ summary: 'Update a fill template' })
  updateFillTemplate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; content?: Record<string, unknown>; isFavorite?: boolean; isEnabled?: boolean },
  ) {
    return this.service.updateFillTemplate(user.sub, id, dto);
  }

  @Delete('fill-templates/:id')
  @ApiOperation({ summary: 'Delete a fill template' })
  deleteFillTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteFillTemplate(user.sub, id);
  }

  @Post('fill-templates/:id/use')
  @ApiOperation({ summary: 'Use a fill template (returns content and updates lastUsedAt)' })
  useFillTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.useFillTemplate(user.sub, id);
  }
}
