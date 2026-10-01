import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma, type ClinicalNote } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { CreateManualClinicalNoteDto } from './dto/create-manual-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';
import { VoidClinicalNoteDto } from './dto/void-clinical-note.dto';
import { ClinicalNoteListQueryDto } from './dto/clinical-note-list-query.dto';
import { ClinicalNoteDetailResponseDto } from './dto/clinical-note-detail-response.dto';

const MAX_PAGE_SIZE = 100;
const DEFAULT_TIMEZONE = 'America/El_Salvador';

interface ClinicalNoteDetailContext {
  assigned_therapist_full_name: string | null;
  assigned_therapist_email: string | null;
  assigned_therapist_id: string | null;
  author_full_name: string | null;
  author_id: string | null;
  institution_timezone: string;
  patient_email: string | null;
  patient_full_name: string | null;
  patient_id: number;
  student_code: string | null;
}

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
      if (
        appointment.status !== AppointmentStatus.confirmed &&
        appointment.status !== AppointmentStatus.completed
      ) {
        throw new ConflictException(
          'Solo se puede registrar una nota clínica para una cita confirmada o realizada.',
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

      const existingNote = await tx.clinicalNote.findUnique({
        where: { appointmentId },
      });
      if (existingNote) {
        throw new ConflictException(
          'La cita ya cuenta con una nota clínica registrada.',
        );
      }

      const note = await tx.clinicalNote.create({
        data: {
          appointmentId,
          doctorId: appointment.doctorId,
          studentId: appointment.studentId,
          sessionDate: appointment.appointmentDate,
          sessionType: appointment.sessionType,
          durationMinutes: appointment.durationMinutes,
          modality: appointment.modality,
          ...content,
        },
      });

      if (appointment.status === AppointmentStatus.confirmed) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: AppointmentStatus.completed },
        });
      }

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

  createManual(
    studentId: number,
    dto: CreateManualClinicalNoteDto,
    currentUser?: RequestUser,
  ) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const patient = await tx.studentProfile.findUnique({
        where: { id: studentId },
        select: { id: true },
      });
      if (!patient) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const sessionDate = new Date(dto.sessionDate);
      if (sessionDate.getTime() > Date.now()) {
        throw new BadRequestException(
          'La fecha clínica de la sesión no puede ser futura.',
        );
      }

      const note = await tx.clinicalNote.create({
        data: {
          doctorId: currentUser.id,
          studentId: patient.id,
          sessionDate,
          sessionType: dto.sessionType,
          durationMinutes: dto.durationMinutes,
          modality: dto.modality,
          sessionDiagnosis: dto.sessionDiagnosis,
          observedEmotionalState: dto.observedEmotionalState,
          observations: dto.observations,
          sessionSummary: dto.sessionSummary,
          clinicalImpression: dto.clinicalImpression,
          interventions: dto.interventions,
          agreements: dto.agreements,
          followUpPlan: dto.followUpPlan,
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

  async findOneByStudent(
    studentId: number,
    id: number,
  ): Promise<ClinicalNoteDetailResponseDto> {
    return this.prisma.withRls(async (tx) => {
      const note = await tx.clinicalNote.findFirst({
        where: { id, studentId },
      });
      if (!note) {
        throw new NotFoundException(
          'No se ha encontrado la nota clínica solicitada.',
        );
      }

      const context = await this.getDetailContext(tx, studentId, id);
      if (!context) {
        throw new NotFoundException(
          'No se ha encontrado la nota clínica solicitada.',
        );
      }

      return this.toDetailResponse(note, context);
    });
  }

  async findByStudent(
    studentId: number,
    query: ClinicalNoteListQueryDto,
  ) {
    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 20, MAX_PAGE_SIZE);

    return this.prisma.withRls(async (tx) => {
      const patient = await tx.studentProfile.findUnique({
        where: { id: studentId },
        select: {
          user: {
            select: {
              institution: { select: { timezone: true } },
            },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const [notes, total] = await Promise.all([
        tx.clinicalNote.findMany({
          where: { studentId },
          skip,
          take,
          orderBy: [
            { sessionDate: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          select: {
            id: true,
            appointmentId: true,
            sessionDate: true,
            sessionType: true,
            durationMinutes: true,
            modality: true,
            observedEmotionalState: true,
            voidedAt: true,
            createdAt: true,
            updatedAt: true,
            appointment: {
              select: {
                appointmentDate: true,
                status: true,
              },
            },
            doctor: {
              select: { id: true, fullName: true },
            },
          },
        }),
        tx.clinicalNote.count({ where: { studentId } }),
      ]);

      return {
        data: notes.map((note) => ({
          id: note.id,
          appointmentId: note.appointmentId,
          sessionDate: note.sessionDate,
          appointmentDate: note.appointment?.appointmentDate ?? null,
          sessionType: note.sessionType,
          durationMinutes: note.durationMinutes,
          modality: note.modality,
          appointmentStatus: note.appointment?.status ?? null,
          observedEmotionalState: note.observedEmotionalState,
          therapist: note.doctor,
          isVoided: note.voidedAt !== null,
          voidedAt: note.voidedAt,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        })),
        meta: {
          skip,
          take,
          total,
          totalPages: Math.ceil(total / take),
          institutionTimezone:
            patient.user.institution?.timezone ?? DEFAULT_TIMEZONE,
        },
      };
    });
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
      if (note.doctorId !== currentUser.id) {
        throw new ForbiddenException(
          'Solo el terapeuta autor puede editar la nota clínica.',
        );
      }

      const updated = await tx.clinicalNote.update({
        where: { id },
        data: dto,
      });

      if (!updated.studentId) {
        throw new NotFoundException(
          'No se ha encontrado el contexto clínico de la nota solicitada.',
        );
      }

      const context = await this.getDetailContext(tx, updated.studentId, id);
      if (!context) {
        throw new NotFoundException(
          'No se ha encontrado el contexto clínico de la nota solicitada.',
        );
      }

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'CLINICAL_NOTE_UPDATED',
        entity: 'ClinicalNote',
        entityId: String(id),
      });

      return this.toDetailResponse(updated, context);
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
      if (note.doctorId !== currentUser.id) {
        throw new ForbiddenException(
          'Solo el terapeuta autor puede anular la nota clínica.',
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

  private async getDetailContext(
    tx: Prisma.TransactionClient,
    studentId: number,
    noteId: number,
  ): Promise<ClinicalNoteDetailContext | null> {
    const contexts = await tx.$queryRaw<ClinicalNoteDetailContext[]>`
      SELECT *
      FROM app_private.get_clinical_note_detail_context(${studentId}, ${noteId})
    `;

    return contexts[0] ?? null;
  }

  private toDetailResponse(
    note: ClinicalNote,
    context: ClinicalNoteDetailContext,
  ): ClinicalNoteDetailResponseDto {
    return {
      id: note.id,
      patient: {
        id: context.patient_id,
        fullName: context.patient_full_name,
        email: context.patient_email,
        studentCode: context.student_code,
        assignedTherapist: context.assigned_therapist_id
          ? {
              id: context.assigned_therapist_id,
              fullName: context.assigned_therapist_full_name,
              email: context.assigned_therapist_email,
            }
          : null,
        institutionTimezone:
          context.institution_timezone || DEFAULT_TIMEZONE,
      },
      therapist: {
        id: context.author_id ?? note.doctorId ?? 'unknown',
        fullName: context.author_full_name,
      },
      appointment: note.appointmentId
        ? {
            id: note.appointmentId,
            appointmentDate: note.sessionDate,
            sessionType: note.sessionType,
            durationMinutes: note.durationMinutes,
            modality: note.modality,
          }
        : null,
      sessionDate: note.sessionDate,
      sessionType: note.sessionType,
      durationMinutes: note.durationMinutes,
      modality: note.modality,
      sessionDiagnosis: note.sessionDiagnosis,
      observedEmotionalState: note.observedEmotionalState,
      sessionSummary: note.sessionSummary,
      observations: note.observations,
      clinicalImpression: note.clinicalImpression,
      interventions: note.interventions,
      agreements: note.agreements,
      followUpPlan: note.followUpPlan,
      aiAssistantAnalysis: note.aiAssistantAnalysis,
      isVoided: note.voidedAt !== null,
      voidedAt: note.voidedAt,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
