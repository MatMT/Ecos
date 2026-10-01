import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TreatmentPlansService } from './treatment-plans.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TreatmentPlansService', () => {
  let service: TreatmentPlansService;
  let tx: {
    studentProfile: { findUnique: jest.Mock };
    treatmentPlan: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    treatmentGoal: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let prisma: { withRls: jest.Mock };

  const THERAPIST_ID = 'therapist-uuid';
  const CURRENT_USER = {
    id: THERAPIST_ID,
    role: 'psychologist' as const,
    institutionId: 5,
  };

  beforeEach(async () => {
    tx = {
      studentProfile: { findUnique: jest.fn() },
      treatmentPlan: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      treatmentGoal: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };

    const module = await Test.createTestingModule({
      providers: [
        TreatmentPlansService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TreatmentPlansService);
  });

  describe('create', () => {
    it('throws ForbiddenException when there is no current user', async () => {
      await expect(service.create({ studentId: 8 }, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the patient does not exist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ studentId: 8 }, CURRENT_USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the plan authored by the current user', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });
      tx.treatmentPlan.create.mockResolvedValue({ id: 1 });

      const result = await service.create(
        { studentId: 8, title: 'Plan inicial' },
        CURRENT_USER,
      );

      expect(tx.treatmentPlan.create).toHaveBeenCalledWith({
        data: {
          studentId: 8,
          therapistId: THERAPIST_ID,
          title: 'Plan inicial',
          generalGoal: undefined,
          notes: undefined,
        },
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('close', () => {
    it('throws NotFoundException when the plan does not exist', async () => {
      tx.treatmentPlan.findUnique.mockResolvedValue(null);

      await expect(service.close(1)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the plan is already closed', async () => {
      tx.treatmentPlan.findUnique.mockResolvedValue({
        id: 1,
        status: 'closed',
      });

      await expect(service.close(1)).rejects.toThrow(ConflictException);
      expect(tx.treatmentPlan.update).not.toHaveBeenCalled();
    });

    it('closes an active plan', async () => {
      tx.treatmentPlan.findUnique.mockResolvedValue({
        id: 1,
        status: 'active',
      });
      tx.treatmentPlan.update.mockResolvedValue({ id: 1, status: 'closed' });

      const result = await service.close(1);

      expect(tx.treatmentPlan.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'closed' }) as unknown,
      });
      expect(result).toEqual({ id: 1, status: 'closed' });
    });
  });

  describe('createGoal', () => {
    it('throws NotFoundException when the plan does not exist', async () => {
      tx.treatmentPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.createGoal(1, { description: 'Meta' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('derives studentId from the parent plan', async () => {
      tx.treatmentPlan.findUnique.mockResolvedValue({ id: 1, studentId: 8 });
      tx.treatmentGoal.create.mockResolvedValue({ id: 5 });

      const result = await service.createGoal(1, { description: 'Meta' });

      expect(tx.treatmentGoal.create).toHaveBeenCalledWith({
        data: {
          planId: 1,
          studentId: 8,
          description: 'Meta',
          targetDate: undefined,
        },
      });
      expect(result).toEqual({ id: 5 });
    });
  });

  describe('updateGoal', () => {
    it('throws NotFoundException when the goal does not exist', async () => {
      tx.treatmentGoal.findUnique.mockResolvedValue(null);

      await expect(
        service.updateGoal(1, { status: 'achieved' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the goal when it exists', async () => {
      tx.treatmentGoal.findUnique.mockResolvedValue({ id: 1 });
      tx.treatmentGoal.update.mockResolvedValue({ id: 1, status: 'achieved' });

      const result = await service.updateGoal(1, { status: 'achieved' });

      expect(result).toEqual({ id: 1, status: 'achieved' });
    });
  });
});
