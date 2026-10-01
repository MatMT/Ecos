import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AlertPriority, AlertStatus, AlertType } from '@prisma/client';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let tx: {
    alert: {
      count: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    alertAction: { create: jest.Mock; findMany: jest.Mock };
    studentProfile: { findUnique: jest.Mock };
  };
  let prisma: { withRls: jest.Mock };
  let auditService: { log: jest.Mock };

  const THERAPIST_ID = 'therapist-uuid';
  const CURRENT_USER = {
    id: THERAPIST_ID,
    role: 'psychologist' as const,
    institutionId: 5,
  };

  beforeEach(async () => {
    tx = {
      alert: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      alertAction: { create: jest.fn(), findMany: jest.fn() },
      studentProfile: { findUnique: jest.fn() },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };
    auditService = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(AlertsService);
  });

  describe('findByStudent', () => {
    it('returns a minimized, filtered paginated envelope in stable descending order', async () => {
      const alert = {
        id: 18,
        alertType: AlertType.panic_button,
        priority: AlertPriority.critical,
        status: AlertStatus.new,
        createdAt: new Date('2026-09-30T12:00:00.000Z'),
        reviewedAt: null,
        closedAt: null,
      };
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: { timezone: 'America/Guatemala' } },
      });
      tx.alert.findMany.mockResolvedValue([alert]);
      tx.alert.count.mockResolvedValue(21);

      await expect(
        service.findByStudent(8, {
          alertType: AlertType.panic_button,
          priority: AlertPriority.critical,
          skip: 20,
          status: AlertStatus.new,
          take: 20,
        }),
      ).resolves.toEqual({
        data: [alert],
        meta: {
          skip: 20,
          take: 20,
          total: 21,
          totalPages: 2,
          institutionTimezone: 'America/Guatemala',
        },
      });

      expect(tx.alert.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 8,
          status: AlertStatus.new,
          alertType: AlertType.panic_button,
          priority: AlertPriority.critical,
        },
        skip: 20,
        take: 20,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          alertType: true,
          priority: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          closedAt: true,
        },
      });
      expect(tx.alert.count).toHaveBeenCalledWith({
        where: {
          studentId: 8,
          status: AlertStatus.new,
          alertType: AlertType.panic_button,
          priority: AlertPriority.critical,
        },
      });
    });

    it('returns an empty result with the fallback timezone', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        user: { institution: null },
      });
      tx.alert.findMany.mockResolvedValue([]);
      tx.alert.count.mockResolvedValue(0);

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

    it('returns not found before querying alerts when the patient is inaccessible', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findByStudent(8, {})).rejects.toThrow(
        NotFoundException,
      );
      expect(tx.alert.findMany).not.toHaveBeenCalled();
      expect(tx.alert.count).not.toHaveBeenCalled();
    });
  });

  describe('findOneByStudent', () => {
    it('returns an authorized patient-qualified detail projection', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: 'ECOS-008',
        user: {
          email: 'patient@example.com',
          fullName: 'Paciente de prueba',
          institution: { timezone: 'America/Guatemala' },
        },
        assignedDoctor: {
          id: THERAPIST_ID,
          fullName: 'Terapeuta de prueba',
          email: 'therapist@example.com',
        },
      });
      tx.alert.findFirst.mockResolvedValue({
        id: 18,
        alertType: AlertType.panic_button,
        priority: AlertPriority.critical,
        status: AlertStatus.closed,
        description: 'Pulsación del botón SOS.',
        contextSummary: 'Contexto sensible registrado.',
        reviewedAt: new Date('2026-09-30T12:05:00.000Z'),
        closedAt: new Date('2026-09-30T12:10:00.000Z'),
        createdAt: new Date('2026-09-30T12:00:00.000Z'),
        updatedAt: new Date('2026-09-30T12:10:00.000Z'),
        reviewedBy: { fullName: 'Terapeuta de prueba' },
        actions: [{ therapist: { fullName: 'Terapeuta de cierre' } }],
      });

      await expect(service.findOneByStudent(8, 18)).resolves.toEqual({
        id: 18,
        patient: {
          id: 8,
          fullName: 'Paciente de prueba',
          email: 'patient@example.com',
          studentCode: 'ECOS-008',
          assignedTherapist: {
            id: THERAPIST_ID,
            fullName: 'Terapeuta de prueba',
            email: 'therapist@example.com',
          },
          institutionTimezone: 'America/Guatemala',
        },
        alertType: AlertType.panic_button,
        priority: AlertPriority.critical,
        status: AlertStatus.closed,
        description: 'Pulsación del botón SOS.',
        contextSummary: 'Contexto sensible registrado.',
        reviewedAt: new Date('2026-09-30T12:05:00.000Z'),
        reviewedBy: { fullName: 'Terapeuta de prueba' },
        closedAt: new Date('2026-09-30T12:10:00.000Z'),
        closedBy: { fullName: 'Terapeuta de cierre' },
        createdAt: new Date('2026-09-30T12:00:00.000Z'),
        updatedAt: new Date('2026-09-30T12:10:00.000Z'),
      });
      expect(tx.alert.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 18, studentId: 8 } }),
      );
    });

    it('does not query alerts when the requested patient is unavailable', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.findOneByStudent(8, 18)).rejects.toThrow(
        NotFoundException,
      );
      expect(tx.alert.findFirst).not.toHaveBeenCalled();
    });

    it('does not expose an alert that does not belong to the requested patient', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: {
          email: null,
          fullName: null,
          institution: null,
        },
        assignedDoctor: null,
      });
      tx.alert.findFirst.mockResolvedValue(null);

      await expect(service.findOneByStudent(8, 18)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('review', () => {
    it('throws ForbiddenException when there is no current user', async () => {
      await expect(service.review(1, {}, undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when the alert does not exist', async () => {
      tx.alert.findUnique.mockResolvedValue(null);

      await expect(service.review(1, {}, CURRENT_USER)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when already reviewed', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.reviewed,
      });

      await expect(service.review(1, {}, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
      expect(tx.alert.updateMany).not.toHaveBeenCalled();
    });

    it('reviews a new alert, logs the action and audit event', async () => {
      tx.alert.findUnique
        .mockResolvedValueOnce({
          id: 1,
          studentId: 8,
          status: AlertStatus.new,
        })
        .mockResolvedValueOnce({
          id: 1,
          status: AlertStatus.reviewed,
        });
      tx.alert.updateMany.mockResolvedValue({ count: 1 });
      tx.alertAction.create.mockResolvedValue({ id: 10 });

      const result = await service.review(1, { comment: 'ok' }, CURRENT_USER);

      expect(tx.alert.updateMany).toHaveBeenCalledWith({
        where: { id: 1, status: AlertStatus.new },
        data: expect.objectContaining({
          status: AlertStatus.reviewed,
          reviewedById: THERAPIST_ID,
        }) as unknown,
      });
      expect(tx.alertAction.create).toHaveBeenCalledWith({
        data: {
          alertId: 1,
          studentId: 8,
          therapistId: THERAPIST_ID,
          actionType: 'reviewed',
          comment: 'ok',
        },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          action: 'ALERT_REVIEWED',
          metadata: { patientId: 8 },
        }),
      );
      expect(result).toEqual({ id: 1, status: AlertStatus.reviewed });
    });

    it('returns a conflict when another request reviews the alert first', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.new,
      });
      tx.alert.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.review(1, {}, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
      expect(tx.alertAction.create).not.toHaveBeenCalled();
    });
  });

  describe('addAction', () => {
    const dto = { actionType: 'patient_contacted' };

    it('throws ConflictException when the alert has not been reviewed', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.new,
      });

      await expect(service.addAction(1, dto, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
      expect(tx.alertAction.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the alert is already closed', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.closed,
      });

      await expect(service.addAction(1, dto, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
    });

    it('logs the action and bumps status from reviewed to in_follow_up', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.reviewed,
      });
      tx.alertAction.create.mockResolvedValue({ id: 11 });

      const result = await service.addAction(1, dto, CURRENT_USER);

      expect(tx.alertAction.create).toHaveBeenCalledWith({
        data: {
          alertId: 1,
          studentId: 8,
          therapistId: THERAPIST_ID,
          actionType: 'patient_contacted',
          comment: undefined,
        },
      });
      expect(tx.alert.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: AlertStatus.in_follow_up },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ action: 'ALERT_ACTION_CREATED' }),
      );
      expect(result).toEqual({ id: 11 });
    });

    it('does not change status when already in_follow_up', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.in_follow_up,
      });
      tx.alertAction.create.mockResolvedValue({ id: 12 });

      await service.addAction(1, dto, CURRENT_USER);

      expect(tx.alert.update).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('throws ConflictException when not yet reviewed', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.new,
      });

      await expect(service.close(1, {}, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when already closed', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.closed,
      });

      await expect(service.close(1, {}, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
    });

    it('closes a reviewed alert and logs an action + audit event', async () => {
      tx.alert.findUnique
        .mockResolvedValueOnce({
          id: 1,
          studentId: 8,
          status: AlertStatus.in_follow_up,
        })
        .mockResolvedValueOnce({ id: 1, status: AlertStatus.closed });
      tx.alert.updateMany.mockResolvedValue({ count: 1 });
      tx.alertAction.create.mockResolvedValue({ id: 13 });

      const result = await service.close(1, { comment: 'done' }, CURRENT_USER);

      expect(tx.alert.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          status: { in: [AlertStatus.reviewed, AlertStatus.in_follow_up] },
        },
        data: expect.objectContaining({
          status: AlertStatus.closed,
          resolved: true,
        }) as unknown,
      });
      expect(tx.alertAction.create).toHaveBeenCalledWith({
        data: {
          alertId: 1,
          studentId: 8,
          therapistId: THERAPIST_ID,
          actionType: 'closed',
          comment: 'done',
        },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          action: 'ALERT_CLOSED',
          metadata: { patientId: 8 },
        }),
      );
      expect(result).toEqual({ id: 1, status: AlertStatus.closed });
    });

    it('returns a conflict when another request closes the alert first', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.reviewed,
      });
      tx.alert.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.close(1, {}, CURRENT_USER)).rejects.toThrow(
        ConflictException,
      );
      expect(tx.alertAction.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });
});
