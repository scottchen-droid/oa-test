import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService, BootstrapDto } from './admin.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get('bootstrap/status')
  @ApiOperation({ summary: 'Check if initial super admin setup is required' })
  getBootstrapStatus() {
    return this.adminService.getBootstrapStatus();
  }

  @Public()
  @Post('bootstrap')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create initial super admin (only works when no super admin exists)' })
  bootstrap(@Body() dto: BootstrapDto) {
    return this.adminService.bootstrap(dto);
  }
}
