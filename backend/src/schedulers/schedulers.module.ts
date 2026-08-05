import { Module } from '@nestjs/common';
import { SchedulersService } from './schedulers.service';
import { SchedulersController } from './schedulers.controller';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { CronService } from './cron/cron.service';
import { SchedulerProcessor } from './scheduler.process';
import { SCHEDULER_QUEUE } from './constants/scheduler.contants';
import { SchedulerExcelService } from './excel/scheduler-excel.service';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({
    name: SCHEDULER_QUEUE,
  })],
  controllers: [SchedulersController],
  providers: [SchedulersService, RolesGuard, PermissionGuard, CronService, SchedulerProcessor,
    SchedulerExcelService
  ],
})
export class SchedulersModule { }