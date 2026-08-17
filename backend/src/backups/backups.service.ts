import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { MariaDbService } from '../mariadb/mariadb.service';
import {
    BACKUP_QUEUE,
    RUN_BACKUP_JOB,
} from './backup.constants';

@Injectable()
export class BackupsService implements OnModuleInit {
    constructor(
        @InjectQueue(BACKUP_QUEUE)
        private readonly backupQueue: Queue,
        private readonly mariaDbService: MariaDbService,
    ) { }

    async onModuleInit(): Promise<void> {
        await this.ensureBackupMetadataTables();
    }

    private async ensureBackupMetadataTables(): Promise<void> {
        const statements = [
            `
      CREATE TABLE IF NOT EXISTS backup_runs (
        id CHAR(36) NOT NULL,
        status VARCHAR(20) NOT NULL,
        current_table VARCHAR(64) NULL,
        requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        started_at DATETIME(3) NULL,
        completed_at DATETIME(3) NULL,
        error_message TEXT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX idx_backup_runs_status (status)
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS backup_checkpoints (
        backup_id CHAR(36) NOT NULL,
        source_table VARCHAR(64) NOT NULL,
        last_processed_id BIGINT NOT NULL DEFAULT 0,
        processed_count BIGINT NOT NULL DEFAULT 0,
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (backup_id, source_table),
        CONSTRAINT fk_checkpoint_backup
          FOREIGN KEY (backup_id) REFERENCES backup_runs(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS roles (
        id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_roles_name (name)
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS permissions (
        id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_permissions_name (name)
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        CONSTRAINT fk_role_permissions_role
          FOREIGN KEY (role_id) REFERENCES roles(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_role_permissions_permission
          FOREIGN KEY (permission_id) REFERENCES permissions(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL,
        name VARCHAR(255) NULL,
        role_id INT NOT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_users_role
          FOREIGN KEY (role_id) REFERENCES roles(id)
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS accounts (
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        refresh_token_hash VARCHAR(255) NULL,
        PRIMARY KEY (user_id),
        UNIQUE KEY uq_accounts_email (email),
        CONSTRAINT fk_accounts_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS schedulers (
        id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        cron VARCHAR(255) NOT NULL,
        timezone VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT FALSE,
        next_run_time DATETIME(3) NULL,
        last_run_time DATETIME(3) NULL,
        description TEXT NULL,
        created_by_id INT NOT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_schedulers_created_by
          FOREIGN KEY (created_by_id) REFERENCES users(id)
      ) ENGINE=InnoDB
    `,
            `
      CREATE TABLE IF NOT EXISTS task_assignments (
        id INT NOT NULL,
        schedule_id INT NOT NULL,
        user_id INT NOT NULL,
        assigned_at DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_task_assignments_schedule_user (schedule_id, user_id),
        CONSTRAINT fk_task_assignments_schedule
          FOREIGN KEY (schedule_id) REFERENCES schedulers(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_task_assignments_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `,
        ];

        for (const sql of statements) {
            await this.mariaDbService.query(sql);
        }
    }

    async requestBackup() {
        const backupId = randomUUID();

        await this.mariaDbService.query(
            'INSERT INTO backup_runs (id, status) VALUES (?, ?)',
            [backupId, 'QUEUED'],
        );

        await this.backupQueue.add(
            RUN_BACKUP_JOB,
            {
                backupId,
                requestedAt: new Date().toISOString(),
            },
            {
                jobId: `backup-${backupId}`,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5_000,
                },
                removeOnComplete: 100,
                removeOnFail: 100,
            },
        );

        return {
            backupId,
            status: 'QUEUED',
        };
    }
}