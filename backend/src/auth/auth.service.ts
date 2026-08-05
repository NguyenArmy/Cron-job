import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, JwtPermissions } from './interfaces/jwt-payload.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private toPermissionMap(
    rolePermissions: Array<{ permission: { name: string } }>,
  ): JwtPermissions {
    return Object.fromEntries(
      rolePermissions.map(({ permission }) => [permission.name, true]),
    );
  }

  async generateTokens(payload: JwtPayload) {
    //accessToken
    const accessTokenSecret = this.configService.getOrThrow(
      'ACCESS_TOKEN_SECRET',
    );
    const refreshTokenSecret = this.configService.getOrThrow(
      'REFRESH_TOKEN_SECRET',
    );
    const accessTokenExpiresIn =
      this.configService.getOrThrow('ACCESS_TOKEN_EXPIRES_IN') ?? '15m';
    const refreshTokenExpiresIn =
      this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);
    return { accessToken, refreshToken };
  }
  // }
  // đăng ký
  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    //chuẩn hoá email để tránh trùng do chữ hoa/ thường
    const normalizedEmail = email.trim().toLowerCase();

    //kiểm tra email/account đã tồn tại chưa
    const existingAcount = await this.prisma.account.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        userId: true,
      },
    });
    if (existingAcount) {
      throw new ConflictException('Email đã tồn tại');
    }

    //tìm role mặc định cho tài khoản mới.
    const defaultRole = await this.prisma.role.findUnique({
      where: {
        name: 'USER',
      },
      select: {
        id: true,
      },
    });
    if (!defaultRole) {
      throw new UnauthorizedException('Không tìm thấy role mặc định');
    }
    //hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: username,
          roleId: defaultRole.id,
        },
        select: {
          id: true,
          name: true,
          roleId: true,
        },
      });
      const account = await this.prisma.account.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          userId: user.id,
        },
        select: {
          email: true,
          userId: true,
        },
      });
      return { user, account };
    } catch (error) {
      throw new Error('Đã xảy ra lỗi khi tạo tài khoản');
    }
  }

  // đăng nhập
  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const password = loginDto.password;
    const account = await this.prisma.account.findUnique({
      where: {
        email: email,
      },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    if (!account) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }
    const permissions = this.toPermissionMap(account.user.role.permissions);

    const payload: JwtPayload = {
      sub: account.user.id,
      email: account.email,
      role: account.user.role.name,
      permissions,
    };
    const token = await this.generateTokens(payload);
    const refreshTokenHash = await bcrypt.hash(token.refreshToken, 10);
    await this.prisma.account.update({
      where: {
        email: account.email,
      },
      data: {
        refreshTokenHash: refreshTokenHash,
      },
    });
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      user: {
        id: account.user.id,
        name: account.user.name,
        email: account.email,
        role: account.user.role.name,
        permissions: account.user.role.permissions,
      },
    };
  }

  //refresh token tạo lại access token mới và refresh token mới
  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Refresh token không tìm thấy');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const account = await this.prisma.account.findUnique({
      where: {
        userId: payload.sub,
      },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    if (!account) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    if (!account.refreshTokenHash) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ, phiên đăng nhập không còn hiệu lực',
      );
    }
    const permissions = this.toPermissionMap(account.user.role.permissions);

    //so sánh refresh token được gửi lên với refresh token đã lưu trong cơ sở dữ liệu
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      account.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ, phiên đăng nhập không còn hiệu lực',
      );
    }

    const newPayload: JwtPayload = {
      sub: account.user.id,
      email: account.email,
      role: account.user.role.name,
      permissions,
    };
    const tokens = await this.generateTokens(newPayload);
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.account.update({
      where: {
        userId: account.user.id,
      },
      data: {
        refreshTokenHash: newRefreshTokenHash,
      },
    });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: account.user.id,
        name: account.user.name,
        email: account.email,
        role: account.user.role.name,
        permissions: account.user.role.permissions,
      },
    };
  }

  //logout
  async logout(userId: number) {
    await this.prisma.account.update({
      where: {
        userId,
      },
      data: {
        refreshTokenHash: null,
      },
    });
    return {
      message: 'Logout thành công',
    };
  }
}
