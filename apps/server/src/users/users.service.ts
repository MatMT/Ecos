import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Provisioning is admin-only (enforced by RolesGuard + the remote_users_insert RLS
   * policy). The new user always lands in the creating admin's own institution — the
   * client cannot choose one, since the RLS policy would reject any other value anyway.
   */
  create(createUserDto: CreateUserDto, institutionId: number | null) {
    return this.prisma.withRls((tx) =>
      this.createUserRecord(tx, createUserDto, institutionId),
    );
  }

  /**
   * Same as create(), but takes an already-open transaction instead of opening its own —
   * lets other services (e.g. StudentsService, PsychologistsService) create a User and
   * their own profile row as one atomic unit, without nesting a second withRls().
   */
  async createUserRecord(
    tx: Prisma.TransactionClient,
    createUserDto: CreateUserDto,
    institutionId: number | null,
  ) {
    const goTrueUser = await this.authService.adminCreateUser(
      createUserDto.email,
      createUserDto.password,
    );

    return tx.user.create({
      data: {
        id: goTrueUser.id,
        institutionId,
        fullName: createUserDto.full_name,
        email: createUserDto.email,
        role: createUserDto.role,
      },
    });
  }

  async findAll(skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.user.findMany({ skip, take: Math.min(take, MAX_PAGE_SIZE) }),
    );
  }

  async findOne(id: string) {
    const user = await this.prisma.withRls((tx) =>
      tx.user.findUnique({ where: { id } }),
    );

    if (!user) {
      throw new NotFoundException('No se ha encontrado el usuario solicitado.');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {
      fullName: updateUserDto.full_name,
      email: updateUserDto.email,
      role: updateUserDto.role,
    };

    if (updateUserDto.password) {
      await this.authService.adminUpdatePassword(id, updateUserDto.password);
    }

    return this.prisma.withRls((tx) => tx.user.update({ where: { id }, data }));
  }

  async remove(id: string) {
    return this.prisma.withRls((tx) => tx.user.delete({ where: { id } }));
  }
}
