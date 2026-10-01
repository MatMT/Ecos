import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TherapistSchedule,
  TherapistScheduleException,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { ScheduleExceptionResponseDto } from './dto/schedule-exception-response.dto';
import { dateToTimeString, timeStringToDate } from './schedule-time.util';
import {
  combineDateAndTime,
  dayOfWeekInTimezone,
  endOfDayInTimezone,
  isBeforeToday,
  isToday,
  startOfDayInTimezone,
} from './timezone.util';

const AGENDA_OCCUPYING_STATUSES = ['pending', 'confirmed'] as const;
const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface TimeWindow {
  startTime: Date;
  endTime: Date;
}

interface GenerationBlock extends TimeWindow {
  sessionDurationMinutes: number;
  breakMinutes: number;
}

function windowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return (
    a.startTime.getTime() < b.endTime.getTime() &&
    a.endTime.getTime() > b.startTime.getTime()
  );
}

/** Narrows an exception's nullable startTime/endTime to non-null, for TS as well as at runtime. */
function hasTimeWindow(
  exception: TherapistScheduleException,
): exception is TherapistScheduleException & TimeWindow {
  return exception.startTime !== null && exception.endTime !== null;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Recurring schedule blocks ──────────────────────────────────────────

  create(therapistId: string, dto: CreateScheduleDto) {
    return this.prisma.withRls(async (tx) => {
      const schedule = await tx.therapistSchedule.create({
        data: {
          therapistId,
          dayOfWeek: dto.dayOfWeek,
          startTime: timeStringToDate(dto.startTime),
          endTime: timeStringToDate(dto.endTime),
          sessionDurationMinutes: dto.sessionDurationMinutes,
          breakMinutes: dto.breakMinutes,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        },
      });
      return this.toScheduleResponse(schedule);
    });
  }

  async findAllForTherapist(
    therapistId: string,
  ): Promise<ScheduleResponseDto[]> {
    const rows = await this.prisma.withRls((tx) =>
      tx.therapistSchedule.findMany({
        where: { therapistId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
    );
    return rows.map((row) => this.toScheduleResponse(row));
  }

  async update(id: number, dto: UpdateScheduleDto) {
    const schedule = await this.prisma.withRls((tx) =>
      tx.therapistSchedule.update({
        where: { id },
        data: {
          dayOfWeek: dto.dayOfWeek,
          startTime: dto.startTime
            ? timeStringToDate(dto.startTime)
            : undefined,
          endTime: dto.endTime ? timeStringToDate(dto.endTime) : undefined,
          sessionDurationMinutes: dto.sessionDurationMinutes,
          breakMinutes: dto.breakMinutes,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validTo: dto.validTo ? new Date(dto.validTo) : undefined,
          active: dto.active,
        },
      }),
    );
    return this.toScheduleResponse(schedule);
  }

  async remove(id: number) {
    const schedule = await this.prisma.withRls((tx) =>
      tx.therapistSchedule.delete({ where: { id } }),
    );
    return this.toScheduleResponse(schedule);
  }

  // ─── Schedule exceptions ────────────────────────────────────────────────

  createException(therapistId: string, dto: CreateScheduleExceptionDto) {
    return this.prisma.withRls(async (tx) => {
      const exception = await tx.therapistScheduleException.create({
        data: {
          therapistId,
          date: new Date(dto.date),
          startTime: dto.startTime
            ? timeStringToDate(dto.startTime)
            : undefined,
          endTime: dto.endTime ? timeStringToDate(dto.endTime) : undefined,
          available: dto.available,
          reason: dto.reason,
        },
      });
      return this.toExceptionResponse(exception);
    });
  }

  async findExceptionsForTherapist(
    therapistId: string,
    from?: string,
    to?: string,
  ): Promise<ScheduleExceptionResponseDto[]> {
    const rows = await this.prisma.withRls((tx) =>
      tx.therapistScheduleException.findMany({
        where: {
          therapistId,
          date: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
        orderBy: { date: 'asc' },
      }),
    );
    return rows.map((row) => this.toExceptionResponse(row));
  }

  async updateException(id: number, dto: UpdateScheduleExceptionDto) {
    const exception = await this.prisma.withRls((tx) =>
      tx.therapistScheduleException.update({
        where: { id },
        data: {
          date: dto.date ? new Date(dto.date) : undefined,
          startTime: dto.startTime
            ? timeStringToDate(dto.startTime)
            : undefined,
          endTime: dto.endTime ? timeStringToDate(dto.endTime) : undefined,
          available: dto.available,
          reason: dto.reason,
        },
      }),
    );
    return this.toExceptionResponse(exception);
  }

  async removeException(id: number) {
    const exception = await this.prisma.withRls((tx) =>
      tx.therapistScheduleException.delete({ where: { id } }),
    );
    return this.toExceptionResponse(exception);
  }

  // ─── Availability ───────────────────────────────────────────────────────

  /** Resolves the therapist's institution timezone, then delegates to computeAvailableSlots(). */
  getAvailability(therapistId: string, date: string) {
    if (!DATE_STRING_PATTERN.test(date)) {
      throw new BadRequestException(
        'La fecha debe tener el formato YYYY-MM-DD.',
      );
    }

    return this.prisma.withRls(async (tx) => {
      const therapist = await tx.user.findUnique({
        where: { id: therapistId },
        include: { institution: true },
      });
      if (!therapist) {
        throw new NotFoundException(
          'No se ha encontrado el terapeuta indicado.',
        );
      }
      const institutionTimezone =
        therapist.institution?.timezone ?? 'America/El_Salvador';
      return this.computeAvailableSlots(tx, {
        therapistId,
        date,
        institutionTimezone,
      });
    });
  }

  /**
   * Core availability calculation, tx-first so AppointmentsService can compose it into its
   * own transaction instead of opening a second one. Plain Prisma reads via the passed-in
   * tx — does not call into AppointmentsService.
   */
  async computeAvailableSlots(
    tx: Prisma.TransactionClient,
    params: { therapistId: string; date: string; institutionTimezone: string },
  ): Promise<{ start: Date; end: Date }[]> {
    const { therapistId, date, institutionTimezone } = params;

    if (isBeforeToday(date, institutionTimezone)) {
      return [];
    }

    const dayOfWeek = dayOfWeekInTimezone(date, institutionTimezone);
    const targetDate = new Date(date);

    const schedules = await tx.therapistSchedule.findMany({
      where: {
        therapistId,
        dayOfWeek,
        active: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: targetDate } }] },
          { OR: [{ validTo: null }, { validTo: { gte: targetDate } }] },
        ],
      },
    });

    const exceptions = await tx.therapistScheduleException.findMany({
      where: { therapistId, date: targetDate },
    });

    const fullDayBlock = exceptions.find(
      (exception) => !exception.available && exception.startTime === null,
    );
    if (fullDayBlock) {
      return [];
    }

    const blockedWindows: TimeWindow[] = exceptions
      .filter((exception) => !exception.available)
      .filter(hasTimeWindow)
      .map((exception) => ({
        startTime: exception.startTime,
        endTime: exception.endTime,
      }));

    let defaultSessionMinutes = 60;
    const extraordinaryExceptions = exceptions
      .filter((exception) => exception.available)
      .filter(hasTimeWindow);
    if (extraordinaryExceptions.length > 0) {
      const profile = await tx.psychologistProfile.findUnique({
        where: { userId: therapistId },
      });
      defaultSessionMinutes = profile?.defaultSessionMinutes ?? 60;
    }

    const blocks: GenerationBlock[] = [
      ...schedules.map((schedule) => ({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        sessionDurationMinutes: schedule.sessionDurationMinutes,
        breakMinutes: schedule.breakMinutes,
      })),
      ...extraordinaryExceptions.map((exception) => ({
        startTime: exception.startTime,
        endTime: exception.endTime,
        sessionDurationMinutes: defaultSessionMinutes,
        breakMinutes: 0,
      })),
    ];

    if (blocks.length === 0) {
      return [];
    }

    const rawSlots: TimeWindow[] = [];
    for (const block of blocks) {
      let cursor = block.startTime.getTime();
      const blockEndMs = block.endTime.getTime();
      const durationMs = block.sessionDurationMinutes * 60_000;
      const stepMs = durationMs + block.breakMinutes * 60_000;
      while (cursor + durationMs <= blockEndMs) {
        rawSlots.push({
          startTime: new Date(cursor),
          endTime: new Date(cursor + durationMs),
        });
        cursor += stepMs;
      }
    }

    const openSlots = rawSlots.filter(
      (slot) => !blockedWindows.some((window) => windowsOverlap(slot, window)),
    );

    let candidateSlots = openSlots.map((slot) => ({
      start: combineDateAndTime(
        date,
        dateToTimeString(slot.startTime),
        institutionTimezone,
      ),
      end: combineDateAndTime(
        date,
        dateToTimeString(slot.endTime),
        institutionTimezone,
      ),
    }));

    const dayStart = startOfDayInTimezone(date, institutionTimezone);
    const dayEnd = endOfDayInTimezone(date, institutionTimezone);
    const busyAppointments = await tx.appointment.findMany({
      where: {
        doctorId: therapistId,
        appointmentDate: { gte: dayStart, lt: dayEnd },
        status: { in: [...AGENDA_OCCUPYING_STATUSES] },
      },
    });

    candidateSlots = candidateSlots.filter(
      (slot) =>
        !busyAppointments.some(
          (appointment) =>
            appointment.appointmentDate &&
            appointment.endAt &&
            slot.start < appointment.endAt &&
            slot.end > appointment.appointmentDate,
        ),
    );

    if (isToday(date, institutionTimezone)) {
      const now = new Date();
      candidateSlots = candidateSlots.filter((slot) => slot.start > now);
    }

    candidateSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    return candidateSlots;
  }

  // ─── Response mapping (Date <-> "HH:mm" happens only at this boundary) ─

  private toScheduleResponse(schedule: TherapistSchedule): ScheduleResponseDto {
    return {
      ...schedule,
      startTime: dateToTimeString(schedule.startTime),
      endTime: dateToTimeString(schedule.endTime),
    };
  }

  private toExceptionResponse(
    exception: TherapistScheduleException,
  ): ScheduleExceptionResponseDto {
    return {
      ...exception,
      startTime: exception.startTime
        ? dateToTimeString(exception.startTime)
        : null,
      endTime: exception.endTime ? dateToTimeString(exception.endTime) : null,
    };
  }
}
