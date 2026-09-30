import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { ClinicalNotesService } from './clinical-notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ClinicalNotesService', () => {
  let service: ClinicalNotesService;
  let tx: {
    appointment: { findUnique: jest.Mock; update: jest.Mock };
    studentProfile: { findUnique: jest.Mock };
    clinicalNote: {
      count: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withRls: jest.Mock };
  let auditService: { log: jest.Mock };

  const DOCTOR_ID = 'doctor-uuid';
  const CURRENT_USER = {
    id: DOCTOR_ID,
    role: 'psychologist' as const,
    institutionId: 5,
  };

  beforeEach(async () => {
    tx = {
      appointment: { findUnique: jest.fn(), update: jest.fn() },
      studentProfile: { findUnique: jest.fn() },
      clinicalNote: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    auditService = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ClinicalNotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(ClinicalNotesService);
  });

  describe('create', () => {
    const dto = { appointmentId: 75, observations: 'Buen progreso' };

    it('throws ForbiddenException when there is no current user', async () => {
      await expect(service.create(dto, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the appointment does not exist', async () => {
      tx.appointment.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when the appointment cannot receive a note', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 75,
        status: AppointmentStatus.cancelled,
        doctorId: DOCTOR_ID,
        studentId: 8,
      });

      await expect(service.create(dto, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws BadRequestException when the appointment has no doctor', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 75,
        status: AppointmentStatus.completed,
        doctorId: null,
        studentId: 8,
      });

      await expect(service.create(dto, CURRENT_USER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when the caller is not the appointment doctor', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 75,
        status: AppointmentStatus.completed,
        doctorId: 'someone-else',
        studentId: 8,
      });

      await expect(service.create(dto, CURRENT_USER)).rejects.toThrow(
        ForbiddenException,
      );
      expect(tx.clinicalNote.create).not.toHaveBeenCalled();
    });

    it('creates the note and logs a CLINICAL_NOTE_CREATED audit event', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 75,
        status: AppointmentStatus.confirmed,
        doctorId: DOCTOR_ID,
        studentId: 8,
        appointmentDate: new Date('2026-09-30T09:00:00.000Z'),
        sessionType: 'follow_up',
        durationMinutes: 50,
        modality: 'virtual',
      });
      tx.clinicalNote.create.mockResolvedValue({ id: 31 });

      const result = await service.create(dto, CURRENT_USER);

      expect(tx.clinicalNote.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 75,
          doctorId: DOCTOR_ID,
          studentId: 8,
          sessionDate: new Date('2026-09-30T09:00:00.000Z'),
          sessionType: 'follow_up',
          durationMinutes: 50,
          modality: 'virtual',
          observations: 'Buen progreso',
        },
      });
      expect(tx.appointment.update).toHaveBeenCalledWith({
        where: { id: 75 },
        data: { status: AppointmentStatus.completed },
      });
      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: DOCTOR_ID,
        institutionId: 5,
        action: 'CLINICAL_NOTE_CREATED',
        entity: 'ClinicalNote',
        entityId: '31',
      });
      expect(result).toEqual({ id: 31 });
    });

    it('allows one note for a legacy completed appointment without transitioning it', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 75,
        status: AppointmentStatus.completed,
        doctorId: DOCTOR_ID,
        studentId: 8,
      });
      tx.clinicalNote.create.mockResolvedValue({ id: 31 });

      await service.create(dto, CURRENT_USER);

      expect(tx.appointment.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the appointment already has a note', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 75,
        status: AppointmentStatus.confirmed,
        doctorId: DOCTOR_ID,
        studentId: 8,
      });
      tx.clinicalNote.findUnique.mockResolvedValue({ id: 31 });

      await expect(service.create(dto, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
      expect(tx.clinicalNote.create).not.toHaveBeenCalled();
      expect(tx.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe('createManual', () => {
    const dto = {
      sessionDate: '2026-09-30T09:00:00.000Z',
      sessionType: 'follow_up',
      durationMinutes: 50,
      modality: 'virtual' as const,
      observations: 'Buen progreso',
    };

    it('throws ForbiddenException when there is no current user', async () => {
      await expect(service.createManual(8, dto, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the patient is absent or inaccessible', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.createManual(8, dto, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
      expect(tx.clinicalNote.create).not.toHaveBeenCalled();
    });

    it('creates a manual note with server-derived patient and author data', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });
      tx.clinicalNote.create.mockResolvedValue({ id: 32 });

      await expect(service.createManual(8, dto, CURRENT_USER)).resolves.toEqual({
        id: 32,
      });
      expect(tx.clinicalNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          doctorId: DOCTOR_ID,
          studentId: 8,
          sessionDate: new Date(dto.sessionDate),
          sessionType: 'follow_up',
          durationMinutes: 50,
          modality: 'virtual',
          observations: 'Buen progreso',
        }),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          action: 'CLINICAL_NOTE_CREATED',
          entityId: '32',
        }),
      );
    });

    it('rejects a future clinical date', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });

      await expect(
        service.createManual(
          8,
          { ...dto, sessionDate: '2999-01-01T00:00:00.000Z' },
          CURRENT_USER,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(tx.clinicalNote.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws ConflictException when the note has already been voided', async () => {
      tx.clinicalNote.findUnique.mockResolvedValue({
        id: 31,
        voidedAt: new Date(),
      });

      await expect(
        service.update(31, { observations: 'x' }, CURRENT_USER),
      ).rejects.toThrow(ConflictException);
      expect(tx.clinicalNote.update).not.toHaveBeenCalled();
    });

    it('updates the note when it is not voided', async () => {
      tx.clinicalNote.findUnique.mockResolvedValue({
        id: 31,
        doctorId: DOCTOR_ID,
        voidedAt: null,
      });
      tx.clinicalNote.update.mockResolvedValue({
        id: 31,
        observations: 'updated',
      });

      const result = await service.update(
        31,
        { observations: 'updated' },
        CURRENT_USER,
      );

      expect(result).toEqual({ id: 31, observations: 'updated' });
      expect(auditService.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ action: 'CLINICAL_NOTE_UPDATED' }),
      );
    });
  });

  describe('findByStudent', () => {
    it('returns a privacy-minimized paginated list ordered by clinical date', async () => {
      const createdAt = new Date('2026-09-30T10:00:00.000Z');
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: { timezone: 'America/Guatemala' } },
      });
      tx.clinicalNote.count.mockResolvedValue(1);
      tx.clinicalNote.findMany.mockResolvedValue([
        {
          id: 31,
          appointmentId: 75,
          sessionDate: new Date('2026-09-29T15:00:00.000Z'),
          sessionType: 'Seguimiento',
          durationMinutes: 50,
          modality: 'virtual',
          observedEmotionalState: 'calm',
          voidedAt: null,
          createdAt,
          updatedAt: createdAt,
          appointment: {
            appointmentDate: new Date('2026-09-29T15:00:00.000Z'),
            status: AppointmentStatus.completed,
          },
          doctor: {
            id: DOCTOR_ID,
            fullName: 'Dra. Rivera',
          },
        },
      ]);

      await expect(service.findByStudent(8, { skip: 0, take: 20 })).resolves
        .toEqual({
          data: [
            expect.objectContaining({
              id: 31,
              appointmentId: 75,
              isVoided: false,
              sessionType: 'Seguimiento',
            }),
          ],
          meta: {
            skip: 0,
            take: 20,
            total: 1,
            totalPages: 1,
            institutionTimezone: 'America/Guatemala',
          },
        });
      expect(tx.studentProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 8 },
        select: {
          user: {
            select: {
              institution: { select: { timezone: true } },
            },
          },
        },
      });
      expect(tx.clinicalNote.findMany).toHaveBeenCalledWith({
        where: { studentId: 8 },
        skip: 0,
        take: 20,
        orderBy: [
          { sessionDate: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        select: expect.any(Object),
      });
      const listQuery = tx.clinicalNote.findMany.mock.calls[0][0] as {
        select: Record<string, unknown>;
      };
      expect(listQuery.select).not.toHaveProperty('observations');
      expect(listQuery.select).not.toHaveProperty('sessionSummary');
      expect(listQuery.select).not.toHaveProperty('aiAssistantAnalysis');
      expect(tx.clinicalNote.count).toHaveBeenCalledWith({
        where: { studentId: 8 },
      });
    });

    it('returns an empty page for a visible patient without clinical notes', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: null },
      });
      tx.clinicalNote.findMany.mockResolvedValue([]);
      tx.clinicalNote.count.mockResolvedValue(0);

      await expect(service.findByStudent(8, {})).resolves.toEqual({
        data: [],
        meta: {
          skip: 0,
          take: 20,
          total: 0,
          totalPages: 0,
          institutionTimezone: 'America/El_Salvador',
        },
      });
    });

    it('throws NotFoundException when the patient is absent or inaccessible', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findByStudent(8, {})).rejects.toThrow(
        NotFoundException,
      );
      expect(tx.clinicalNote.findMany).not.toHaveBeenCalled();
      expect(tx.clinicalNote.count).not.toHaveBeenCalled();
    });
  });

  describe('void', () => {
    it('throws ConflictException when the note is already voided', async () => {
      tx.clinicalNote.findUnique.mockResolvedValue({
        id: 31,
        voidedAt: new Date(),
      });

      await expect(
        service.void(31, { voidReason: 'error' }, CURRENT_USER),
      ).rejects.toThrow(ConflictException);
    });

    it('voids the note and logs a CLINICAL_NOTE_VOIDED audit event', async () => {
      tx.clinicalNote.findUnique.mockResolvedValue({
        id: 31,
        doctorId: DOCTOR_ID,
        voidedAt: null,
      });
      tx.clinicalNote.update.mockResolvedValue({
        id: 31,
        voidedAt: new Date(),
      });

      await service.void(
        31,
        { voidReason: 'Registrada por error' },
        CURRENT_USER,
      );

      expect(tx.clinicalNote.update).toHaveBeenCalledWith({
        where: { id: 31 },
        data: expect.objectContaining({
          voidedById: DOCTOR_ID,
          voidReason: 'Registrada por error',
        }) as unknown,
      });
      expect(auditService.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ action: 'CLINICAL_NOTE_VOIDED' }),
      );
    });
  });
});
