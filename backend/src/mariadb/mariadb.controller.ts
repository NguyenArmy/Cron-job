import { Controller, Get } from '@nestjs/common';
import { MariaDbService } from './mariadb.service';

@Controller('mariadb')
export class MariaDbController {
    constructor(private readonly mariaDbService: MariaDbService) { }

    @Get('ping')
    async ping() {
        await this.mariaDbService.ping();

        return {
            status: 'ok',
            database: 'mariadb',
        };
    }
}