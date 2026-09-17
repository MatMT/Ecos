import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let tx: {
    activity: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    studentProfile: { findUnique: jest.Mock };
    studentActivity: {
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
  const ADMIN_USER = {
    id: 'admin-uuid',
    role: 'administrator' as const,
    institutionId: 5,
  };

  beforeEach(async () => {
    tx = {
      activity: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      studentProfile: { findUnique: jest.fn() },
      studentActivity: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };

    const module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ActivitiesService);
  });

  describe('create', () => {
    it('throws ForbiddenException when the current user has no institution', async () => {
      await expect(
        service.create(
          { title: 'Diario' },
          { ...ADMIN_USER, institutionId: null },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates the activity scoped to the caller institution', async () => {
      tx.activity.create.mockResolvedValue({ id: 1 });

      const result = await service.create({ title: 'Diario' }, ADMIN_USER);

      expect(tx.activity.create).toHaveBeenCalledWith({
        data: {
          institutionId: 5,
          title: 'Diario',
          description: undefined,
          instructions: undefined,
        },
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('assign', () => {
    const dto = { activityId: 3 };

    it('throws NotFoundException when the patient does not exist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.assign(8, dto, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the activity does not exist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });
      tx.activity.findUnique.mockResolvedValue(null);

      await expect(service.assign(8, dto, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates the assignment with origin=psychologist and the caller as therapist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });
      tx.activity.findUnique.mockResolvedValue({ id: 3 });
      tx.studentActivity.create.mockResolvedValue({ id: 1 });

      const result = await service.assign(8, dto, CURRENT_USER);

      expect(tx.studentActivity.create).toHaveBeenCalledWith({
        data: {
          studentId: 8,
          activityId: 3,
          therapistId: THERAPIST_ID,
          origin: 'psychologist',
          dueAt: undefined,
        },
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('updateAssignment', () => {
    it('throws NotFoundException when the assignment does not exist', async () => {
      tx.studentActivity.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAssignment(1, { status: 'completed' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets completedAt when transitioning to completed', async () => {
      tx.studentActivity.findUnique.mockResolvedValue({
        id: 1,
        status: 'pending',
      });
      tx.studentActivity.update.mockResolvedValue({
        id: 1,
        status: 'completed',
      });

      await service.updateAssignment(1, { status: 'completed' });

      expect(tx.studentActivity.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'completed',
          completedAt: expect.any(Date) as unknown,
        }) as unknown,
      });
    });

    it('does not re-set completedAt when already completed', async () => {
      tx.studentActivity.findUnique.mockResolvedValue({
        id: 1,
        status: 'completed',
      });
      tx.studentActivity.update.mockResolvedValue({
        id: 1,
        status: 'completed',
      });

      await service.updateAssignment(1, { response: 'Listo' });

      expect(tx.studentActivity.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          completedAt: undefined,
        }) as unknown,
      });
    });
  });
});
