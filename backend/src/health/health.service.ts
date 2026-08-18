import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { MariaDbService } from '../mariadb/mariadb.service';
import { MinioService } from '../minio/minio.service';

type CheckResult = {
    status: 'up' | 'down';
    error?: string;
};

@Injectable()
export class HealthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mariaDbService: MariaDbService,
        private readonly minioService: MinioService,
        private readonly configService: ConfigService,
    ) { }

    async check() {
        const entries = await Promise.all([
            this.runCheck('postgres', async () => {
                await this.prisma.$queryRaw`SELECT 1`;
            }),

            this.runCheck('redis', async () => {
                const redis = new Redis({
                    host: this.configService.get<string>('REDIS_HOST', 'localhost'),
                    port: Number(this.configService.get('REDIS_PORT', 6379)),
                    password:
                        this.configService.get<string>('REDIS_PASSWORD') || undefined,
                    connectTimeout: 2_000,
                    maxRetriesPerRequest: 1,
                    lazyConnect: true,
                });

                try {
                    await redis.connect();
                    await redis.ping();
                } finally {
                    redis.disconnect();
                }
            }),

            this.runCheck('mariadb', async () => {
                await this.mariaDbService.ping();
            }),

            this.runCheck('minio', async () => {
                await this.minioService.ping();
            }),
        ]);

        const checks = Object.fromEntries(entries) as Record<string, CheckResult>;

        const isHealthy = Object.values(checks).every(
            (check) => check.status === 'up',
        );

        return {
            status: isHealthy ? 'ok' : 'error',
            checks,
        };
    }

    private async runCheck(
        name: string,
        check: () => Promise<void>,
    ): Promise<[string, CheckResult]> {
        try {
            await check();

            return [name, { status: 'up' }];
        } catch (error) {
            return [
                name,
                {
                    status: 'down',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            ];
        }
    }
}