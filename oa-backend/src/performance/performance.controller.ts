import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Performance')
@ApiBearerAuth('access-token')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  // ─── Cycles ────────────────────────────────────────────────────────────────

  @Get('cycles')
  @ApiOperation({ summary: 'List performance cycles' })
  findAllCycles(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllCycles({ status, page: Number(page), limit: Number(limit) });
  }

  @Get('cycles/:id')
  @ApiOperation({ summary: 'Get one performance cycle' })
  findOneCycle(@Param('id') id: string) {
    return this.service.findOneCycle(id);
  }

  @Post('cycles')
  @ApiOperation({ summary: 'Create performance cycle' })
  createCycle(@Body() dto: any) {
    return this.service.createCycle(dto);
  }

  @Patch('cycles/:id')
  @ApiOperation({ summary: 'Update performance cycle' })
  updateCycle(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateCycle(id, dto);
  }

  @Post('cycles/:id/activate')
  @ApiOperation({ summary: 'Activate cycle (draft → goal_setting)' })
  activateCycle(@Param('id') id: string) {
    return this.service.activateCycle(id);
  }

  @Post('cycles/:id/complete')
  @ApiOperation({ summary: 'Complete cycle' })
  completeCycle(@Param('id') id: string) {
    return this.service.completeCycle(id);
  }

  // ─── Goals ─────────────────────────────────────────────────────────────────

  @Get('goals')
  @ApiOperation({ summary: 'List performance goals' })
  findAllGoals(
    @Query('cycleId') cycleId?: string,
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllGoals({ cycleId, userId, page: Number(page), limit: Number(limit) });
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create performance goal' })
  createGoal(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.createGoal(user.sub, dto);
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Update performance goal' })
  updateGoal(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.service.updateGoal(id, user.sub, dto);
  }

  // ─── Reviews ───────────────────────────────────────────────────────────────

  @Get('reviews')
  @ApiOperation({ summary: 'List performance reviews' })
  findAllReviews(
    @Query('cycleId') cycleId?: string,
    @Query('revieweeUserId') revieweeUserId?: string,
    @Query('reviewerUserId') reviewerUserId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAllReviews({ cycleId, revieweeUserId, reviewerUserId, status, page: Number(page), limit: Number(limit) });
  }

  @Post('reviews')
  @ApiOperation({ summary: 'Create performance review' })
  createReview(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.createReview(user.sub, dto);
  }

  @Patch('reviews/:id')
  @ApiOperation({ summary: 'Update performance review' })
  updateReview(@Param('id') id: string, @Body() dto: any) {
    return this.service.updateReview(id, dto);
  }
}
