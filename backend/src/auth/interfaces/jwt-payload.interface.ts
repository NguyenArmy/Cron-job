export type JwtPermissions = Record<string, boolean>;

export interface JwtPayload {
  sub: number; //userid
  email: string;
  role: string;
  permissions: JwtPermissions;
}
