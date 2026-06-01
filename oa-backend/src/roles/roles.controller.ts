import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService, CreateRoleDto, AssignPermissionsDto, AssignRoleDto } from './roles.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('access-token')
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'List all roles' })
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a role (Super Admin)' })
  createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: JwtPayload) {
    return this.rolesService.createRole(dto, user.sub);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update a role (Super Admin)' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoleDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.updateRole(id, dto, user.sub);
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: 'Set role permissions (replaces existing)' })
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.assignPermissionsToRole(id, dto.permissionIds, user.sub);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all permissions grouped by module' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('users/:userId/roles')
  @ApiOperation({ summary: 'Assign a role to a user' })
  assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.assignRoleToUser(userId, dto, user.sub);
  }

  @Delete('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Revoke a role from a user' })
  revokeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.revokeRoleFromUser(userId, roleId, user.sub);
  }

  @Post('seed/roles')
  @ApiOperation({ summary: 'Seed default roles and permissions (run once on setup)' })
  seedDefaults() {
    return this.rolesService.seedDefaultRolesAndPermissions();
  }
}
