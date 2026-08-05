import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, RolesGuard, PermissionGuard],
})
export class PermissionsModule {}
