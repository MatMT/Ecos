import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTherapistAssignmentDto } from './dto/create-therapist-assignment.dto';
import { EndTherapistAssignmentDto } from './dto/end-therapist-assignment.dto';

interface AssignPrimaryTherapistInput {
  studentId: number;
  therapistId: string;
  assignedById?: string | null;
  reason?: string | null;
}

@Injectable()
export class TherapistAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Core transactional operation, shaped to take an already-open tx so other services
   * (e.g. StudentsService, on initial patient creation) can compose it into their own
   * single withRls() call instead of opening a second transaction. Ends the student's
   * current active primary assignment (if any), inserts the new one, and syncs
   * StudentProfile.assignedDoctorId.
   */
  async assignPrimaryTherapist(
    tx: Prisma.TransactionClient,
    {
      studentId,
      therapistId,
      assignedById,
      reason,
    }: AssignPrimaryTherapistInput,
  ) {
    const student = await tx.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student) {
      throw new NotFoundException('No se ha encontrado el paciente indicado.');
    }

    const therapist = await tx.user.findUnique({ where: { id: therapistId } });
    if (!therapist || therapist.role !== Role.psychologist) {
      throw new BadRequestException(
        'El terapeuta indicado no existe o no tiene el rol de psicólogo.',
      );
    }
    if (therapist.institutionId !== student.user.institutionId) {
      throw new BadRequestException(
        'El terapeuta y el paciente deben pertenecer a la misma institución.',
      );
    }

    const currentPrimary = await tx.therapistAssignment.findFirst({
      where: { studentId, isPrimary: true, endsAt: null },
    });
    if (currentPrimary) {
      await tx.therapistAssignment.update({
        where: { id: currentPrimary.id },
        data: { endsAt: new Date() },
      });
    }

    const assignment = await tx.therapistAssignment.create({
      data: {
        studentId,
        therapistId,
        assignedById: assignedById ?? null,
        isPrimary: true,
        reason,
      },
    });

    await tx.studentProfile.update({
      where: { id: studentId },
      data: { assignedDoctorId: therapistId },
    });

    if (assignedById) {
      await this.auditService.log(tx, {
        userId: assignedById,
        institutionId: student.user.institutionId,
        action: 'THERAPIST_ASSIGNED',
        entity: 'TherapistAssignment',
        entityId: String(assignment.id),
      });
    }

    return assignment;
  }

  create(dto: CreateTherapistAssignmentDto, assignedById: string | null) {
    return this.prisma.withRls((tx) =>
      this.assignPrimaryTherapist(tx, { ...dto, assignedById }),
    );
  }

  setPrimary(id: number) {
    return this.prisma.withRls(async (tx) => {
      const target = await tx.therapistAssignment.findUnique({ where: { id } });
      if (!target) {
        throw new NotFoundException(
          'No se ha encontrado la asignación indicada.',
        );
      }
      return this.assignPrimaryTherapist(tx, {
        studentId: target.studentId,
        therapistId: target.therapistId,
        assignedById: target.assignedById,
        reason: target.reason,
      });
    });
  }

  endAssignment(id: number, dto: EndTherapistAssignmentDto) {
    return this.prisma.withRls(async (tx) => {
      const assignment = await tx.therapistAssignment.findUnique({
        where: { id },
      });
      if (!assignment) {
        throw new NotFoundException(
          'No se ha encontrado la asignación indicada.',
        );
      }

      const wasActive = assignment.endsAt === null;

      const ended = await tx.therapistAssignment.update({
        where: { id },
        data: {
          endsAt: assignment.endsAt ?? new Date(),
          reason: dto.reason ?? assignment.reason,
        },
      });

      if (wasActive && assignment.isPrimary) {
        await tx.studentProfile.updateMany({
          where: {
            id: assignment.studentId,
            assignedDoctorId: assignment.therapistId,
          },
          data: { assignedDoctorId: null },
        });
      }

      return ended;
    });
  }

  findByStudent(studentId: number) {
    return this.prisma.withRls((tx) =>
      tx.therapistAssignment.findMany({
        where: { studentId },
        orderBy: { startsAt: 'desc' },
      }),
    );
  }

  findByTherapist(therapistId: string) {
    return this.prisma.withRls((tx) =>
      tx.therapistAssignment.findMany({
        where: { therapistId },
        orderBy: { startsAt: 'desc' },
      }),
    );
  }
}
