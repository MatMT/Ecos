import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // hash the passwd
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        institutionId:  null,
        fullName: createUserDto.full_name,
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
      },
      omit: {
        passwordHash: true,
      }
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
        omit: {
             passwordHash: true,
        }
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
       omit: {
             passwordHash: true,
        },
    });
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
    });
  }
}