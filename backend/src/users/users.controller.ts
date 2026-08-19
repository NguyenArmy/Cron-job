import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RequirePermission } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequirePermission('user:read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission('user:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('user:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermission('user:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: { user: JwtPayload },
  ) {
    return this.usersService.remove(id, request.user.sub);
  }
}