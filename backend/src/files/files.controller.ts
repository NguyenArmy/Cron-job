import {
    BadRequestException,
    Controller,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';

type UploadedFile = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10 MB
            },
        }),
    )
    async upload(
        @UploadedFile() file: UploadedFile,
        @Req() req: { user: { sub: number } },
    ) {
        if (!file) {
            throw new BadRequestException('Vui lòng chọn file để tải lên');
        }

        return this.filesService.upload(file, req.user.sub);
    }
}