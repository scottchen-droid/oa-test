import { Controller, Get, Post, Patch, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  FormDefinitionsService,
  CreateFormDefinitionDto,
  UpdateFormDefinitionDto,
  PermissionRule,
} from './form-definitions.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

// ─── 員工端 ──────────────────────────────────────────────────────────────────

@ApiTags('Forms - Definitions')
@ApiBearerAuth('access-token')
@Controller('forms/definitions')
export class FormDefinitionsController {
  constructor(private readonly service: FormDefinitionsService) {}

  /**
   * GET /api/forms/definitions
   * 員工端：依使用者權限回傳可見的表單定義列表
   */
  @Get()
  @ApiOperation({ summary: 'Get accessible form definitions for current user' })
  getAccessibleDefinitions(@CurrentUser() user: JwtPayload) {
    return this.service.getAccessibleDefinitions(user.sub);
  }
}

// ─── 管理端 ──────────────────────────────────────────────────────────────────

@ApiTags('System - Form Definitions')
@ApiBearerAuth('access-token')
@Controller('system/form-definitions')
export class SystemFormDefinitionsController {
  constructor(private readonly service: FormDefinitionsService) {}

  /**
   * GET /api/system/form-definitions
   * 管理端：取得所有表單定義（無權限篩選）
   */
  @Get()
  @ApiOperation({ summary: '[Admin] List all form definitions' })
  findAll(
    @Query('category') category?: string,
    @Query('isEnabled') isEnabled?: string,
  ) {
    const params: { category?: string; isEnabled?: boolean } = {};
    if (category) params.category = category;
    if (isEnabled !== undefined) params.isEnabled = isEnabled === 'true';
    return this.service.findAll(params);
  }

  /**
   * POST /api/system/form-definitions
   * 管理端：建立新表單定義
   */
  @Post()
  @ApiOperation({ summary: '[Admin] Create a form definition' })
  create(@Body() dto: CreateFormDefinitionDto) {
    return this.service.create(dto);
  }

  /**
   * PATCH /api/system/form-definitions/:id
   * 管理端：更新表單定義
   */
  @Patch(':id')
  @ApiOperation({ summary: '[Admin] Update a form definition' })
  update(@Param('id') id: string, @Body() dto: UpdateFormDefinitionDto) {
    return this.service.update(id, dto);
  }

  /**
   * GET /api/system/form-definitions/:id/permissions
   * 管理端：取得某表單的 permissions（附帶 targetName）
   */
  @Get(':id/permissions')
  @ApiOperation({ summary: '[Admin] Get permissions for a form definition' })
  getPermissions(@Param('id') id: string) {
    return this.service.getPermissions(id);
  }

  /**
   * PUT /api/system/form-definitions/:id/permissions
   * 管理端：替換某表單的所有 permissions
   */
  @Put(':id/permissions')
  @ApiOperation({ summary: '[Admin] Replace all permissions for a form definition' })
  setPermissions(
    @Param('id') id: string,
    @Body() body: { rules: PermissionRule[] },
  ) {
    return this.service.setPermissions(id, body.rules);
  }
}
