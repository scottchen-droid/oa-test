import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  OrganizationsService,
  CreateRegionDto, CreateCompanyDto, CreateDepartmentDto,
  CreateBusinessUnitDto, CreateProjectDto, CreatePositionDto,
  CreateJobLevelDto, AssignOrgDto,
} from './organizations.service';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller()
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  // ---- Group Org Chart ----
  @Get('org-chart/group')
  @ApiOperation({ summary: '集團視角組織圖（事業部 → 項目 → 部門 → 成員）' })
  getGroupOrgChart() {
    return this.service.getGroupOrgChart();
  }

  // ---- Regions ----
  @Get('regions')
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiOperation({ summary: 'List regions' })
  getRegions(@Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.service.findAllRegions(active);
  }

  @Get('regions/:id')
  getRegion(@Param('id') id: string) { return this.service.findOneRegion(id); }

  @Post('regions')
  createRegion(@Body() dto: CreateRegionDto) { return this.service.createRegion(dto); }

  @Patch('regions/:id')
  updateRegion(@Param('id') id: string, @Body() dto: Partial<CreateRegionDto>) {
    return this.service.updateRegion(id, dto);
  }

  @Patch('regions/:id/toggle-active')
  toggleRegion(@Param('id') id: string) { return this.service.toggleRegionActive(id); }

  // ---- Companies ----
  @Get('companies')
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  getCompanies(@Query('regionId') regionId?: string, @Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.service.findAllCompanies(regionId, active);
  }

  @Get('companies/:id')
  getCompany(@Param('id') id: string) { return this.service.findOneCompany(id); }

  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto) { return this.service.createCompany(dto); }

  @Patch('companies/:id')
  updateCompany(@Param('id') id: string, @Body() dto: Partial<CreateCompanyDto>) {
    return this.service.updateCompany(id, dto);
  }

  @Patch('companies/:id/toggle-active')
  toggleCompany(@Param('id') id: string) { return this.service.toggleCompanyActive(id); }

  // ---- Departments ----
  @Get('departments')
  @ApiQuery({ name: 'companyId', required: true })
  getDepartments(@Query('companyId') companyId: string) {
    return this.service.findDepartmentTree(companyId);
  }

  @Get('departments/:id')
  getDepartment(@Param('id') id: string) { return this.service.findOneDepartment(id); }

  @Get('departments/:id/members')
  getDeptMembers(@Param('id') id: string) { return this.service.getDepartmentMembers(id); }

  @Post('departments')
  createDepartment(@Body() dto: CreateDepartmentDto) { return this.service.createDepartment(dto); }

  @Patch('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() dto: Partial<CreateDepartmentDto>) {
    return this.service.updateDepartment(id, dto);
  }

  // ---- Business Units ----
  @Get('business-units')
  getBUs(@Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.service.findAllBusinessUnits(active);
  }

  @Post('business-units')
  createBU(@Body() dto: CreateBusinessUnitDto) { return this.service.createBusinessUnit(dto); }

  @Patch('business-units/:id')
  updateBU(@Param('id') id: string, @Body() dto: Partial<CreateBusinessUnitDto>) {
    return this.service.updateBusinessUnit(id, dto);
  }

  @Patch('business-units/:id/toggle-active')
  toggleBU(@Param('id') id: string) { return this.service.toggleBusinessUnitActive(id); }

  // ---- Projects ----
  @Get('projects')
  @ApiQuery({ name: 'businessUnitId', required: false })
  getProjects(@Query('businessUnitId') buId?: string, @Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.service.findAllProjects(buId, active);
  }

  @Post('projects')
  createProject(@Body() dto: CreateProjectDto) { return this.service.createProject(dto); }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() dto: Partial<CreateProjectDto>) {
    return this.service.updateProject(id, dto);
  }

  @Patch('projects/:id/toggle-active')
  toggleProject(@Param('id') id: string) { return this.service.toggleProjectActive(id); }

  // ---- Positions ----
  @Get('positions')
  @ApiQuery({ name: 'companyId', required: false })
  getPositions(@Query('companyId') companyId?: string, @Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.service.findAllPositions(companyId, active);
  }

  @Post('positions')
  createPosition(@Body() dto: CreatePositionDto) { return this.service.createPosition(dto); }

  @Patch('positions/:id')
  updatePosition(@Param('id') id: string, @Body() dto: Partial<CreatePositionDto>) {
    return this.service.updatePosition(id, dto);
  }

  // ---- Job Levels ----
  @Get('job-levels')
  getJobLevels(@Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined;
    return this.service.findAllJobLevels(active);
  }

  @Post('job-levels')
  createJobLevel(@Body() dto: CreateJobLevelDto) { return this.service.createJobLevel(dto); }

  @Patch('job-levels/:id')
  updateJobLevel(@Param('id') id: string, @Body() dto: Partial<CreateJobLevelDto>) {
    return this.service.updateJobLevel(id, dto);
  }

  // ---- User Org Assignments ----
  @Get('user-org/:userId')
  getUserOrg(@Param('userId') userId: string) {
    return this.service.getUserOrgAssignments(userId);
  }

  @Post('user-org/:userId')
  createUserOrg(@Param('userId') userId: string, @Body() dto: AssignOrgDto) {
    return this.service.createUserOrgAssignment(userId, dto);
  }

  @Patch('user-org/assignment/:id')
  updateUserOrg(@Param('id') id: string, @Body() dto: Partial<AssignOrgDto>) {
    return this.service.updateUserOrgAssignment(id, dto);
  }

  @Delete('user-org/assignment/:id')
  deleteUserOrg(@Param('id') id: string) {
    return this.service.deleteUserOrgAssignment(id);
  }
}
