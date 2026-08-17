import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
    private readonly client: Minio.Client;
    private readonly bucketName: string;

    constructor(private readonly configService: ConfigService) {
        this.bucketName =
            this.configService.getOrThrow<string>('MINIO_BUCKET_NAME');

        this.client = new Minio.Client({
            endPoint: this.configService.getOrThrow<string>('MINIO_ENDPOINT'),
            port: Number(this.configService.getOrThrow('MINIO_PORT')),
            useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
            accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
            secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
        });
    }



    //khi chạy server thì kiểm tra xem bucket đã tồn tại chưa

    async onModuleInit() {
        const bucketExists = await this.client.bucketExists(this.bucketName);

        if (!bucketExists) {

            //chưa có thì tự tạo bucketminio
            await this.client.makeBucket(this.bucketName);
        }
    }

    async uploadFile(
        objectName: string,
        buffer: Buffer,
        contentType: string,
    ) {
        await this.client.putObject(
            this.bucketName,
            objectName,
            buffer,
            buffer.length,
            { 'Content-Type': contentType },
        );

        return { objectName };
    }
}