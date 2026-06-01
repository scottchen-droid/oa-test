import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Forms')
@ApiBearerAuth('access-token')
@Controller('forms')
export class FormsController {
  constructor(private readonly service: FormsService) {}

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
}
