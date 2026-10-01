import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let tx: {
    activity: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    studentProfile: { findUnique: jest.Mock };
    studentActivity: {
      create: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let prisma: { withRls: jest.Mock };
  let auditService: { log: jest.Mock };

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
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      studentProfile: { findUnique: jest.fn() },
      studentActivity: {
        create: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(ActivitiesService);
  });

  describe('findAll', () => {
    it('forces psychologists to receive active entries only', async () => {
      tx.activity.findMany.mockResolvedValue([]);
      tx.activity.count.mockResolvedValue(0);

      await service.findAll({ active: false }, CURRENT_USER);

      expect(tx.activity.findMany).toHaveBeenCalledWith({
        where: { active: true },
        skip: 0,
        take: 20,
        orderBy: { title: 'asc' },
      });
    });

    it('allows administrators to filter catalog entries by activity state', async () => {
      tx.activity.findMany.mockResolvedValue([]);
      tx.activity.count.mockResolvedValue(21);

      await service.findAll({ active: false, skip: 4, take: 10 }, ADMIN_USER);

      expect(tx.activity.findMany).toHaveBeenCalledWith({
        where: { active: false },
        skip: 4,
        take: 10,
        orderBy: { title: 'asc' },
      });
    });

    it('searches titles case-insensitively and returns pagination metadata', async () => {
      tx.activity.findMany.mockResolvedValue([{ id: 4, title: 'Respiración' }]);
      tx.activity.count.mockResolvedValue(21);

      await expect(
        service.findAll({ search: 'resp', skip: 10, take: 10 }, ADMIN_USER),
      ).resolves.toEqual({
        data: [{ id: 4, title: 'Respiración' }],
        meta: { skip: 10, take: 10, total: 21, totalPages: 3 },
      });

      expect(tx.activity.findMany).toHaveBeenCalledWith({
        where: {
          active: undefined,
          title: { contains: 'resp', mode: 'insensitive' },
        },
        skip: 10,
        take: 10,
        orderBy: { title: 'asc' },
      });
      expect(tx.activity.count).toHaveBeenCalledWith({
        where: {
          active: undefined,
          title: { contains: 'resp', mode: 'insensitive' },
        },
      });
    });
  });

  describe('findOne', () => {
    it('limits psychologists to active catalog entries', async () => {
      tx.activity.findFirst.mockResolvedValue(null);

      await expect(service.findOne(3, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );

      expect(tx.activity.findFirst).toHaveBeenCalledWith({
        where: { id: 3, active: true },
      });
    });
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
      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: ADMIN_USER.id,
        institutionId: ADMIN_USER.institutionId,
        action: 'ACTIVITY_CREATED',
        entity: 'Activity',
        entityId: '1',
        metadata: { changedFields: ['title', 'description', 'instructions'] },
      });
    });
  });

  describe('update', () => {
    it('records a content update with field names only', async () => {
      tx.activity.findUnique.mockResolvedValue({
        id: 3,
        title: 'Diario',
        description: null,
        instructions: null,
        active: true,
      });
      tx.activity.update.mockResolvedValue({ id: 3, active: true });

      await service.update(3, { title: 'Registro emocional' }, ADMIN_USER);

      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: ADMIN_USER.id,
        institutionId: ADMIN_USER.institutionId,
        action: 'ACTIVITY_UPDATED',
        entity: 'Activity',
        entityId: '3',
        metadata: { changedFields: ['title'] },
      });
    });

    it('records activation without catalog content in audit metadata', async () => {
      tx.activity.findUnique.mockResolvedValue({
        id: 3,
        title: 'Diario',
        description: 'Privada',
        instructions: 'Privadas',
        active: false,
      });
      tx.activity.update.mockResolvedValue({ id: 3, active: true });

      await service.update(3, { active: true }, ADMIN_USER);

      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: ADMIN_USER.id,
        institutionId: ADMIN_USER.institutionId,
        action: 'ACTIVITY_ACTIVATED',
        entity: 'Activity',
        entityId: '3',
        metadata: { changedFields: ['active'] },
      });
    });

    it('records deactivation as a distinct audit action', async () => {
      tx.activity.findUnique.mockResolvedValue({
        id: 3,
        title: 'Diario',
        description: null,
        instructions: null,
        active: true,
      });
      tx.activity.update.mockResolvedValue({ id: 3, active: false });

      await service.update(3, { active: false }, ADMIN_USER);

      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: ADMIN_USER.id,
        institutionId: ADMIN_USER.institutionId,
        action: 'ACTIVITY_DEACTIVATED',
        entity: 'Activity',
        entityId: '3',
        metadata: { changedFields: ['active'] },
      });
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
      tx.activity.findUnique.mockResolvedValue({ id: 3, active: true });
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
      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: CURRENT_USER.id,
        institutionId: CURRENT_USER.institutionId,
        action: 'ACTIVITY_ASSIGNED',
        entity: 'StudentActivity',
        entityId: '1',
        metadata: { activityId: 3, patientId: 8 },
      });
      expect(result).toEqual({ id: 1 });
    });

    it('persists an optional ISO deadline without changing server-owned fields', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });
      tx.activity.findUnique.mockResolvedValue({ id: 3, active: true });
      tx.studentActivity.create.mockResolvedValue({ id: 2 });

      await service.assign(
        8,
        { activityId: 3, dueAt: '2026-10-01T15:30:00.000Z' },
        CURRENT_USER,
      );

      expect(tx.studentActivity.create).toHaveBeenCalledWith({
        data: {
          studentId: 8,
          activityId: 3,
          therapistId: THERAPIST_ID,
          origin: 'psychologist',
          dueAt: new Date('2026-10-01T15:30:00.000Z'),
        },
      });
    });

    it('rejects an inactive activity', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });
      tx.activity.findUnique.mockResolvedValue({ id: 3, active: false });

      await expect(
        service.assign(8, dto, CURRENT_USER),
      ).rejects.toThrow(ConflictException);

      expect(tx.studentActivity.create).not.toHaveBeenCalled();
    });
  });

  describe('findOneByStudent', () => {
    it('returns NotFoundException when RLS hides the patient', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOneByStudent(8, 9)).rejects.toThrow(
        NotFoundException,
      );

      expect(tx.studentActivity.findFirst).not.toHaveBeenCalled();
    });

    it('returns NotFoundException when the assignment does not belong to the patient', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: { email: null, fullName: null, institution: null },
        assignedDoctor: null,
      });
      tx.studentActivity.findFirst.mockResolvedValue(null);

      await expect(service.findOneByStudent(8, 10)).rejects.toThrow(
        NotFoundException,
      );

      expect(tx.studentActivity.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 10, studentId: 8 } }),
      );
    });

    it('preserves nullable assignment fields', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: { email: null, fullName: null, institution: null },
        assignedDoctor: null,
      });
      tx.studentActivity.findFirst.mockResolvedValue({
        id: 9,
        activity: {
          id: 3,
          title: 'Respiración',
          description: null,
          instructions: null,
          active: true,
        },
        therapist: null,
        origin: 'ecos',
        status: 'pending',
        assignedAt: new Date('2026-09-20T10:00:00.000Z'),
        dueAt: null,
        response: null,
        completedAt: null,
        createdAt: new Date('2026-09-20T10:00:00.000Z'),
        updatedAt: new Date('2026-09-20T10:00:00.000Z'),
      });

      const result = await service.findOneByStudent(8, 9);

      expect(result.patient.institutionTimezone).toBe('America/El_Salvador');
      expect(result.therapist).toBeNull();
      expect(result.dueAt).toBeNull();
      expect(result.response).toBeNull();
      expect(result.completedAt).toBeNull();
    });
  });

  describe('findByStudent', () => {
    it('returns compact assignment history with pagination and no response text', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: { timezone: 'America/Guatemala' } },
      });
      tx.studentActivity.findMany.mockResolvedValue([
        {
          id: 9,
          activity: { id: 3, title: 'Respiración' },
          therapist: { id: THERAPIST_ID, fullName: 'Dra. Pérez' },
          origin: 'psychologist',
          status: 'pending',
          assignedAt: new Date('2026-09-20T10:00:00.000Z'),
          dueAt: null,
          completedAt: null,
          response: 'Contenido privado',
        },
      ]);
      tx.studentActivity.count.mockResolvedValue(21);

      await expect(
        service.findByStudent(8, { skip: 10, take: 10, status: 'pending' }),
      ).resolves.toEqual({
        data: [
          {
            id: 9,
            activity: { id: 3, title: 'Respiración' },
            therapist: { id: THERAPIST_ID, fullName: 'Dra. Pérez' },
            origin: 'psychologist',
            status: 'pending',
            assignedAt: new Date('2026-09-20T10:00:00.000Z'),
            dueAt: null,
            completedAt: null,
            hasResponse: true,
          },
        ],
        meta: {
          skip: 10,
          take: 10,
          total: 21,
          totalPages: 3,
          institutionTimezone: 'America/Guatemala',
        },
      });

      expect(tx.studentActivity.findMany).toHaveBeenCalledWith({
        where: { studentId: 8, status: 'pending' },
        skip: 10,
        take: 10,
        orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          origin: true,
          status: true,
          assignedAt: true,
          dueAt: true,
          completedAt: true,
          response: true,
          activity: { select: { id: true, title: true } },
          therapist: { select: { id: true, fullName: true } },
        },
      });
    });

    it('returns NotFoundException when RLS hides the patient', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findByStudent(8, {})).rejects.toThrow(
        NotFoundException,
      );

      expect(tx.studentActivity.findMany).not.toHaveBeenCalled();
    });

    it('keeps historical assignments when the catalog activity is inactive', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: null },
      });
      tx.studentActivity.findMany.mockResolvedValue([]);
      tx.studentActivity.count.mockResolvedValue(0);

      await service.findByStudent(8, {});

      expect(tx.studentActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 8 } }),
      );
    });
  });

  describe('findOneByStudent', () => {
    it('returns the current catalog content and read-only assignment detail', async () => {
      const assignedAt = new Date('2026-09-20T10:00:00.000Z');
      const dueAt = new Date('2026-10-01T15:30:00.000Z');
      const completedAt = new Date('2026-10-02T15:30:00.000Z');
      const createdAt = new Date('2026-09-20T10:00:00.000Z');
      const updatedAt = new Date('2026-10-02T15:30:00.000Z');
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: 'PAC-008',
        user: {
          email: 'patient@example.com',
          fullName: 'Paciente de prueba',
          institution: { timezone: 'America/Guatemala' },
        },
        assignedDoctor: {
          id: THERAPIST_ID,
          fullName: 'Dra. Pérez',
          email: 'therapist@example.com',
        },
      });
      tx.studentActivity.findFirst.mockResolvedValue({
        id: 9,
        activity: {
          id: 3,
          title: 'Respiración',
          description: 'Descripción actual',
          instructions: 'Instrucciones actuales',
          active: false,
        },
        therapist: { id: THERAPIST_ID, fullName: 'Dra. Pérez' },
        origin: 'psychologist',
        status: 'completed',
        assignedAt,
        dueAt,
        response: 'Respuesta registrada',
        completedAt,
        createdAt,
        updatedAt,
      });

      await expect(service.findOneByStudent(8, 9)).resolves.toEqual({
        id: 9,
        patient: {
          id: 8,
          studentCode: 'PAC-008',
          fullName: 'Paciente de prueba',
          email: 'patient@example.com',
          assignedTherapist: {
            id: THERAPIST_ID,
            fullName: 'Dra. Pérez',
            email: 'therapist@example.com',
          },
          institutionTimezone: 'America/Guatemala',
        },
        activity: {
          id: 3,
          title: 'Respiración',
          description: 'Descripción actual',
          instructions: 'Instrucciones actuales',
          active: false,
        },
        therapist: { id: THERAPIST_ID, fullName: 'Dra. Pérez' },
        origin: 'psychologist',
        status: 'completed',
        assignedAt,
        dueAt,
        response: 'Respuesta registrada',
        completedAt,
        createdAt,
        updatedAt,
      });

      expect(tx.studentActivity.findFirst).toHaveBeenCalledWith({
        where: { id: 9, studentId: 8 },
        select: expect.objectContaining({
          activity: {
            select: {
              id: true,
              title: true,
              description: true,
              instructions: true,
              active: true,
            },
          },
        }),
      });
    });

    it('returns NotFoundException when RLS hides the patient', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOneByStudent(8, 9)).rejects.toThrow(
        NotFoundException,
      );

      expect(tx.studentActivity.findFirst).not.toHaveBeenCalled();
    });

    it('returns NotFoundException when the assignment does not belong to the patient', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: { email: null, fullName: null, institution: null },
        assignedDoctor: null,
      });
      tx.studentActivity.findFirst.mockResolvedValue(null);

      await expect(service.findOneByStudent(8, 10)).rejects.toThrow(
        NotFoundException,
      );

      expect(tx.studentActivity.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 10, studentId: 8 } }),
      );
    });

    it('preserves nullable assignment fields', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: { email: null, fullName: null, institution: null },
        assignedDoctor: null,
      });
      tx.studentActivity.findFirst.mockResolvedValue({
        id: 9,
        activity: {
          id: 3,
          title: 'Respiración',
          description: null,
          instructions: null,
          active: true,
        },
        therapist: null,
        origin: 'ecos',
        status: 'pending',
        assignedAt: new Date('2026-09-20T10:00:00.000Z'),
        dueAt: null,
        response: null,
        completedAt: null,
        createdAt: new Date('2026-09-20T10:00:00.000Z'),
        updatedAt: new Date('2026-09-20T10:00:00.000Z'),
      });

      const result = await service.findOneByStudent(8, 9);

      expect(result.patient.institutionTimezone).toBe('America/El_Salvador');
      expect(result.therapist).toBeNull();
      expect(result.dueAt).toBeNull();
      expect(result.response).toBeNull();
      expect(result.completedAt).toBeNull();
    });
  });
});
