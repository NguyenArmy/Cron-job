import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly userDetails = {
    id: true,
    name: true,
    roleId: true,
    createdAt: true,
    updatedAt: true,
    account: {
      select: {
        email: true,
      },
    },
    role: {
      select: {
        id: true,
        name: true,
      },
    },
    _count: {
      select: {
        createdSchedules: true,
        assignedSchedules: true,
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        id: 'asc',
      },
      select: this.userDetails,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: this.userDetails,
    });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const currentUser = await this.findOne(id);

    const data: {
      name?: string;
      roleId?: number;
    } = {};

    if (updateUserDto.name !== undefined) {
      data.name = updateUserDto.name.trim();
    }

    if (updateUserDto.roleId !== undefined) {
      const role = await this.prisma.role.findUnique({
        where: {
          id: updateUserDto.roleId,
        },
        select: {
          id: true,
        },
      });

      if (!role) {
        throw new NotFoundException('Role không tồn tại');
      }

      data.roleId = role.id;
    }

    const roleChanged =
      data.roleId !== undefined && data.roleId !== currentUser.roleId;

    return this.prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: {
          id,
        },
        data,
        select: this.userDetails,
      });

      const revokedAccounts = roleChanged
        ? await transaction.account.updateMany({
          where: {
            userId: id,
          },
          data: {
            refreshTokenHash: null,
          },
        })
        : { count: 0 };

      return {
        ...updatedUser,
        sessionRevoked: revokedAccounts.count > 0,
      };
    });
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ConflictException(
        'Không thể tự xoá tài khoản đang đăng nhập',
      );
    }

    const user = await this.findOne(id);

    await this.prisma.user.delete({
      where: {
        id,
      },
    });

    return {
      message: `Đã xoá user ${user.account?.email ?? id}`,
    };
  }
}