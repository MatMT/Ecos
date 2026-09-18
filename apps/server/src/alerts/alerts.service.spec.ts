import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AlertStatus } from '@prisma/client';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let tx: {
    alert: { findUnique: jest.Mock; update: jest.Mock };
    alertAction: { create: jest.Mock; findMany: jest.Mock };
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
      alert: { findUnique: jest.fn(), update: jest.fn() },
      alertAction: { create: jest.fn(), findMany: jest.fn() },
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
      expect(tx.alert.update).not.toHaveBeenCalled();
    });

    it('reviews a new alert, logs the action and audit event', async () => {
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.new,
      });
      tx.alert.update.mockResolvedValue({
        id: 1,
        status: AlertStatus.reviewed,
      });
      tx.alertAction.create.mockResolvedValue({ id: 10 });

      const result = await service.review(1, { comment: 'ok' }, CURRENT_USER);

      expect(tx.alert.update).toHaveBeenCalledWith({
        where: { id: 1 },
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
        expect.objectContaining({ action: 'ALERT_REVIEWED' }),
      );
      expect(result).toEqual({ id: 1, status: AlertStatus.reviewed });
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
      tx.alert.findUnique.mockResolvedValue({
        id: 1,
        studentId: 8,
        status: AlertStatus.in_follow_up,
      });
      tx.alert.update.mockResolvedValue({ id: 1, status: AlertStatus.closed });
      tx.alertAction.create.mockResolvedValue({ id: 13 });

      const result = await service.close(1, { comment: 'done' }, CURRENT_USER);

      expect(tx.alert.update).toHaveBeenCalledWith({
        where: { id: 1 },
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
        expect.objectContaining({ action: 'ALERT_ACTION_CREATED' }),
      );
      expect(result).toEqual({ id: 1, status: AlertStatus.closed });
    });
  });
});
