import { Module } from '@nestjs/common';
import { MariaDbService } from './mariadb.service';
import { MariaDbController } from './mariadb.controller';

@Module({
    controllers: [MariaDbController],
    providers: [MariaDbService],
    exports: [MariaDbService],

})
export class MariaDbModule { }