import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReimbursementsService } from './reimbursements.service';

@ApiTags('Reimbursements')
@ApiBearerAuth('access-token')
@Controller('reimbursements')
export class ReimbursementsController {
  constructor(private readonly service: ReimbursementsService) {}

  @Get()
  @ApiOperation({ summary: 'List reimbursement requests' })
  findAll(
    @Query('status') status?: string,
    @Query('claimantUserId') claimantUserId?: string,
    @Query('companyId') companyId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({ status, claimantUserId, companyId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one reimbursement request with items' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create reimbursement request' })
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reimbursement request' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit reimbursement request for approval' })
  submit(@Param('id') id: string) {
    return this.service.submit(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel reimbursement request' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Mark reimbursement as paid (finance admin)' })
  pay(@Param('id') id: string) {
    return this.service.pay(id);
  }
}
