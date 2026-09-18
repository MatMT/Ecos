import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { TherapistAssignmentsService } from './therapist-assignments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('TherapistAssignmentsService', () => {
  let service: TherapistAssignmentsService;
  let tx: {
    studentProfile: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { findUnique: jest.Mock };
    therapistAssignment: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let prisma: { withRls: jest.Mock };
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    tx = {
      studentProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      therapistAssignment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };
    prisma = {
      withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)),
    };
    auditService = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        TherapistAssignmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get(TherapistAssignmentsService);
  });

  const fakeTx = () => tx as unknown as Prisma.TransactionClient;

  describe('assignPrimaryTherapist', () => {
    const input = {
      studentId: 1,
      therapistId: 'therapist-uuid',
      assignedById: 'admin-uuid',
      reason: 'test',
    };

    it('throws NotFoundException when the student does not exist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.assignPrimaryTherapist(fakeTx(), input),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the therapist is not a psychologist', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 1,
        user: { institutionId: 5 },
      });
      tx.user.findUnique.mockResolvedValue({
        id: 'therapist-uuid',
        role: Role.student,
        institutionId: 5,
      });

      await expect(
        service.assignPrimaryTherapist(fakeTx(), input),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when the therapist belongs to a different institution', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 1,
        user: { institutionId: 5 },
      });
      tx.user.findUnique.mockResolvedValue({
        id: 'therapist-uuid',
        role: Role.psychologist,
        institutionId: 6,
      });

      await expect(
        service.assignPrimaryTherapist(fakeTx(), input),
      ).rejects.toThrow(BadRequestException);
    });

    it('ends the current active primary assignment and creates the new one', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 1,
        user: { institutionId: 5 },
      });
      tx.user.findUnique.mockResolvedValue({
        id: 'therapist-uuid',
        role: Role.psychologist,
        institutionId: 5,
      });
      tx.therapistAssignment.findFirst.mockResolvedValue({ id: 99 });
      tx.therapistAssignment.create.mockResolvedValue({ id: 100, ...input });

      const result = await service.assignPrimaryTherapist(fakeTx(), input);

      expect(tx.therapistAssignment.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { endsAt: expect.any(Date) as Date },
      });
      expect(tx.therapistAssignment.create).toHaveBeenCalledWith({
        data: {
          studentId: 1,
          therapistId: 'therapist-uuid',
          assignedById: 'admin-uuid',
          isPrimary: true,
          reason: 'test',
        },
      });
      expect(tx.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { assignedDoctorId: 'therapist-uuid' },
      });
      expect(auditService.log).toHaveBeenCalledWith(tx, {
        userId: 'admin-uuid',
        institutionId: 5,
        action: 'THERAPIST_ASSIGNED',
        entity: 'TherapistAssignment',
        entityId: '100',
      });
      expect(result).toEqual({ id: 100, ...input });
    });

    it('does not log an audit event when there is no assignedById', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 1,
        user: { institutionId: 5 },
      });
      tx.user.findUnique.mockResolvedValue({
        id: 'therapist-uuid',
        role: Role.psychologist,
        institutionId: 5,
      });
      tx.therapistAssignment.findFirst.mockResolvedValue(null);
      tx.therapistAssignment.create.mockResolvedValue({ id: 100 });

      await service.assignPrimaryTherapist(fakeTx(), {
        ...input,
        assignedById: undefined,
      });

      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('skips ending a previous assignment when none exists', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 1,
        user: { institutionId: 5 },
      });
      tx.user.findUnique.mockResolvedValue({
        id: 'therapist-uuid',
        role: Role.psychologist,
        institutionId: 5,
      });
      tx.therapistAssignment.findFirst.mockResolvedValue(null);
      tx.therapistAssignment.create.mockResolvedValue({ id: 100 });

      await service.assignPrimaryTherapist(fakeTx(), input);

      expect(tx.therapistAssignment.update).not.toHaveBeenCalled();
    });
  });

  describe('endAssignment', () => {
    it('throws NotFoundException when the assignment does not exist', async () => {
      tx.therapistAssignment.findUnique.mockResolvedValue(null);

      await expect(service.endAssignment(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('clears assignedDoctorId when ending the active primary assignment', async () => {
      tx.therapistAssignment.findUnique.mockResolvedValue({
        id: 1,
        studentId: 1,
        therapistId: 'therapist-uuid',
        isPrimary: true,
        endsAt: null,
        reason: null,
      });
      tx.therapistAssignment.update.mockResolvedValue({ id: 1 });

      await service.endAssignment(1, { reason: 'left the institution' });

      expect(tx.studentProfile.updateMany).toHaveBeenCalledWith({
        where: { id: 1, assignedDoctorId: 'therapist-uuid' },
        data: { assignedDoctorId: null },
      });
    });

    it('does not touch assignedDoctorId when the assignment was already ended', async () => {
      tx.therapistAssignment.findUnique.mockResolvedValue({
        id: 1,
        studentId: 1,
        therapistId: 'therapist-uuid',
        isPrimary: true,
        endsAt: new Date('2020-01-01'),
        reason: null,
      });
      tx.therapistAssignment.update.mockResolvedValue({ id: 1 });

      await service.endAssignment(1, {});

      expect(tx.studentProfile.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('setPrimary', () => {
    it('throws NotFoundException when the assignment does not exist', async () => {
      tx.therapistAssignment.findUnique.mockResolvedValue(null);

      await expect(service.setPrimary(1)).rejects.toThrow(NotFoundException);
    });

    it('re-runs assignPrimaryTherapist with the target row data', async () => {
      tx.therapistAssignment.findUnique.mockResolvedValue({
        id: 1,
        studentId: 1,
        therapistId: 'therapist-uuid',
        assignedById: 'admin-uuid',
        reason: 'old reason',
      });
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 1,
        user: { institutionId: 5 },
      });
      tx.user.findUnique.mockResolvedValue({
        id: 'therapist-uuid',
        role: Role.psychologist,
        institutionId: 5,
      });
      tx.therapistAssignment.findFirst.mockResolvedValue(null);
      tx.therapistAssignment.create.mockResolvedValue({ id: 2 });

      await service.setPrimary(1);

      expect(tx.therapistAssignment.create).toHaveBeenCalledWith({
        data: {
          studentId: 1,
          therapistId: 'therapist-uuid',
          assignedById: 'admin-uuid',
          isPrimary: true,
          reason: 'old reason',
        },
      });
    });
  });
});
