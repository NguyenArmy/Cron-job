import { SetMetadata } from '@nestjs/common';
import { JwtPermissions } from '../interfaces/jwt-payload.interface';

export const PERMISSIONS_KEY = 'permissions';

export type PermissionKey = keyof JwtPermissions;

export const RequirePermission = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
