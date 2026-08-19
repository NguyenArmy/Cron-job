import { Type } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    roleId?: number;
}