import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { MinioService } from '../minio/minio.service';

type UploadedFile = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};

@Injectable()
export class FilesService {
    constructor(private readonly minioService: MinioService) { }

    async upload(file: UploadedFile, userId: number) {

        //lấy đuôi file từ tên gốc của file
        const extension = extname(file.originalname).toLowerCase();



        //tạo tên file mới để lưu vào minio, tránh bị lặp
        const objectName = `uploads/${userId}/${randomUUID()}${extension}`;

        await this.minioService.uploadFile(
            objectName,
            file.buffer,
            file.mimetype,
        );

        return {
            message: 'Tải file lên thành công',
            objectName,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
        };
    }
}