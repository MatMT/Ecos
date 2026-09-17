import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulesService } from '../schedules/schedules.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let tx: {
    studentProfile: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    institution: { findUnique: jest.Mock };
    psychologistProfile: { findUnique: jest.Mock };
    appointment: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let prisma: { withRls: jest.Mock };
  let schedulesService: { computeAvailableSlots: jest.Mock };

  const STUDENT_ID = 8;
  const DOCTOR_ID = 'doctor-uuid';
  const FUTURE_DATE = '2030-06-03T14:00:00.000Z';

  beforeEach(async () => {
    tx = {
      studentProfile: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      institution: { findUnique: jest.fn() },
      psychologistProfile: { findUnique: jest.fn() },
      appointment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    schedulesService = { computeAvailableSlots: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: SchedulesService, useValue: schedulesService },
      ],
    }).compile();

    service = module.get(AppointmentsService);
  });

  describe('create', () => {
    const dto = {
      studentId: STUDENT_ID,
      doctorId: DOCTOR_ID,
      appointmentDate: FUTURE_DATE,
      modality: 'in_person',
    };

    beforeEach(() => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: STUDENT_ID,
        user: { institutionId: 5 },
      });
      tx.user.findUnique.mockResolvedValue({
        id: DOCTOR_ID,
        role: Role.psychologist,
        institutionId: 5,
      });
      tx.institution.findUnique.mockResolvedValue({ id: 5, timezone: 'UTC' });
      tx.psychologistProfile.findUnique.mockResolvedValue({
        defaultSessionMinutes: 45,
      });
    });

    it('creates the appointment when the requested slot is available', async () => {
      schedulesService.computeAvailableSlots.mockResolvedValue([
        {
          start: new Date(FUTURE_DATE),
          end: new Date(new Date(FUTURE_DATE).getTime() + 45 * 60_000),
        },
      ]);
      tx.appointment.create.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.pending,
      });

      const result = await service.create(dto, 'admin-uuid');

      expect(tx.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: STUDENT_ID,
          doctorId: DOCTOR_ID,
          durationMinutes: 45,
          status: AppointmentStatus.pending,
          createdById: 'admin-uuid',
        }) as unknown,
      });
      expect(result).toEqual({ id: 1, status: AppointmentStatus.pending });
    });

    it('throws ConflictException when the requested slot is not available', async () => {
      schedulesService.computeAvailableSlots.mockResolvedValue([]);

      await expect(service.create(dto, 'admin-uuid')).rejects.toThrow(
        ConflictException,
      );
      expect(tx.appointment.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the doctor is not a psychologist', async () => {
      tx.user.findUnique.mockResolvedValue({
        id: DOCTOR_ID,
        role: Role.student,
        institutionId: 5,
      });

      await expect(service.create(dto, 'admin-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirm / illegal transitions', () => {
    it('confirms a pending appointment', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.pending,
      });
      tx.appointment.update.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.confirmed,
      });

      const result = await service.confirm(1);

      expect(tx.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: AppointmentStatus.confirmed },
      });
      expect(result).toEqual({ id: 1, status: AppointmentStatus.confirmed });
    });

    it('rejects an illegal transition (completed -> cancelled)', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.completed,
      });

      await expect(service.cancel(1, {})).rejects.toThrow(ConflictException);
      expect(tx.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe('reschedule', () => {
    it('creates a new linked appointment and marks the original as rescheduled', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 1,
        studentId: STUDENT_ID,
        doctorId: DOCTOR_ID,
        sessionTitle: 'Seguimiento',
        sessionType: 'follow_up',
        durationMinutes: 60,
        modality: 'in_person',
        reason: null,
        createdById: 'admin-uuid',
        status: AppointmentStatus.confirmed,
        student: { user: { institutionId: 5 } },
      });
      tx.institution.findUnique.mockResolvedValue({ id: 5, timezone: 'UTC' });
      const newDate = '2030-06-04T14:00:00.000Z';
      schedulesService.computeAvailableSlots.mockResolvedValue([
        {
          start: new Date(newDate),
          end: new Date(new Date(newDate).getTime() + 60 * 60_000),
        },
      ]);
      tx.appointment.create.mockResolvedValue({ id: 2 });
      tx.appointment.update.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.rescheduled,
      });

      const result = await service.reschedule(1, { appointmentDate: newDate });

      expect(tx.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rescheduledFromId: 1,
          status: AppointmentStatus.confirmed, // carried forward from the original
          durationMinutes: 60,
        }) as unknown,
      });
      expect(tx.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: AppointmentStatus.rescheduled },
      });
      expect(result).toEqual({ id: 2 });
    });

    it('rejects rescheduling an already-terminal appointment', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.cancelled,
      });

      await expect(
        service.reschedule(1, { appointmentDate: '2030-06-04T14:00:00.000Z' }),
      ).rejects.toThrow(ConflictException);
      expect(tx.appointment.create).not.toHaveBeenCalled();
    });
  });
});
