import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OvertimeService } from './overtime.service';

@ApiTags('Overtime')
@ApiBearerAuth('access-token')
@Controller('overtime')
export class OvertimeController {
  constructor(private readonly service: OvertimeService) {}

  @Get()
  @ApiOperation({ summary: 'List overtime requests' })
  findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({ userId, status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one overtime request' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create overtime request' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update overtime request' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel overtime request' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
