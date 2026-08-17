import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { MariaDbModule } from '../mariadb/mariadb.module';
import { BACKUP_QUEUE } from './backup.constants';
import { BackupsService } from './backups.service';
import { BackupsController } from './backups.controller';
import { BackupProcessor } from './backup.processor';

@Module({
    imports: [
        PrismaModule,
        MariaDbModule,
        BullModule.registerQueue({
            name: BACKUP_QUEUE,
        }),
    ],
    controllers: [BackupsController],
    providers: [BackupsService, BackupProcessor],
})
export class BackupsModule { }