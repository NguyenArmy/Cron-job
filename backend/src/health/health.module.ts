import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MariaDbModule } from '../mariadb/mariadb.module';
import { MinioModule } from '../minio/minio.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
    imports: [
        PrismaModule,
        MariaDbModule,
        MinioModule,
    ],
    controllers: [HealthController],
    providers: [HealthService],
})
export class HealthModule { }