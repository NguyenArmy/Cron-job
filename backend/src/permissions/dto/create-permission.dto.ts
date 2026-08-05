import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export const PERMISSIONS = [
  'scheduler:create',
  'scheduler:read',
  'scheduler:update',
  'scheduler:delete',
  'role:create',
  'role:read',
  'role:update',
  'role:delete',
] as const;
