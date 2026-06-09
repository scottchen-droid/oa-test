import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResourceItemsService } from './resource-items.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('System - Resource Items')
@ApiBearerAuth('access-token')
@Controller('system/resource-items')
export class ResourceItemsSystemController {
  constructor(private readonly service: ResourceItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all resource items (system)' })
  findAll(@Query('isEnabled') isEnabled?: string) {
    const parsed =
      isEnabled === 'true' ? true : isEnabled === 'false' ? false : undefined;
    return this.service.findAll({ isEnabled: parsed });
  }

  @Post()
  @ApiOperation({ summary: 'Create resource item' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resource item' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle resource item enabled status' })
  toggle(@Param('id') id: string) {
    return this.service.toggleEnabled(id);
  }
}

@ApiTags('Resource Items')
@ApiBearerAuth('access-token')
@Controller('resource-items')
export class ResourceItemsController {
  constructor(private readonly service: ResourceItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List enabled resource items (employee)' })
  findEnabled(@CurrentUser() _user: JwtPayload) {
    return this.service.findAll({ isEnabled: true });
  }
}
