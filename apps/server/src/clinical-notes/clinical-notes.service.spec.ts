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
    appointment: { findUnique: jest.Mock };
    clinicalNote: {
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
      appointment: { findUnique: jest.fn() },
      clinicalNote: {
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

    it('throws ConflictException when the appointment is not completed', async () => {
      tx.appointment.findUnique.mockResolvedValue({
        id: 75,
        status: AppointmentStatus.confirmed,
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
        status: AppointmentStatus.completed,
        doctorId: DOCTOR_ID,
        studentId: 8,
      });
      tx.clinicalNote.create.mockResolvedValue({ id: 31 });

      const result = await service.create(dto, CURRENT_USER);

      expect(tx.clinicalNote.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 75,
          doctorId: DOCTOR_ID,
          studentId: 8,
          observations: 'Buen progreso',
        },
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
      tx.clinicalNote.findUnique.mockResolvedValue({ id: 31, voidedAt: null });
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
      tx.clinicalNote.findUnique.mockResolvedValue({ id: 31, voidedAt: null });
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
