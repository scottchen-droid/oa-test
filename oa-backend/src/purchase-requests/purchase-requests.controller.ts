import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseRequestsService } from './purchase-requests.service';

@ApiTags('Purchase Requests')
@ApiBearerAuth('access-token')
@Controller('purchase-requests')
export class PurchaseRequestsController {
  constructor(private readonly service: PurchaseRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase requests' })
  findAll(
    @Query('status') status?: string,
    @Query('applicantUserId') applicantUserId?: string,
    @Query('companyId') companyId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({ status, applicantUserId, companyId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one purchase request with allocations' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create purchase request' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase request' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit purchase request for approval' })
  submit(@Param('id') id: string) {
    return this.service.submit(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel purchase request' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
