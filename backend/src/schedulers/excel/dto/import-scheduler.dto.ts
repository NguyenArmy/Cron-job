import { Transform } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class ImportSchedulerDto {
    @IsString({ message: 'Tên lịch phải là chuỗi' })
    @IsNotEmpty({ message: 'Tên lịch không được để trống' })
    name!: string;

    @IsString({ message: 'Cron phải là chuỗi' })
    @IsNotEmpty({ message: 'Cron không được để trống' })
    cron!: string;

    @IsOptional()
    @IsString({ message: 'Timezone phải là chuỗi' })
    timezone?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === undefined) return undefined;
        if (String(value).toLowerCase() === 'true') return true;
        if (String(value).toLowerCase() === 'false') return false;
        return value;
    })
    @IsBoolean({ message: 'Trạng thái chỉ được nhập true hoặc false' })
    isActive?: boolean;

    @IsOptional()
    @IsString({ message: 'Mô tả phải là chuỗi' })
    description?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined;

        return String(value)
            .split(',')
            .map((id) => Number(id.trim()));
    })
    @IsArray({ message: 'Danh sách người được giao không hợp lệ' })
    @IsInt({ each: true, message: 'ID người được giao phải là số nguyên' })
    assignedUserIds?: number[];
}