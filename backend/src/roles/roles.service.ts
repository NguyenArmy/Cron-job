import { ConflictException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const roleName = createRoleDto.name.trim().toUpperCase();
    const permissionNames = [
      ...new Set((createRoleDto.permissions ?? []).map((name) => name.trim())),
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
    return 'This action returns all roles';
  }

  findOne(id: number) {
    return 'This action returns a #' + id + ' role';
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return 'This action updates a #' + id + ' role';
  }

  remove(id: number) {
    return 'This action removes a #' + id + ' role';
  }
}
