import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma, Role } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulesService } from '../schedules/schedules.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

const MAX_PAGE_SIZE = 100;
const DEFAULT_TIMEZONE = 'America/El_Salvador';

// pending/confirmed are the only non-terminal states — everything else is a dead end.
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled', 'rescheduled'],
  confirmed: ['completed', 'cancelled', 'rescheduled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: [],
};

interface AppointmentFilters {
  studentId?: number;
  doctorId?: string;
  status?: AppointmentStatus;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulesService: SchedulesService,
  ) {}

  create(dto: CreateAppointmentDto, currentUserId: string | null) {
    return this.prisma.withRls(async (tx) => {
      const student = await tx.studentProfile.findUnique({
        where: { id: dto.studentId },
        include: { user: true },
      });
      if (!student) {
        throw new NotFoundException(
          'No se ha encontrado el paciente indicado.',
        );
      }

      const doctor = await tx.user.findUnique({ where: { id: dto.doctorId } });
      if (!doctor || doctor.role !== Role.psychologist) {
        throw new BadRequestException(
          'El terapeuta indicado no existe o no tiene el rol de psicólogo.',
        );
      }
      if (doctor.institutionId !== student.user.institutionId) {
        throw new BadRequestException(
          'El terapeuta y el paciente deben pertenecer a la misma institución.',
        );
      }

      const institutionTimezone = await this.resolveInstitutionTimezone(
        tx,
        student.user.institutionId,
      );

      const profile = await tx.psychologistProfile.findUnique({
        where: { userId: dto.doctorId },
      });
      const durationMinutes =
        dto.durationMinutes ?? profile?.defaultSessionMinutes ?? 60;

      const appointmentDate = this.parseFutureDate(
        dto.appointmentDate,
        'La fecha de la cita debe ser una fecha futura válida.',
      );
      const endAt = new Date(
        appointmentDate.getTime() + durationMinutes * 60_000,
      );

      await this.assertSlotAvailable(tx, {
        therapistId: dto.doctorId,
        institutionTimezone,
        start: appointmentDate,
        end: endAt,
      });

      return tx.appointment.create({
        data: {
          studentId: dto.studentId,
          doctorId: dto.doctorId,
          sessionTitle: dto.sessionTitle,
          sessionType: dto.sessionType,
          appointmentDate,
          endAt,
          durationMinutes,
          modality: dto.modality,
          reason: dto.reason,
          createdById: currentUserId,
          status: AppointmentStatus.pending,
        },
      });
    });
  }

  findAll(filters: AppointmentFilters, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.appointment.findMany({
        where: {
          studentId: filters.studentId,
          doctorId: filters.doctorId,
          status: filters.status,
        },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { appointmentDate: 'desc' },
      }),
    );
  }

  async findOne(id: number) {
    const appointment = await this.prisma.withRls((tx) =>
      tx.appointment.findUnique({ where: { id } }),
    );
    if (!appointment) {
      throw new NotFoundException('No se ha encontrado la cita solicitada.');
    }
    return appointment;
  }

  confirm(id: number) {
    return this.transition(id, AppointmentStatus.confirmed, {});
  }

  cancel(id: number, dto: CancelAppointmentDto) {
    return this.transition(id, AppointmentStatus.cancelled, {
      cancelReason: dto.cancelReason,
    });
  }

  noShow(id: number) {
    return this.transition(id, AppointmentStatus.no_show, {});
  }

  complete(id: number) {
    return this.transition(id, AppointmentStatus.completed, {});
  }

  reschedule(id: number, dto: RescheduleAppointmentDto) {
    return this.prisma.withRls(async (tx) => {
      const oldAppointment = await tx.appointment.findUnique({
        where: { id },
        include: { student: { include: { user: true } } },
      });
      if (!oldAppointment) {
        throw new NotFoundException('No se ha encontrado la cita indicada.');
      }
      this.assertTransition(
        oldAppointment.status,
        AppointmentStatus.rescheduled,
      );
      if (!oldAppointment.doctorId) {
        throw new BadRequestException(
          'La cita no tiene un terapeuta asignado.',
        );
      }

      const institutionTimezone = await this.resolveInstitutionTimezone(
        tx,
        oldAppointment.student?.user.institutionId ?? null,
      );

      const durationMinutes =
        dto.durationMinutes ?? oldAppointment.durationMinutes ?? 60;
      const newDate = this.parseFutureDate(
        dto.appointmentDate,
        'La nueva fecha de la cita debe ser una fecha futura válida.',
      );
      const newEndAt = new Date(newDate.getTime() + durationMinutes * 60_000);

      await this.assertSlotAvailable(tx, {
        therapistId: oldAppointment.doctorId,
        institutionTimezone,
        start: newDate,
        end: newEndAt,
      });

      // Carrying forward `confirmed` when the original was already confirmed (vs.
      // resetting every reschedule to `pending`) is a stated default, not spec'd
      // explicitly — see docs/clinical-panel/GOALS.md's Phase 2 plan.
      const newStatus =
        oldAppointment.status === AppointmentStatus.confirmed
          ? AppointmentStatus.confirmed
          : AppointmentStatus.pending;

      const newAppointment = await tx.appointment.create({
        data: {
          studentId: oldAppointment.studentId,
          doctorId: oldAppointment.doctorId,
          sessionTitle: oldAppointment.sessionTitle,
          sessionType: oldAppointment.sessionType,
          appointmentDate: newDate,
          endAt: newEndAt,
          durationMinutes,
          modality: oldAppointment.modality,
          reason: oldAppointment.reason,
          createdById: oldAppointment.createdById,
          rescheduledFromId: oldAppointment.id,
          status: newStatus,
        },
      });

      await tx.appointment.update({
        where: { id: oldAppointment.id },
        data: { status: AppointmentStatus.rescheduled },
      });

      return newAppointment;
    });
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private transition(
    id: number,
    next: AppointmentStatus,
    extraData: Prisma.AppointmentUpdateInput,
  ) {
    return this.prisma.withRls(async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id } });
      if (!appointment) {
        throw new NotFoundException('No se ha encontrado la cita indicada.');
      }
      this.assertTransition(appointment.status, next);
      return tx.appointment.update({
        where: { id },
        data: { status: next, ...extraData },
      });
    });
  }

  private assertTransition(
    current: AppointmentStatus | null,
    next: AppointmentStatus,
  ) {
    if (!current || !ALLOWED_TRANSITIONS[current].includes(next)) {
      throw new ConflictException(
        `No se puede cambiar la cita del estado "${current ?? 'sin estado'}" a "${next}".`,
      );
    }
  }

  private async resolveInstitutionTimezone(
    tx: Prisma.TransactionClient,
    institutionId: number | null,
  ): Promise<string> {
    if (!institutionId) {
      return DEFAULT_TIMEZONE;
    }
    const institution = await tx.institution.findUnique({
      where: { id: institutionId },
    });
    return institution?.timezone ?? DEFAULT_TIMEZONE;
  }

  private parseFutureDate(value: string, errorMessage: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      throw new BadRequestException(errorMessage);
    }
    return date;
  }

  private async assertSlotAvailable(
    tx: Prisma.TransactionClient,
    params: {
      therapistId: string;
      institutionTimezone: string;
      start: Date;
      end: Date;
    },
  ): Promise<void> {
    const { therapistId, institutionTimezone, start, end } = params;
    const dateOnly = DateTime.fromJSDate(start, {
      zone: institutionTimezone,
    }).toISODate();
    if (!dateOnly) {
      throw new BadRequestException('La fecha de la cita no es válida.');
    }

    const slots = await this.schedulesService.computeAvailableSlots(tx, {
      therapistId,
      date: dateOnly,
      institutionTimezone,
    });

    const available = slots.some(
      (slot) =>
        slot.start.getTime() === start.getTime() &&
        slot.end.getTime() === end.getTime(),
    );
    if (!available) {
      throw new ConflictException(
        'El horario solicitado ya no está disponible.',
      );
    }
  }
}
