import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mariadb from 'mariadb';

@Injectable()
export class MariaDbService implements OnModuleDestroy {
    private readonly pool: mariadb.Pool;

    constructor(private readonly configService: ConfigService) {
        const connectionUrl =
            this.configService.getOrThrow<string>('MARIADB_URL');

        this.pool = mariadb.createPool(connectionUrl);
    }


    //dùng để lấy connection từ pool healcheck
    async ping(): Promise<void> {
        const connection = await this.pool.getConnection();

        try {


            await connection.query('SELECT 1');
        } finally {
            connection.release();
        }
    }
    async query<T = unknown>(
        sql: string,
        values: unknown[] = [],
    ): Promise<T> {
        const connection = await this.pool.getConnection();

        try {
            return (await connection.query(sql, values)) as T;
        } finally {
            connection.release();
        }
    }

    async transaction<T>(
        callback: (connection: mariadb.PoolConnection) => Promise<T>,
    ): Promise<T> {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction();

            const result = await callback(connection);

            await connection.commit();

            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.pool.end();
    }
}