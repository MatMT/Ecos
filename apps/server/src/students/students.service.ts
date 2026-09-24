import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TherapistAssignmentsService } from '../therapist-assignments/therapist-assignments.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentMeResponseDto } from './dto/student-me-response.dto';

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

  async getMe(userId: string): Promise<StudentMeResponseDto> {
    return this.prisma.withRls(async (tx) => {
      const profile = await tx.studentProfile.findUnique({
        where: { userId },
        include: {
          user: {
            include: { institution: true },
          },
          assignedDoctor: {
            include: { psychologistProfile: true },
          },
        },
      });

      if (!profile) {
        throw new NotFoundException(
          'No se ha encontrado el perfil de estudiante para este usuario.',
        );
      }

      const now = new Date();
      const nextAppointment = await tx.appointment.findFirst({
        where: {
          studentId: profile.id,
          appointmentDate: { gte: now },
          status: { in: ['pending', 'confirmed'] },
        },
        orderBy: { appointmentDate: 'asc' },
      });

      const activePlan = await tx.treatmentPlan.findFirst({
        where: {
          studentId: profile.id,
          status: 'active',
        },
        include: {
          goals: true,
        },
      });

      return {
        id: profile.id,
        userId: profile.userId,
        studentCode: profile.studentCode,
        primaryDiagnosis: profile.primaryDiagnosis,
        fullName: profile.user?.fullName ?? null,
        email: profile.user?.email ?? null,
        institution: profile.user?.institution
          ? {
              id: profile.user.institution.id,
              name: profile.user.institution.name,
            }
          : null,
        assignedTherapist: profile.assignedDoctor
          ? {
              id: profile.assignedDoctor.id,
              fullName: profile.assignedDoctor.fullName,
              email: profile.assignedDoctor.email,
              specialty:
                profile.assignedDoctor.psychologistProfile?.specialty ?? null,
              phone: profile.assignedDoctor.psychologistProfile?.phone ?? null,
              professionalLicense:
                profile.assignedDoctor.psychologistProfile?.professionalLicense ??
                null,
            }
          : null,
        nextAppointment: nextAppointment
          ? {
              id: nextAppointment.id,
              appointmentDate: nextAppointment.appointmentDate,
              status: nextAppointment.status,
              reason: nextAppointment.reason,
            }
          : null,
        activeGoalsCount: activePlan?.goals.length ?? 0,
      };
    });
  }
}
