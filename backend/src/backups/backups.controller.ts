import {
    Controller,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BackupsService } from './backups.service';

@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BackupsController {
    constructor(private readonly backupsService: BackupsService) { }

    @Post()
    requestBackup() {
        return this.backupsService.requestBackup();
    }
}