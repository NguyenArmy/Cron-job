import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsValidCron } from '../cron/is-valid-cron.validator';

export class CreateSchedulerDto {
  @IsIn(['cron', 'schedule'])
  inputMode!: 'cron' | 'schedule';

  @IsString()
  @IsNotEmpty()
  name!: string;

  // Chỉ bắt buộc khi người dùng nhập cron trực tiếp
  @ValidateIf((dto: CreateSchedulerDto) => dto.inputMode === 'cron')
  @IsString()
  @IsNotEmpty()
  @IsValidCron()
  cron?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  // Chỉ bắt buộc khi người dùng chọn lịch dễ dùng
  @ValidateIf((dto: CreateSchedulerDto) => dto.inputMode === 'schedule')
  @IsIn(['every_minutes', 'daily', 'weekly', 'monthly'])
  scheduleType?: 'every_minutes' | 'daily' | 'weekly' | 'monthly';

  @ValidateIf(
    (dto: CreateSchedulerDto) =>
      dto.inputMode === 'schedule' && dto.scheduleType === 'every_minutes',
  )
  @IsInt()
  @Min(1)
  everyMinutes?: number;

  @ValidateIf(
    (dto: CreateSchedulerDto) =>
      dto.inputMode === 'schedule' && dto.scheduleType !== 'every_minutes',
  )
  @IsInt()
  @Min(0)
  @Max(59)
  minute?: number;

  @ValidateIf(
    (dto: CreateSchedulerDto) =>
      dto.inputMode === 'schedule' && dto.scheduleType !== 'every_minutes',
  )
  @IsInt()
  @Min(0)
  @Max(23)
  hour?: number;

  @ValidateIf(
    (dto: CreateSchedulerDto) =>
      dto.inputMode === 'schedule' && dto.scheduleType === 'weekly',
  )
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ValidateIf(
    (dto: CreateSchedulerDto) =>
      dto.inputMode === 'schedule' && dto.scheduleType === 'monthly',
  )
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  assignedUserIds!: number[];
}