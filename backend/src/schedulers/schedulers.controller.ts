import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,

} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { SchedulersService } from './schedulers.service';
import { CreateSchedulerDto } from './dto/create-scheduler.dto';
import { UpdateSchedulerDto } from './dto/update-scheduler.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { RequirePermission } from 'src/auth/decorators/permissions.decorator';
import { ValidateCronDto } from './cron/validate-cron.dto';
type UploadedExcelFile = {
  originalname: string;
  buffer: Buffer;
};

@Controller('schedulers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class SchedulersController {
  constructor(
    private readonly schedulersService: SchedulersService,

  ) { }

  @Post('import')
  @RequirePermission('scheduler:create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async importSchedulers(
    @UploadedFile() file: UploadedExcelFile,
    @Req() req: any,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel để import');
    }

    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('Chỉ chấp nhận file Excel .xlsx');
    }

    const result = await this.schedulersService.importSchedulers(
      file.buffer,
      req.user.sub,
    );

    if (result.errorFile) {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="scheduler-import-errors.xlsx"',
      );

      return res.send(result.errorFile);
    }

    return res.json(result);
  }


  //lấy template import scheduler
  @Get('import-template')
  @RequirePermission('scheduler:create')
  async downloadImportTemplate(
    @Req() req: any,
    @Res() res: Response,
  ) {
    const buffer = await this.schedulersService.getImportTemplate(
      req.user.sub,
    );
    //nói với trình duyệt rằng đây là file excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );


    //nói với broser tải xuống với tên là scheduler-import-template.xlsx
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="scheduler-import-template.xlsx"',
    );

    res.send(buffer);
  }



  //export scheduler
  @Get('export')
  @RequirePermission('scheduler:read')
  async exportSchedulers(
    @Req() req: any,
    @Res() res: Response,
  ) {
    const buffer = await this.schedulersService.exportSchedulers(
      req.user.sub,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="schedulers.xlsx"',
    );

    res.send(buffer);
  }

  @Post('validate-cron')
  @RequirePermission('scheduler:create')
  validateCron(
    @Body() dto: ValidateCronDto,
  ) {
    return this.schedulersService.validateCron(
      dto.cron,
      dto.timezone,
    );
  }

  @Post()
  @RequirePermission('scheduler:create')
  create(@Body() createSchedulerDto: CreateSchedulerDto, @Req() req: any) {
    return this.schedulersService.create(createSchedulerDto, req.user.sub);
  }

  @Get()
  @RequirePermission('scheduler:read')
  findAll(@Req() req: any) {
    return this.schedulersService.findAll(req.user.sub);
  }

  @Get('active')
  @RequirePermission('scheduler:read')
  findActive(@Req() req: any) {
    return this.schedulersService.findActive(req.user.sub);
  }

  @Get('paused')
  @RequirePermission('scheduler:read')
  findPaused(@Req() req: any) {
    return this.schedulersService.findPaused(req.user.sub);
  }

  @Get(':id')
  @RequirePermission('scheduler:read')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.schedulersService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  @RequirePermission('scheduler:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSchedulerDto: UpdateSchedulerDto,
    @Req() req: any,
  ) {
    return this.schedulersService.update(id, updateSchedulerDto, req.user.sub);
  }

  @Patch(':id/pause')
  @RequirePermission('scheduler:update')
  pauseOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.schedulersService.pauseOne(id, req.user.sub);
  }

  @Patch(':id/resume')
  @RequirePermission('scheduler:update')
  resumeOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.schedulersService.resumeOne(id, req.user.sub);
  }

  @Patch('pause-all')
  @RequirePermission('scheduler:update')
  pauseAll(@Req() req: any) {
    return this.schedulersService.pauseAllSchedulers(req.user.sub);
  }

  @Patch('resume-all')
  @RequirePermission('scheduler:update')
  resumeAll(@Req() req: any) {
    return this.schedulersService.resumeAllSchedulers(req.user.sub);
  }

  @Delete(':id')
  @RequirePermission('scheduler:delete')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.schedulersService.remove(id, req.user.sub);
  }

  @Delete()
  @RequirePermission('scheduler:delete')
  removeAll(@Req() req: any) {
    return this.schedulersService.removeAllSchedulers(req.user.sub);
  }
}
