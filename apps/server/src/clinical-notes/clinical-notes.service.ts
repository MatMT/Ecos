import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';
import { VoidClinicalNoteDto } from './dto/void-clinical-note.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class ClinicalNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  create(dto: CreateClinicalNoteDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const { appointmentId, ...content } = dto;

      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (!appointment) {
        throw new NotFoundException('No se ha encontrado la cita indicada.');
      }
      if (appointment.status !== AppointmentStatus.completed) {
        throw new ConflictException(
          'Solo se puede registrar una nota clínica para una cita realizada.',
        );
      }
      if (!appointment.doctorId) {
        throw new BadRequestException(
          'La cita no tiene un terapeuta asignado.',
        );
      }
      if (appointment.doctorId !== currentUser.id) {
        throw new ForbiddenException(
          'Solo el terapeuta que realizó la sesión puede registrar la nota.',
        );
      }

      const note = await tx.clinicalNote.create({
        data: {
          appointmentId,
          doctorId: appointment.doctorId,
          studentId: appointment.studentId,
          ...content,
        },
      });

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'CLINICAL_NOTE_CREATED',
        entity: 'ClinicalNote',
        entityId: String(note.id),
      });

      return note;
    });
  }

  async findOne(id: number) {
    const note = await this.prisma.withRls((tx) =>
      tx.clinicalNote.findUnique({ where: { id } }),
    );
    if (!note) {
      throw new NotFoundException(
        'No se ha encontrado la nota clínica solicitada.',
      );
    }
    return note;
  }

  findByStudent(studentId: number, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.clinicalNote.findMany({
        where: { studentId },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  update(id: number, dto: UpdateClinicalNoteDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const note = await tx.clinicalNote.findUnique({ where: { id } });
      if (!note) {
        throw new NotFoundException(
          'No se ha encontrado la nota clínica solicitada.',
        );
      }
      if (note.voidedAt) {
        throw new ConflictException(
          'No se puede editar una nota clínica que ya ha sido anulada.',
        );
      }

      const updated = await tx.clinicalNote.update({
        where: { id },
        data: dto,
      });

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'CLINICAL_NOTE_UPDATED',
        entity: 'ClinicalNote',
        entityId: String(id),
      });

      return updated;
    });
  }

  void(id: number, dto: VoidClinicalNoteDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const note = await tx.clinicalNote.findUnique({ where: { id } });
      if (!note) {
        throw new NotFoundException(
          'No se ha encontrado la nota clínica solicitada.',
        );
      }
      if (note.voidedAt) {
        throw new ConflictException(
          'La nota clínica ya ha sido anulada previamente.',
        );
      }

      const voided = await tx.clinicalNote.update({
        where: { id },
        data: {
          voidedAt: new Date(),
          voidedById: currentUser.id,
          voidReason: dto.voidReason,
        },
      });

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'CLINICAL_NOTE_VOIDED',
        entity: 'ClinicalNote',
        entityId: String(id),
      });

      return voided;
    });
  }
}
