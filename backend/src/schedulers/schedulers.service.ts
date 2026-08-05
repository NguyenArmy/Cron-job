import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSchedulerDto } from './dto/create-scheduler.dto';
import { UpdateSchedulerDto } from './dto/update-scheduler.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { SchedulerExcelService } from './excel/scheduler-excel.service';

import {
  RUN_SCHEDULER_JOB,
  SCHEDULER_QUEUE,
} from './constants/scheduler.contants';
import { CronService } from './cron/cron.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportSchedulerDto } from './excel/dto/import-scheduler.dto';

@Injectable()
export class SchedulersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SCHEDULER_QUEUE) private readonly schedulerQueue: Queue,
    private readonly cronService: CronService,
    private readonly schedulerExcelService: SchedulerExcelService,
  ) { }


  //validate dto import tu file excel
  private async validateImportDto(data: Record<string, unknown>) {
    const dto = plainToInstance(ImportSchedulerDto, data);

    const errors = await validate(dto);

    if (errors.length) {
      throw new BadRequestException(
        errors.flatMap((error) => Object.values(error.constraints ?? {})),
      );
    }

    return dto;
  }

  //băt lỗi từ validateImportDto và CronService, trả về mảng message lỗi
  private getImportErrorMessages(error: unknown): string[] {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();

      if (typeof response === 'object' && response !== null) {
        const data = response as { message?: unknown; cron?: unknown };

        // Lỗi từ CronService / cron-parser
        if (data.cron) {
          return ['Biểu thức cron không hợp lệ'];
        }

        // Lỗi từ validateImportDto
        if (Array.isArray(data.message)) {
          return data.message.map(String);
        }

        if (typeof data.message === 'string') {
          return [data.message];
        }
      }
    }

    return [
      error instanceof Error ? error.message : 'Lỗi không xác định',
    ];
  }



  // import danh sach scheduler tu file excel
  async importSchedulers(fileBuffer: Buffer, currentUserId: number) {
    const rows = await this.schedulerExcelService.readImportFile(fileBuffer);

    const imported: Array<{ row: number; schedulerId: number }> = [];
    const errors: Array<{
      row: number;
      data: Record<string, unknown>;
      messages: string[];
    }> = [];


    //xử lý từng dòng trong excel
    for (const row of rows) {
      try {
        const importDto = await this.validateImportDto(row.data);

        const scheduler = await this.create(
          {
            inputMode: 'cron',
            name: importDto.name,
            cron: importDto.cron,
            timezone: importDto.timezone,
            isActive: importDto.isActive,
            description: importDto.description,
            assignedUserIds: importDto.assignedUserIds ?? [currentUserId],
          },
          currentUserId,
        );

        imported.push({
          row: row.rowNumber,
          schedulerId: scheduler.id,
        });
      } catch (error) {
        errors.push({
          row: row.rowNumber,
          data: row.data,
          messages: this.getImportErrorMessages(error),
        });
      }
    }
    const errorFile =
      errors.length > 0
        ? await this.schedulerExcelService.createImportErrorFile(
          errors,
          rows.length,
          imported.length,
        )
        : undefined;

    return {
      totalRows: rows.length,
      importedCount: imported.length,
      failedCount: errors.length,
      imported,
      errors: errors.map(({ row, messages }) => ({ row, messages })),
      errorFile,
    };
  }
  // Lấy template import Scheduler dưới dạng file Excel
  async getImportTemplate(currentUserId: number): Promise<Buffer> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Không tìm thấy user');
    }

    const isAdmin = currentUser.role.name === 'ADMIN';

    return this.schedulerExcelService.createImportTemplate(isAdmin);
  }

  // Export danh sách scheduler sang file Excel
  async exportSchedulers(currentUserId: number): Promise<Buffer> {
    const schedulers = await this.findAll(currentUserId);

    return this.schedulerExcelService.exportSchedulers(schedulers);
  }

  //validate cron va tra ve next run time
  async validateCron(cron: string, timezone?: string) {
    return this.cronService.validateAndGetNextRun(cron, timezone);
  }



  private async findSchedulerCanUpdate(id: number, currentUserId: number) {
    const scheduler = await this.prisma.scheduler.findUnique({
      where: { id },
    });

    if (!scheduler) {
      throw new NotFoundException('Không tìm thấy Scheduler');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Không tìm thấy user');
    }

    const isAdmin = currentUser.role.name === 'ADMIN';

    // User thường chỉ được sửa scheduler mình tạo.
    if (!isAdmin && scheduler.createdById !== currentUserId) {
      throw new ForbiddenException('Bạn chỉ được sửa Scheduler do mình tạo');
    }

    return scheduler;
  }

  // them mot job moi vao hang doi scheduler
  private async addSchedulerJob(scheduler: {
    id: number;
    name: string;
    cron: string;
    timezone: string;
  }): Promise<void> {
    const schedulerJobId = `scheduler-${scheduler.id}`;

    await this.schedulerQueue.upsertJobScheduler(
      schedulerJobId,
      {
        pattern: scheduler.cron,
        tz: scheduler.timezone || 'Asia/Ho_Chi_Minh',
      },
      {
        name: RUN_SCHEDULER_JOB,
        data: {
          schedulerId: scheduler.id,
          name: scheduler.name,
        },
        opts: {

          //xoá job khi hoàn thành hoặc thất bại, tránh tích tụ job cũ
          removeOnComplete: true,


          //lưu lại 50 job thất bại gần nhất
          removeOnFail: 50,
        },
      },
    );
  }

  private async removeSchedulerJob(schedulerId: number): Promise<void> {
    const schedulerJobId = `scheduler-${schedulerId}`;

    await this.schedulerQueue.removeJobScheduler(schedulerJobId);
  }

  /**
   * Kiểm tra toàn bộ user được giao có tồn tại.
   */
  private async validateAssignedUsers(
    assignedUserIds: number[],
  ): Promise<number[]> {
    const uniqueUserIds = [...new Set(assignedUserIds)];

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: uniqueUserIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (users.length !== uniqueUserIds.length) {
      const existingIds = new Set(users.map((user) => user.id));

      const missingIds = uniqueUserIds.filter((id) => !existingIds.has(id));

      throw new NotFoundException(
        `Không tìm thấy user có ID: ${missingIds.join(', ')}`,
      );
    }

    return uniqueUserIds;
  }

  /**
   * Chỉ người tạo được quản lý Scheduler.
   */
  private async findOwnedScheduler(id: number, currentUserId: number) {
    const scheduler = await this.prisma.scheduler.findUnique({
      where: { id },
    });

    if (!scheduler) {
      throw new NotFoundException('Không tìm thấy Scheduler');
    }

    if (scheduler.createdById !== currentUserId) {
      throw new ForbiddenException('Bạn không phải người tạo Scheduler này');
    }

    return scheduler;
  }

  async create(createSchedulerDto: CreateSchedulerDto, currentUserId: number) {
    //check xem user được giao có tồn tại không
    const assignedUserIds = await this.validateAssignedUsers(
      createSchedulerDto.assignedUserIds,
    );

    //validate cron va tra ve next run time
    const cron = this.cronService.buildCron(createSchedulerDto);
    const cronResult = this.cronService.validateAndGetNextRun(
      cron,
      createSchedulerDto.timezone,
    );

    const isActicve = createSchedulerDto.isActive ?? false;

    const scheduler = await this.prisma.scheduler.create({
      data: {
        name: createSchedulerDto.name,
        cron: cron,
        timezone: cronResult.timezone,
        lastRunTime: null,
        nextRunTime: isActicve ? cronResult.nextRunTime : null,
        description: createSchedulerDto.description,
        isActive: isActicve,
        createdBy: {
          connect: { id: currentUserId },
        },
        assignments: {
          create: assignedUserIds.map((userId) => ({
            user: {
              connect: { id: userId },
            },
          })),
        },
      },
      include: {
        createdBy: true,
        assignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (scheduler.isActive) {
      await this.addSchedulerJob(scheduler);
    }
    return scheduler;
  }

  async findAll(currentUserId: number) {
    return this.prisma.scheduler.findMany({
      where: {
        OR: [
          {
            createdById: currentUserId,
          },
          {
            assignments: {
              some: {
                userId: currentUserId,
              },
            },
          },
        ],
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
        createdBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, currentUserId: number) {
    const scheduler = await this.prisma.scheduler.findFirst({
      where: {
        id,
        OR: [
          {
            createdById: currentUserId,
          },
          {
            assignments: {
              some: {
                userId: currentUserId,
              },
            },
          },
        ],
      },
      include: {
        createdBy: true,
        assignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!scheduler) {
      throw new NotFoundException('Scheduler khong ton tai');
    }

    return scheduler;
  }

  async findActive(currentUserId: number) {
    return this.prisma.scheduler.findMany({
      where: {
        isActive: true,
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPaused(currentUserId: number) {
    return this.prisma.scheduler.findMany({
      where: {
        isActive: false,
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  //các task được `tạo` bởi user hiện tại
  async findMyCreated(currentUserId: number) {
    return this.prisma.scheduler.findMany({
      where: {
        createdById: currentUserId,
      },

      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  //các task được giao cho user hiện tại
  async findMyAssigned(currentUserId: number) {
    return this.prisma.scheduler.findMany({
      where: {
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: number, dto: UpdateSchedulerDto, currentUserId: number) {
    const existing = await this.findSchedulerCanUpdate(id, currentUserId);


    const timezone = dto.timezone ?? existing.timezone;
    const isActive = dto.isActive ?? existing.isActive;
    const cron =
      dto.inputMode === undefined
        ? existing.cron
        : this.cronService.buildCron({
          ...dto,
          inputMode: dto.inputMode,
          name: existing.name,
          assignedUserIds: dto.assignedUserIds ?? [],
        });

    let assignedUserIds: number[] | undefined;
    if (dto.assignedUserIds !== undefined) {
      assignedUserIds = await this.validateAssignedUsers(dto.assignedUserIds);
    }

    const cronResult = this.cronService.validateAndGetNextRun(cron, timezone);

    const scheduler = await this.prisma.scheduler.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        cron,
        timezone: cronResult.timezone,
        isActive,
        nextRunTime: isActive ? cronResult.nextRunTime : null,

        ...(dto.assignedUserIds !== undefined
          ? {
            assignments: {
              deleteMany: {},
              create: dto.assignedUserIds!.map((userId) => ({
                userId,
              })),
            },
          }
          : {}),
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (scheduler.isActive) {
      await this.addSchedulerJob(scheduler);
    } else {
      await this.removeSchedulerJob(id);
    }

    return scheduler;
  }

  async remove(id: number, currentUserId: number) {
    await this.findSchedulerCanUpdate(id, currentUserId);
    await this.removeSchedulerJob(id);
    return this.prisma.scheduler.delete({
      where: { id },
    });
  }

  async removeAllSchedulers(currentUserId: number) {
    const schedulers = await this.prisma.scheduler.findMany({
      where: {
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
      },
    });

    for (const scheduler of schedulers) {
      await this.removeSchedulerJob(scheduler.id);
    }

    return this.prisma.scheduler.deleteMany({
      where: {
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
      },
    });
  }

  async pauseOne(id: number, currentUserId: number) {
    const scheduler = await this.findOwnedScheduler(id, currentUserId);

    if (!scheduler.isActive) {
      return scheduler; // Nếu scheduler đã bị tạm dừng, không cần thực hiện gì thêm
    }
    await this.removeSchedulerJob(id);

    return this.prisma.scheduler.update({
      where: { id },
      data: {
        isActive: false,
        nextRunTime: null,
      },
    });
  }

  async pauseAllSchedulers(currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    const isAdmin = user.role.name === 'ADMIN';

    if (!isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền tạm dừng tất cả Scheduler',
      );
    }
    const schedulers = await this.prisma.scheduler.findMany({
      where: {
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
        isActive: true,
      },
    });

    const results = await this.prisma.scheduler.updateMany({
      where: {
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    for (const scheduler of schedulers) {
      await this.removeSchedulerJob(scheduler.id);
    }

    return {
      message: 'Đã tạm dừng Scheduler',
      count: schedulers.length,
    };
  }

  async resumeOne(id: number, currentUserId: number) {
    const scheduler = await this.findSchedulerCanUpdate(id, currentUserId);

    const cronResult = this.cronService.validateAndGetNextRun(
      scheduler.cron,
      scheduler.timezone,
    );

    const updatedScheduler = await this.prisma.scheduler.update({
      where: { id },
      data: {
        isActive: true,
        nextRunTime: cronResult.nextRunTime,
      },
    });
    await this.addSchedulerJob(scheduler);
    return updatedScheduler;
  }

  async resumeAllSchedulers(currentUserId: number) {
    const schedulers = await this.prisma.scheduler.findMany({
      where: {
        assignments: {
          some: {
            userId: currentUserId,
          },
        },
        isActive: false,
      },
    });
    const resumedSchedulers: typeof schedulers = [];
    for (const scheduler of schedulers) {
      const cronResult = this.cronService.validateAndGetNextRun(
        scheduler.cron,
        scheduler.timezone,
      );

      const updatedScheduler = await this.prisma.scheduler.update({
        where: {
          id: scheduler.id,
        },

        data: {
          isActive: true,
          nextRunTime: cronResult.nextRunTime,
        },
      });

      await this.addSchedulerJob(updatedScheduler);

      resumedSchedulers.push(updatedScheduler);
    }

    return {
      message: 'Đã tiếp tục tất cả Scheduler do bạn tạo',
      count: resumedSchedulers.length,
      schedulers: resumedSchedulers,
    };
  }
}
