import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreatePsychologistDto } from './dto/create-psychologist.dto';
import { UpdatePsychologistDto } from './dto/update-psychologist.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class PsychologistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Creates the underlying User (role=psychologist) and its PsychologistProfile as one
   * atomic unit, via UsersService.createUserRecord run inside this transaction.
   */
  create(dto: CreatePsychologistDto, institutionId: number | null) {
    return this.prisma.withRls(async (tx) => {
      const user = await this.usersService.createUserRecord(
        tx,
        {
          full_name: dto.fullName,
          email: dto.email,
          password: dto.password,
          role: Role.psychologist,
        },
        institutionId,
      );

      const profile = await tx.psychologistProfile.create({
        data: {
          userId: user.id,
          professionalLicense: dto.professionalLicense,
          specialty: dto.specialty,
          phone: dto.phone,
          defaultSessionMinutes: dto.defaultSessionMinutes,
        },
      });

      return { ...profile, user };
    });
  }

  findAll(skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.psychologistProfile.findMany({
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        include: { user: true },
      }),
    );
  }

  async findOne(userId: string) {
    const profile = await this.prisma.withRls((tx) =>
      tx.psychologistProfile.findUnique({
        where: { userId },
        include: { user: true },
      }),
    );

    if (!profile) {
      throw new NotFoundException(
        'No se ha encontrado el perfil de terapeuta solicitado.',
      );
    }

    return profile;
  }

  update(userId: string, dto: UpdatePsychologistDto) {
    return this.prisma.withRls((tx) =>
      tx.psychologistProfile.update({
        where: { userId },
        data: dto,
        include: { user: true },
      }),
    );
  }

  /** Patients with an active assignment — i.e. StudentProfile.assignedDoctorId = this psychologist. */
  findStudents(userId: string) {
    return this.prisma.withRls((tx) =>
      tx.studentProfile.findMany({
        where: { assignedDoctorId: userId },
        include: { user: true },
      }),
    );
  }
}
