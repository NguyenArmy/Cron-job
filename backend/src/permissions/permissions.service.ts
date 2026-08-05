import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const name = createPermissionDto.name.trim();

    try {
      return await this.prisma.permission.create({
        data: { name },
      });
    } catch {
      throw new ConflictException('Permission da ton tai');
    }
  }

  findAll() {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission khong ton tai');
    }

    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    await this.findOne(id);

    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto.name
        ? { name: updatePermissionDto.name.trim() }
        : {},
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
