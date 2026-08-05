import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ValidateCronDto {
  @IsString()
  @IsNotEmpty()
  cron!: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
