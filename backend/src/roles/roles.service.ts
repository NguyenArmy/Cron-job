import { ConflictException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) { }


  //tạo role và add permissions vào role đó
  async createRole(createRoleDto: CreateRoleDto) {
    const roleName = createRoleDto.name.trim().toUpperCase();
    const permissionNames = [
      ...new Set((createRoleDto.permissions ?? []).map((name) => name.trim().toLowerCase())),
    ];

    const existingRole = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (existingRole) {
      throw new ConflictException('Role da ton tai');
    }

    return this.prisma.role.create({
      data: {
        name: roleName,
        permissions: {
          create: permissionNames.map((permissionName) => ({
            permission: {
              connectOrCreate: {
                where: { name: permissionName },
                create: { name: permissionName },
              },
            },
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  findAll() {
    return this.prisma.role.findMany({
      orderBy: {
        id: 'asc'
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })
  }

  async findOne(id: number) {

    const role = await this.prisma.role.findUnique({
      where: {
        id: id
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })
    if (!role) {
      throw new ConflictException('Role không tồn tại');
    }
    return role;

  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);

    const data: {
      name?: string;
      permissions?: {
        deleteMany: Record<string, never>;
        create: Array<{
          permission: {
            connectOrCreate: {
              where: { name: string };
              create: { name: string };
            };
          };
        }>;
      };
    } = {};

    if (updateRoleDto.name !== undefined) {
      const roleName = updateRoleDto.name.trim().toUpperCase();

      const existingRole = await this.prisma.role.findUnique({
        where: {
          name: roleName,
        },
      });

      if (existingRole && existingRole.id !== id) {
        throw new ConflictException('Role đã tồn tại');
      }

      data.name = roleName;
    }

    if (updateRoleDto.permissions !== undefined) {
      const permissionNames = [
        ...new Set(
          updateRoleDto.permissions
            .map((name) => name.trim().toLowerCase())
            .filter(Boolean),
        ),
      ];

      data.permissions = {
        deleteMany: {},
        create: permissionNames.map((permissionName) => ({
          permission: {
            connectOrCreate: {
              where: {
                name: permissionName,
              },
              create: {
                name: permissionName,
              },
            },
          },
        })),
      };
    }

    return this.prisma.$transaction(async (transaction) => {
      const updatedRole = await transaction.role.update({
        where: {
          id,
        },
        data,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      const revokedAccounts = await transaction.account.updateMany({
        where: {
          user: {
            roleId: id,
          },
        },
        data: {
          refreshTokenHash: null,
        },
      });

      return {
        ...updatedRole,
        revokedUserCount: revokedAccounts.count,
      };
    });
  }

  async remove(id: number) {
    const role = await this.findOne(id);

    if (role.name === 'USER') {
      throw new ConflictException('Không thể xoá role mặc định USER');
    }

    const defaultRole = await this.prisma.role.findUnique({
      where: {
        name: 'USER',
      },
    });

    if (!defaultRole) {
      throw new ConflictException(
        'Không tìm thấy role mặc định USER để chuyển user sang',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const revokedAccounts = await transaction.account.updateMany({
        where: {
          user: {
            roleId: id,
          },
        },
        data: {
          refreshTokenHash: null,
        },
      });

      const reassignedUsers = await transaction.user.updateMany({
        where: {
          roleId: id,
        },
        data: {
          roleId: defaultRole.id,
        },
      });

      await transaction.role.delete({
        where: {
          id,
        },
      });

      return {
        message: `Đã xoá role ${role.name}`,
        reassignedUserCount: reassignedUsers.count,
        revokedUserCount: revokedAccounts.count,
        defaultRole: defaultRole.name,
      };
    });
  }
}
