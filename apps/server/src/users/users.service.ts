import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        institutionId: null,
        fullName: createUserDto.full_name,
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
      },
      omit: {
        passwordHash: true,
      },
    });
  }

  async findAll(skip = 0, take = 20) {
    return this.prisma.user.findMany({
      skip,
      take: Math.min(take, MAX_PAGE_SIZE),
      omit: {
        passwordHash: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      omit: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('No se ha encontrado el usuario solicitado.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {
      fullName: updateUserDto.full_name,
      email: updateUserDto.email,
      role: updateUserDto.role,
    };

    if (updateUserDto.password) {
      data.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data,
      omit: {
        passwordHash: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({
      where: {
        id,
      },
      omit: {
        passwordHash: true,
      },
    });
  }
}
