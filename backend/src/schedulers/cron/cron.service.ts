import { BadRequestException, Injectable } from '@nestjs/common';
import { CronExpressionParser } from 'cron-parser';
import { CreateSchedulerDto } from '../dto/create-scheduler.dto';

@Injectable()
export class CronService {
  private readonly defaultTimezone = 'Asia/Ho_Chi_Minh';

  validateAndGetNextRun(cron: string, timezone?: string) {
    const resolvedTimezone = timezone?.trim() || this.defaultTimezone;

    try {
      const interval = CronExpressionParser.parse(cron, {
        currentDate: new Date(),
        tz: resolvedTimezone,
      });

      const nextRunTime = interval.next().toDate();

      return {
        isValid: true,
        cron,
        timezone: resolvedTimezone,
        nextRunTime,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cron expression không hợp lệ';

      throw new BadRequestException({
        isValid: false,
        cron,
        timezone: resolvedTimezone,
        message,
      });
    }
  }
  buildCron(dto: CreateSchedulerDto): string {
    if (dto.inputMode === 'cron') {
      if (!dto.cron) {
        throw new BadRequestException('Cron là bắt buộc');
      }

      return dto.cron.trim();
    }

    const { scheduleType, minute, hour } = dto;

    if (!scheduleType) {
      throw new BadRequestException('Loại lịch là bắt buộc');
    }

    switch (scheduleType) {
      case 'every_minutes':
        if (dto.everyMinutes === undefined) {
          throw new BadRequestException('Số phút lặp là bắt buộc');
        }

        return `*/${dto.everyMinutes} * * * *`;

      case 'daily':
        if (minute === undefined || hour === undefined) {
          throw new BadRequestException('Giờ và phút là bắt buộc');
        }

        return `${minute} ${hour} * * *`;

      case 'weekly':
        if (
          minute === undefined ||
          hour === undefined ||
          dto.dayOfWeek === undefined
        ) {
          throw new BadRequestException('Giờ, phút và thứ là bắt buộc');
        }

        return `${minute} ${hour} * * ${dto.dayOfWeek}`;

      case 'monthly':
        if (
          minute === undefined ||
          hour === undefined ||
          dto.dayOfMonth === undefined
        ) {
          throw new BadRequestException('Giờ, phút và ngày trong tháng là bắt buộc');
        }

        return `${minute} ${hour} ${dto.dayOfMonth} * *`;

      default:
        throw new BadRequestException('Loại lịch không hợp lệ');
    }
  }


}
