import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService,
    RolesGuard,
    PermissionGuard,
  ],
})
export class UsersModule { }

