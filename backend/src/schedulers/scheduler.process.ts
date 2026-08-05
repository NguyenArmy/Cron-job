import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service';
import {
  RUN_SCHEDULER_JOB,
  SCHEDULER_QUEUE,
} from './constants/scheduler.contants';
import { CronService } from './cron/cron.service';

interface SchedulerJobData {
  schedulerId: number;
}

@Processor(SCHEDULER_QUEUE, {
  concurrency: 5,
})
export class SchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(SchedulerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cronService: CronService,
  ) {
    super();
  }

  async process(job: Job<SchedulerJobData>): Promise<void> {
    if (job.name !== RUN_SCHEDULER_JOB) {
      this.logger.warn(`Không hỗ trợ job ${job.name}`);
      return;
    }

    const scheduler = await this.prisma.scheduler.findUnique({
      where: {
        id: job.data.schedulerId,
      },
      include: {
        assignments: true,
      },
    });

    if (!scheduler) {
      this.logger.warn(`Scheduler ${job.data.schedulerId} không tồn tại`);
      return;
    }

    if (!scheduler.isActive) {
      this.logger.log(`Scheduler ${scheduler.id} đang bị tạm dừng`);
      return;
    }

    this.logger.log(
      `Bắt đầu thực thi Scheduler ${scheduler.id}: ${scheduler.name}`,
    );

    this.logger.log(
      `Các user được giao: ${
        scheduler.assignments.length > 0
          ? scheduler.assignments.map((item) => item.userId).join(', ')
          : 'Không có'
      }`,
    );

    const executedAt = new Date();

    const cronResult = this.cronService.validateAndGetNextRun(
      scheduler.cron,
      scheduler.timezone,
    );

    await this.prisma.scheduler.update({
      where: {
        id: scheduler.id,
      },
      data: {
        lastRunTime: executedAt,
        nextRunTime: cronResult.nextRunTime,
      },
    });

    this.logger.log(
      `Hoàn thành Scheduler ${scheduler.id}. Lần tiếp theo: ${cronResult.nextRunTime.toISOString()}`,
    );
  }
}
