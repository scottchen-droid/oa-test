import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReimbursementsService, CreateReimbursementDto, UpdateReimbursementDto } from './reimbursements.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reimbursements')
@ApiBearerAuth('access-token')
@Controller('reimbursements')
export class ReimbursementsController {
  constructor(private readonly service: ReimbursementsService) {}

  @Get()
  @ApiOperation({ summary: 'List reimbursement requests (finance admin view)' })
  findAll(
    @Query('status') status?: string,
    @Query('claimantUserId') claimantUserId?: string,
    @Query('companyId') companyId?: string,
    @Query('purchaseRequestId') purchaseRequestId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({ status, claimantUserId, companyId, purchaseRequestId, dateFrom, dateTo, page: Number(page), limit: Number(limit) });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user reimbursement requests' })
  findMine(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findMyReimbursements(user.id, { status, page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one reimbursement request with items' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create reimbursement request (draft)' })
  create(@CurrentUser() user: any, @Body() dto: CreateReimbursementDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reimbursement request (draft only)' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateReimbursementDto) {
    return this.service.update(id, user.id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit reimbursement request for approval' })
  submit(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.submit(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel reimbursement request' })
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.cancel(id, user.id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Mark reimbursement as paid (finance admin)' })
  pay(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.pay(id, user.id);
  }
}
