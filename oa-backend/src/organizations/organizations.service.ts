import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ---- DTOs ----
export class CreateRegionDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currencyCode?: string;
}

export class CreateCompanyDto {
  @ApiProperty() @IsString() regionId: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() legalName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taxId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currencyCode?: string;
}

export class CreateDepartmentDto {
  @ApiProperty() @IsString() companyId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentDepartmentId?: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
}

export class CreateBusinessUnitDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateProjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() businessUnitId?: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
}

export class CreatePositionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() companyId?: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateJobLevelDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() levelOrder: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class AssignOrgDto {
  @ApiPropertyOptional() @IsOptional() @IsString() companyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() businessUnitId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() positionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobLevelId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() directManagerUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional() @IsOptional() startedAt?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  // ---- Regions ----
  async findAllRegions(isActive?: boolean) {
    return this.prisma.region.findMany({
      where: isActive !== undefined ? { isActive } : {},
      include: { _count: { select: { companies: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneRegion(id: string) {
    const r = await this.prisma.region.findUnique({
      where: { id },
      include: { companies: { where: { isActive: true } } },
    });
    if (!r) throw new NotFoundException('Region not found');
    return r;
  }

  async createRegion(dto: CreateRegionDto) {
    return this.prisma.region.create({ data: dto });
  }

  async updateRegion(id: string, dto: Partial<CreateRegionDto>) {
    await this.findOneRegion(id);
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async toggleRegionActive(id: string) {
    const r = await this.findOneRegion(id);
    return this.prisma.region.update({
      where: { id },
      data: { isActive: !r.isActive },
    });
  }

  // ---- Companies ----
  async findAllCompanies(regionId?: string, isActive?: boolean) {
    return this.prisma.company.findMany({
      where: {
        ...(regionId ? { regionId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { region: true, _count: { select: { departments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneCompany(id: string) {
    const c = await this.prisma.company.findUnique({
      where: { id },
      include: { region: true, departments: { where: { isActive: true } } },
    });
    if (!c) throw new NotFoundException('Company not found');
    return c;
  }

  async createCompany(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto, include: { region: true } });
  }

  async updateCompany(id: string, dto: Partial<CreateCompanyDto>) {
    await this.findOneCompany(id);
    return this.prisma.company.update({ where: { id }, data: dto, include: { region: true } });
  }

  async toggleCompanyActive(id: string) {
    const c = await this.findOneCompany(id);
    return this.prisma.company.update({ where: { id }, data: { isActive: !c.isActive }, include: { region: true } });
  }

  // ---- Departments ----
  async findDepartmentTree(companyId: string) {
    const all = await this.prisma.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    const build = (parentId: string | null): any[] =>
      all
        .filter((d) => d.parentDepartmentId === parentId)
        .map((d) => ({ ...d, children: build(d.id) }));

    return build(null);
  }

  async findOneDepartment(id: string) {
    const d = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        company: true,
      },
    });
    if (!d) throw new NotFoundException('Department not found');
    return d;
  }

  async createDepartment(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  async updateDepartment(id: string, dto: Partial<CreateDepartmentDto>) {
    await this.findOneDepartment(id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async getDepartmentMembers(departmentId: string) {
    return this.prisma.userOrgAssignment.findMany({
      where: { departmentId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            status: true,
          },
        },
        position: true,
        jobLevel: true,
      },
    });
  }

  // ---- Business Units ----
  async findAllBusinessUnits(isActive?: boolean) {
    return this.prisma.businessUnit.findMany({
      where: isActive !== undefined ? { isActive } : {},
      include: { _count: { select: { projects: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createBusinessUnit(dto: CreateBusinessUnitDto) {
    return this.prisma.businessUnit.create({ data: dto });
  }

  async updateBusinessUnit(id: string, dto: Partial<CreateBusinessUnitDto>) {
    return this.prisma.businessUnit.update({ where: { id }, data: dto });
  }

  async toggleBusinessUnitActive(id: string) {
    const bu = await this.prisma.businessUnit.findUnique({ where: { id } });
    if (!bu) throw new NotFoundException('Business unit not found');
    return this.prisma.businessUnit.update({ where: { id }, data: { isActive: !bu.isActive } });
  }

  // ---- Projects ----
  async findAllProjects(businessUnitId?: string, isActive?: boolean) {
    return this.prisma.project.findMany({
      where: {
        ...(businessUnitId ? { businessUnitId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { businessUnit: true },
      orderBy: { name: 'asc' },
    });
  }

  async createProject(dto: CreateProjectDto) {
    return this.prisma.project.create({ data: dto });
  }

  async updateProject(id: string, dto: Partial<CreateProjectDto>) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async toggleProjectActive(id: string) {
    const p = await this.prisma.project.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Project not found');
    return this.prisma.project.update({ where: { id }, data: { isActive: !p.isActive } });
  }

  // ---- Positions ----
  async findAllPositions(companyId?: string, isActive?: boolean) {
    return this.prisma.position.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { company: true },
      orderBy: { name: 'asc' },
    });
  }

  async createPosition(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: dto });
  }

  async updatePosition(id: string, dto: Partial<CreatePositionDto>) {
    return this.prisma.position.update({ where: { id }, data: dto });
  }

  // ---- Job Levels ----
  async findAllJobLevels(isActive?: boolean) {
    return this.prisma.jobLevel.findMany({
      where: isActive !== undefined ? { isActive } : {},
      orderBy: { levelOrder: 'asc' },
    });
  }

  async createJobLevel(dto: CreateJobLevelDto) {
    return this.prisma.jobLevel.create({ data: dto });
  }

  async updateJobLevel(id: string, dto: Partial<CreateJobLevelDto>) {
    return this.prisma.jobLevel.update({ where: { id }, data: dto });
  }

  // ---- User Org Assignments ----
  async getUserOrgAssignments(userId: string) {
    return this.prisma.userOrgAssignment.findMany({
      where: { userId },
      include: {
        company: true,
        department: true,
        businessUnit: true,
        project: true,
        position: true,
        jobLevel: true,
        directManager: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async createUserOrgAssignment(userId: string, dto: AssignOrgDto) {
    if (dto.isPrimary) {
      await this.prisma.userOrgAssignment.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return this.prisma.userOrgAssignment.create({
      data: { userId, ...dto } as any,
    });
  }

  async updateUserOrgAssignment(assignmentId: string, dto: Partial<AssignOrgDto>) {
    return this.prisma.userOrgAssignment.update({
      where: { id: assignmentId },
      data: dto as any,
    });
  }

  async deleteUserOrgAssignment(assignmentId: string) {
    return this.prisma.userOrgAssignment.delete({ where: { id: assignmentId } });
  }
}
