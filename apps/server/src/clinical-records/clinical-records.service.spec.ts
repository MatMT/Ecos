import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ClinicalRecordsService } from './clinical-records.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ClinicalRecordsService', () => {
  let service: ClinicalRecordsService;
  let tx: {
    studentProfile: { findUnique: jest.Mock };
    clinicalRecord: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withRls: jest.Mock };
  let auditService: { log: jest.Mock };

  const CURRENT_USER = {
    id: 'doctor-uuid',
    role: 'psychologist' as const,
    institutionId: 5,
  };

  beforeEach(async () => {
    tx = {
      studentProfile: { findUnique: jest.fn() },
      clinicalRecord: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    auditService = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ClinicalRecordsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(ClinicalRecordsService);
  });

  describe('create', () => {
    it('throws NotFoundException when the patient does not exist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.create(1, {})).rejects.toThrow(NotFoundException);
      expect(tx.clinicalRecord.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when a record already exists', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 1 });
      tx.clinicalRecord.findUnique.mockResolvedValue({ id: 9, studentId: 1 });

      await expect(service.create(1, {})).rejects.toThrow(ConflictException);
      expect(tx.clinicalRecord.create).not.toHaveBeenCalled();
    });

    it('creates the record when none exists yet', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 1 });
      tx.clinicalRecord.findUnique.mockResolvedValue(null);
      tx.clinicalRecord.create.mockResolvedValue({ id: 9, studentId: 1 });

      const result = await service.create(1, { initialReason: 'Ansiedad' });

      expect(tx.clinicalRecord.create).toHaveBeenCalledWith({
        data: { studentId: 1, initialReason: 'Ansiedad' },
      });
      expect(result).toEqual({ id: 9, studentId: 1 });
    });
  });

  describe('findOne', () => {
    it('throws ForbiddenException when there is no current user', async () => {
      await expect(service.findOne(1, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when no record exists or is visible', async () => {
      tx.clinicalRecord.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('returns the record and logs a CLINICAL_RECORD_VIEWED audit event', async () => {
      const record = { id: 9, studentId: 1 };
      tx.clinicalRecord.findUnique.mockResolvedValue(record);

      const result = await service.findOne(1, CURRENT_USER);

      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: CURRENT_USER.id,
        institutionId: CURRENT_USER.institutionId,
        action: 'CLINICAL_RECORD_VIEWED',
        entity: 'ClinicalRecord',
        entityId: '9',
      });
      expect(result).toEqual(record);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when no record exists yet', async () => {
      tx.clinicalRecord.findUnique.mockResolvedValue(null);

      await expect(service.update(1, {})).rejects.toThrow(NotFoundException);
      expect(tx.clinicalRecord.update).not.toHaveBeenCalled();
    });

    it('updates the record when it exists', async () => {
      tx.clinicalRecord.findUnique.mockResolvedValue({ id: 9, studentId: 1 });
      tx.clinicalRecord.update.mockResolvedValue({
        id: 9,
        studentId: 1,
        currentMedication: 'Sertralina',
      });

      const result = await service.update(1, {
        currentMedication: 'Sertralina',
      });

      expect(tx.clinicalRecord.update).toHaveBeenCalledWith({
        where: { studentId: 1 },
        data: { currentMedication: 'Sertralina' },
      });
      expect(result.currentMedication).toBe('Sertralina');
    });
  });
});
