import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TherapistAssignmentsService } from '../therapist-assignments/therapist-assignments.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly therapistAssignmentsService: TherapistAssignmentsService,
  ) {}

  /**
   * Creates the underlying User (role=student) and its StudentProfile, and — if
   * assignedDoctorId is given — the initial TherapistAssignment, all as one atomic
   * transaction (guiding principle: multi-step writes are one transaction).
   */
  create(dto: CreateStudentDto, institutionId: number | null) {
    return this.prisma.withRls(async (tx) => {
      const user = await this.usersService.createUserRecord(
        tx,
        {
          full_name: dto.fullName,
          email: dto.email,
          password: dto.password,
          role: Role.student,
        },
        institutionId,
      );

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          studentCode: dto.studentCode,
          primaryDiagnosis: dto.primaryDiagnosis,
        },
      });

      if (dto.assignedDoctorId) {
        await this.therapistAssignmentsService.assignPrimaryTherapist(tx, {
          studentId: profile.id,
          therapistId: dto.assignedDoctorId,
        });
      }

      return tx.studentProfile.findUniqueOrThrow({
        where: { id: profile.id },
        include: { user: true },
      });
    });
  }

  findAll(skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.studentProfile.findMany({
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        include: { user: true },
      }),
    );
  }

  async findOne(id: number) {
    const profile = await this.prisma.withRls((tx) =>
      tx.studentProfile.findUnique({ where: { id }, include: { user: true } }),
    );

    if (!profile) {
      throw new NotFoundException(
        'No se ha encontrado el paciente solicitado.',
      );
    }

    return profile;
  }

  update(id: number, dto: UpdateStudentDto) {
    return this.prisma.withRls((tx) =>
      tx.studentProfile.update({
        where: { id },
        data: dto,
        include: { user: true },
      }),
    );
  }
}
