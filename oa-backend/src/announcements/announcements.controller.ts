import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AnnouncementsService } from './announcements.service'
import {
  CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto,
} from './dto/announcement.dto'

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: '公告列表' })
  getAll(@Query() query: AnnouncementQueryDto) {
    return this.service.findAll(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '公告詳情' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '新增公告' })
  create(@Body() dto: CreateAnnouncementDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新公告' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除公告（軟刪除）' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id)
  }
}
