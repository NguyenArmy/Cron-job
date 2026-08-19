import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
@Controller('roles')
//kiểm tr 2 guards: kiểm tra đăng nhập và kiểm tra có phải admin không "ADMIN"
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  @RequirePermission('role:create')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  @RequirePermission('role:read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermission('role:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('role:update')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermission('role:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
