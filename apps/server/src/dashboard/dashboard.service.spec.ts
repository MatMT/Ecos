import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let tx: {
    studentProfile: { findUnique: jest.Mock; findMany: jest.Mock };
    appointment: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    treatmentPlan: { findFirst: jest.Mock };
    biometricRecord: { findFirst: jest.Mock };
    alert: { findMany: jest.Mock };
    studentActivity: { findMany: jest.Mock };
    clinicalNote: { findMany: jest.Mock };
    sharedPatientContent: { findMany: jest.Mock };
    alertAction: { findMany: jest.Mock };
    institution: { findUnique: jest.Mock };
    user: { count: jest.Mock };
    therapistAssignment: { count: jest.Mock };
    bandDevice: { count: jest.Mock };
  };
  let prisma: { withRls: jest.Mock };

  const CURRENT_USER = {
    id: 'therapist-uuid',
    role: 'psychologist' as const,
    institutionId: 5,
  };

  beforeEach(async () => {
    tx = {
      studentProfile: { findUnique: jest.fn(), findMany: jest.fn() },
      appointment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      treatmentPlan: { findFirst: jest.fn() },
      biometricRecord: { findFirst: jest.fn() },
      alert: { findMany: jest.fn() },
      studentActivity: { findMany: jest.fn() },
      clinicalNote: { findMany: jest.fn() },
      sharedPatientContent: { findMany: jest.fn() },
      alertAction: { findMany: jest.fn() },
      institution: { findUnique: jest.fn() },
      user: { count: jest.fn() },
      therapistAssignment: { count: jest.fn() },
      bandDevice: { count: jest.fn() },
    };
    prisma = { withRls: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)) };

    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(DashboardService);

    tx.appointment.findFirst.mockResolvedValue(null);
    tx.treatmentPlan.findFirst.mockResolvedValue(null);
    tx.biometricRecord.findFirst.mockResolvedValue(null);
    tx.alert.findMany.mockResolvedValue([]);
    tx.studentActivity.findMany.mockResolvedValue([]);
    tx.clinicalNote.findMany.mockResolvedValue([]);
    tx.sharedPatientContent.findMany.mockResolvedValue([]);
    tx.alertAction.findMany.mockResolvedValue([]);
    tx.appointment.findMany.mockResolvedValue([]);
    tx.studentProfile.findMany.mockResolvedValue([]);
    tx.institution.findUnique.mockResolvedValue(null);
  });

  describe('getStudentOverview', () => {
    it('throws NotFoundException when the patient does not exist or is not visible', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.getStudentOverview(8)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns an aggregated overview', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: 'STU-1',
        primaryDiagnosis: null,
        user: { fullName: 'Ana', email: 'ana@example.com' },
        assignedDoctor: { id: 'doc-uuid', fullName: 'Dr. X', email: 'x@e.com' },
      });

      const result = await service.getStudentOverview(8);

      expect(result.student).toEqual({
        id: 8,
        studentCode: 'STU-1',
        primaryDiagnosis: null,
        fullName: 'Ana',
        email: 'ana@example.com',
      });
      expect(result.currentTherapist).toEqual({
        id: 'doc-uuid',
        fullName: 'Dr. X',
        email: 'x@e.com',
      });
      expect(result.openAlerts).toEqual([]);
    });
  });

  describe('getStudentTimeline', () => {
    it('throws NotFoundException when the patient does not exist or is not visible', async () => {
      tx.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.getStudentTimeline(8)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('merges and sorts items from every source, most recent first', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({ id: 8 });
      tx.appointment.findMany.mockResolvedValue([
        {
          id: 1,
          appointmentDate: new Date('2026-01-01'),
          sessionTitle: 'Cita 1',
          status: 'completed',
        },
      ]);
      tx.clinicalNote.findMany.mockResolvedValue([
        { id: 2, createdAt: new Date('2026-01-03'), sessionDiagnosis: 'x' },
      ]);
      tx.alert.findMany.mockResolvedValue([
        {
          id: 3,
          createdAt: new Date('2026-01-02'),
          alertType: 'ai_risk',
          description: 'desc',
        },
      ]);

      const result = await service.getStudentTimeline(8);

      expect(result.map((r) => r.referenceId)).toEqual([2, 3, 1]);
      expect(result[0].type).toBe('CLINICAL_NOTE');
    });
  });

  describe('getPsychologistDashboard', () => {
    it('throws ForbiddenException when there is no current user', async () => {
      await expect(service.getPsychologistDashboard(undefined)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('scopes queries to the caller as the assigned therapist', async () => {
      await service.getPsychologistDashboard(CURRENT_USER);

      expect(tx.studentProfile.findMany).toHaveBeenCalledWith({
        where: { assignedDoctorId: CURRENT_USER.id },
      });
    });
  });

  describe('getAdministratorDashboard', () => {
    it('throws ForbiddenException when the caller has no institution', async () => {
      await expect(
        service.getAdministratorDashboard({
          ...CURRENT_USER,
          institutionId: null,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('scopes counts to the caller institution', async () => {
      tx.user.count.mockResolvedValue(0);
      tx.therapistAssignment.count.mockResolvedValue(0);
      tx.appointment.count.mockResolvedValue(0);
      tx.bandDevice.count.mockResolvedValue(0);

      await service.getAdministratorDashboard({
        ...CURRENT_USER,
        role: Role.administrator,
      });

      expect(tx.user.count).toHaveBeenCalledWith({
        where: { institutionId: 5, role: Role.student },
      });
    });
  });
});
