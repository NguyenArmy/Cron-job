import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MariaDbService } from '../mariadb/mariadb.service';
import {
    BACKUP_QUEUE,
    RUN_BACKUP_JOB,
} from './backup.constants';

type BackupJobData = {
    backupId: string;
    requestedAt: string;
};

type CheckpointRow = {
    last_processed_id: number | string;
};

@Processor(BACKUP_QUEUE)
export class BackupProcessor extends WorkerHost {
    private readonly logger = new Logger(BackupProcessor.name);
    private readonly batchSize = 1_000;

    constructor(
        private readonly prisma: PrismaService,
        private readonly mariaDbService: MariaDbService,
    ) {
        super();
    }

    async process(job: Job<BackupJobData>): Promise<void> {
        if (job.name !== RUN_BACKUP_JOB) {
            this.logger.warn(`Không hỗ trợ job ${job.name}`);
            return;
        }

        const { backupId } = job.data;

        try {
            await this.mariaDbService.query(
                `
          UPDATE backup_runs
          SET status = ?, started_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
                ['RUNNING', backupId],
            );

            this.logger.log(`Bắt đầu backup ${backupId}`);

            await this.backupRoles(backupId);
            await this.backupPermissions(backupId);
            await this.backupRolePermissions(backupId);
            await this.backupUsers(backupId);
            await this.backupAccounts(backupId);
            await this.backupSchedulers(backupId);
            await this.backupTaskAssignments(backupId);

            await this.mariaDbService.query(
                `
          UPDATE backup_runs
          SET status = ?,
              current_table = NULL,
              completed_at = CURRENT_TIMESTAMP(3)
          WHERE id = ?
        `,
                ['COMPLETED', backupId],
            );

            this.logger.log(`Hoàn thành backup ${backupId}`);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Lỗi backup không xác định';

            await this.mariaDbService.query(
                `
          UPDATE backup_runs
          SET status = ?, error_message = ?
          WHERE id = ?
        `,
                ['FAILED', message, backupId],
            );

            throw error;
        }
    }

    private async backupRoles(backupId: string): Promise<void> {
        await this.mariaDbService.query(
            `
        UPDATE backup_runs
        SET current_table = ?
        WHERE id = ?
      `,
            ['roles', backupId],
        );

        const roles = await this.prisma.role.findMany({
            orderBy: {
                id: 'asc',
            },
        });

        await this.mariaDbService.transaction(async (connection) => {
            for (const role of roles) {
                await connection.query(
                    `
            INSERT INTO roles (id, name, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              created_at = VALUES(created_at),
              updated_at = VALUES(updated_at)
          `,
                    [
                        role.id,
                        role.name,
                        role.createdAt,
                        role.updatedAt,
                    ],
                );
            }
        });

        this.logger.log(`Đã backup ${roles.length} role`);
    }

    private async getLastProcessedId(
        backupId: string,
        sourceTable: string,
    ): Promise<number> {
        const rows = await this.mariaDbService.query<CheckpointRow[]>(
            `
        SELECT last_processed_id
        FROM backup_checkpoints
        WHERE backup_id = ? AND source_table = ?
      `,
            [backupId, sourceTable],
        );

        return Number(rows[0]?.last_processed_id ?? 0);
    }

    private async backupUsers(backupId: string): Promise<void> {
        const sourceTable = 'users';

        let lastProcessedId = await this.getLastProcessedId(
            backupId,
            sourceTable,
        );

        await this.mariaDbService.query(
            `
        UPDATE backup_runs
        SET current_table = ?
        WHERE id = ?
      `,
            [sourceTable, backupId],
        );

        while (true) {
            const users = await this.prisma.user.findMany({
                where: {
                    id: {
                        gt: lastProcessedId,
                    },
                },
                orderBy: {
                    id: 'asc',
                },
                take: this.batchSize,
            });

            if (users.length === 0) {
                return;
            }

            const currentBatchLastId = users[users.length - 1].id;

            await this.mariaDbService.transaction(async (connection) => {
                for (const user of users) {
                    await connection.query(
                        `
              INSERT INTO users (
                id,
                name,
                role_id,
                created_at,
                updated_at
              )
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                role_id = VALUES(role_id),
                created_at = VALUES(created_at),
                updated_at = VALUES(updated_at)
            `,
                        [
                            user.id,
                            user.name,
                            user.roleId,
                            user.createdAt,
                            user.updatedAt,
                        ],
                    );
                }

                await connection.query(
                    `
            INSERT INTO backup_checkpoints (
              backup_id,
              source_table,
              last_processed_id,
              processed_count
            )
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              last_processed_id = VALUES(last_processed_id),
              processed_count = processed_count + VALUES(processed_count)
          `,
                    [
                        backupId,
                        sourceTable,
                        currentBatchLastId,
                        users.length,
                    ],
                );
            });

            lastProcessedId = currentBatchLastId;

            this.logger.log(
                `Backup users: đã xử lý đến ID ${lastProcessedId}`,
            );
        }
    }
    private async backupSchedulers(backupId: string): Promise<void> {
        const sourceTable = 'schedulers';

        let lastProcessedId = await this.getLastProcessedId(
            backupId,
            sourceTable,
        );

        await this.mariaDbService.query(
            `
      UPDATE backup_runs
      SET current_table = ?
      WHERE id = ?
    `,
            [sourceTable, backupId],
        );

        while (true) {
            const schedulers = await this.prisma.scheduler.findMany({
                where: {
                    id: {
                        gt: lastProcessedId,
                    },
                },
                orderBy: {
                    id: 'asc',
                },
                take: this.batchSize,
            });

            if (schedulers.length === 0) {
                return;
            }

            const currentBatchLastId =
                schedulers[schedulers.length - 1].id;

            await this.mariaDbService.transaction(async (connection) => {
                for (const scheduler of schedulers) {
                    await connection.query(
                        `
            INSERT INTO schedulers (
              id,
              name,
              cron,
              timezone,
              is_active,
              next_run_time,
              last_run_time,
              description,
              created_by_id,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              cron = VALUES(cron),
              timezone = VALUES(timezone),
              is_active = VALUES(is_active),
              next_run_time = VALUES(next_run_time),
              last_run_time = VALUES(last_run_time),
              description = VALUES(description),
              created_by_id = VALUES(created_by_id),
              created_at = VALUES(created_at),
              updated_at = VALUES(updated_at)
          `,
                        [
                            scheduler.id,
                            scheduler.name,
                            scheduler.cron,
                            scheduler.timezone,
                            scheduler.isActive,
                            scheduler.nextRunTime,
                            scheduler.lastRunTime,
                            scheduler.description,
                            scheduler.createdById,
                            scheduler.createdAt,
                            scheduler.updatedAt,
                        ],
                    );
                }

                await connection.query(
                    `
          INSERT INTO backup_checkpoints (
            backup_id,
            source_table,
            last_processed_id,
            processed_count
          )
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            last_processed_id = VALUES(last_processed_id),
            processed_count = processed_count + VALUES(processed_count)
        `,
                    [
                        backupId,
                        sourceTable,
                        currentBatchLastId,
                        schedulers.length,
                    ],
                );
            });

            lastProcessedId = currentBatchLastId;

            this.logger.log(
                `Backup schedulers: đã xử lý đến ID ${lastProcessedId}`,
            );
        }
    }
    private async backupPermissions(backupId: string): Promise<void> {
        await this.mariaDbService.query(
            `
      UPDATE backup_runs
      SET current_table = ?
      WHERE id = ?
    `,
            ['permissions', backupId],
        );

        const permissions = await this.prisma.permission.findMany({
            orderBy: {
                id: 'asc',
            },
        });

        await this.mariaDbService.transaction(async (connection) => {
            for (const permission of permissions) {
                await connection.query(
                    `
          INSERT INTO permissions (id, name)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name)
        `,
                    [permission.id, permission.name],
                );
            }
        });

        this.logger.log(
            `Đã backup ${permissions.length} permission`,
        );
    }

    private async backupRolePermissions(
        backupId: string,
    ): Promise<void> {
        await this.mariaDbService.query(
            `
      UPDATE backup_runs
      SET current_table = ?
      WHERE id = ?
    `,
            ['role_permissions', backupId],
        );

        const rolePermissions =
            await this.prisma.rolePermission.findMany({
                orderBy: [
                    {
                        roleId: 'asc',
                    },
                    {
                        permissionId: 'asc',
                    },
                ],
            });

        await this.mariaDbService.transaction(async (connection) => {
            for (const rolePermission of rolePermissions) {
                await connection.query(
                    `
          INSERT IGNORE INTO role_permissions (
            role_id,
            permission_id
          )
          VALUES (?, ?)
        `,
                    [
                        rolePermission.roleId,
                        rolePermission.permissionId,
                    ],
                );
            }
        });

        this.logger.log(
            `Đã backup ${rolePermissions.length} role permission`,
        );
    }

    private async backupAccounts(backupId: string): Promise<void> {
        const sourceTable = 'accounts';

        let lastProcessedId = await this.getLastProcessedId(
            backupId,
            sourceTable,
        );

        await this.mariaDbService.query(
            `
      UPDATE backup_runs
      SET current_table = ?
      WHERE id = ?
    `,
            [sourceTable, backupId],
        );

        while (true) {
            const accounts = await this.prisma.account.findMany({
                where: {
                    userId: {
                        gt: lastProcessedId,
                    },
                },
                orderBy: {
                    userId: 'asc',
                },
                take: this.batchSize,
            });

            if (accounts.length === 0) {
                return;
            }

            const currentBatchLastId =
                accounts[accounts.length - 1].userId;

            await this.mariaDbService.transaction(async (connection) => {
                for (const account of accounts) {
                    await connection.query(
                        `
            INSERT INTO accounts (
              user_id,
              email,
              password,
              refresh_token_hash
            )
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              email = VALUES(email),
              password = VALUES(password),
              refresh_token_hash = VALUES(refresh_token_hash)
          `,
                        [
                            account.userId,
                            account.email,
                            account.password,
                            account.refreshTokenHash,
                        ],
                    );
                }

                await connection.query(
                    `
          INSERT INTO backup_checkpoints (
            backup_id,
            source_table,
            last_processed_id,
            processed_count
          )
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            last_processed_id = VALUES(last_processed_id),
            processed_count = processed_count + VALUES(processed_count)
        `,
                    [
                        backupId,
                        sourceTable,
                        currentBatchLastId,
                        accounts.length,
                    ],
                );
            });

            lastProcessedId = currentBatchLastId;

            this.logger.log(
                `Backup accounts: đã xử lý đến user ID ${lastProcessedId}`,
            );
        }
    }

    private async backupTaskAssignments(
        backupId: string,
    ): Promise<void> {
        const sourceTable = 'task_assignments';

        let lastProcessedId = await this.getLastProcessedId(
            backupId,
            sourceTable,
        );

        await this.mariaDbService.query(
            `
      UPDATE backup_runs
      SET current_table = ?
      WHERE id = ?
    `,
            [sourceTable, backupId],
        );

        while (true) {
            const assignments =
                await this.prisma.taskAssignment.findMany({
                    where: {
                        id: {
                            gt: lastProcessedId,
                        },
                    },
                    orderBy: {
                        id: 'asc',
                    },
                    take: this.batchSize,
                });

            if (assignments.length === 0) {
                return;
            }

            const currentBatchLastId =
                assignments[assignments.length - 1].id;

            await this.mariaDbService.transaction(async (connection) => {
                for (const assignment of assignments) {
                    await connection.query(
                        `
            INSERT INTO task_assignments (
              id,
              schedule_id,
              user_id,
              assigned_at
            )
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              schedule_id = VALUES(schedule_id),
              user_id = VALUES(user_id),
              assigned_at = VALUES(assigned_at)
          `,
                        [
                            assignment.id,
                            assignment.scheduleId,
                            assignment.userId,
                            assignment.assignedAt,
                        ],
                    );
                }

                await connection.query(
                    `
          INSERT INTO backup_checkpoints (
            backup_id,
            source_table,
            last_processed_id,
            processed_count
          )
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            last_processed_id = VALUES(last_processed_id),
            processed_count = processed_count + VALUES(processed_count)
        `,
                    [
                        backupId,
                        sourceTable,
                        currentBatchLastId,
                        assignments.length,
                    ],
                );
            });

            lastProcessedId = currentBatchLastId;

            this.logger.log(
                `Backup task_assignments: đã xử lý đến ID ${lastProcessedId}`,
            );
        }
    }
}