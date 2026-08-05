import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [RolesController],
  providers: [RolesService, RolesGuard, PermissionGuard],
})
export class RolesModule {}
