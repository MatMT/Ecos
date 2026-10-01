import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AlertPriority, AlertStatus, AlertType, Role } from '@prisma/client';
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
<<<<<<< Updated upstream
    alert: { findMany: jest.Mock };
    studentActivity: { findMany: jest.Mock };
=======
    alert: { count: jest.Mock; findMany: jest.Mock };
    studentActivity: { count: jest.Mock; findMany: jest.Mock };
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      alert: { findMany: jest.fn() },
      studentActivity: { findMany: jest.fn() },
=======
      alert: { count: jest.fn(), findMany: jest.fn() },
      studentActivity: { count: jest.fn(), findMany: jest.fn() },
>>>>>>> Stashed changes
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
    tx.alert.count.mockResolvedValue(0);
    tx.alert.findMany.mockResolvedValue([]);
    tx.studentActivity.findMany.mockResolvedValue([]);
    tx.studentActivity.count.mockResolvedValue(0);
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
<<<<<<< Updated upstream
=======
      tx.studentActivity.findMany.mockResolvedValue([
        {
          id: 21,
          activityId: 4,
          origin: 'psychologist',
          status: 'pending',
          assignedAt: new Date('2026-09-01T10:00:00.000Z'),
          dueAt: null,
          response: 'Respuesta privada',
          activity: { title: 'Registro de emociones' },
        },
      ]);
      tx.studentActivity.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(2);
      tx.treatmentPlan.findFirst.mockResolvedValue({
        id: 51,
        title: 'Plan de seguimiento',
        generalGoal: 'Favorecer la adherencia al tratamiento.',
        startsAt: new Date('2026-09-01T10:00:00.000Z'),
        endsAt: null,
        status: 'active',
        notes: 'Notas clínicas privadas',
      });
      tx.biometricRecord.findFirst.mockResolvedValue({
        id: 61,
        avgHeartRate: 72,
        stressLevel: 18.5,
        bloodOxygen: null,
        timestamp: new Date('2026-09-04T10:00:00.000Z'),
        sleepQualityHours: 7,
        bodyTemperature: 36.5,
      });
      tx.alert.count.mockResolvedValue(4);
      tx.alert.findMany.mockResolvedValue([
        {
          id: 71,
          alertType: AlertType.panic_button,
          priority: AlertPriority.critical,
          status: AlertStatus.new,
          createdAt: new Date('2026-09-05T10:00:00.000Z'),
          description: 'Contexto SOS sensible.',
        },
      ]);
      tx.clinicalNote.findMany.mockResolvedValue([
        {
          id: 31,
          appointmentId: 12,
          createdAt: new Date('2026-09-02T10:00:00.000Z'),
          sessionDate: new Date('2026-09-02T09:00:00.000Z'),
          sessionType: 'follow_up',
          observations: 'Observación privada',
          doctor: {
            id: 'doc-uuid',
            fullName: 'Dra. X',
            email: 'x@e.com',
          },
          appointment: {
            status: 'completed',
          },
        },
      ]);
      tx.sharedPatientContent.findMany.mockResolvedValue([
        {
          id: 41,
          content: 'Contenido privado',
          contentType: 'document',
          sharedAt: new Date('2026-09-03T10:00:00.000Z'),
        },
      ]);
>>>>>>> Stashed changes

      const result = await service.getStudentOverview(8);

      expect(result.student).toEqual({
        id: 8,
        studentCode: 'STU-1',
        fullName: 'Ana',
        email: 'ana@example.com',
      });
      expect(result.institutionTimezone).toBe('America/Guatemala');
      expect(result.currentTherapist).toEqual({
        id: 'doc-uuid',
        fullName: 'Dra. X',
        email: 'x@e.com',
        specialty: 'Terapia familiar',
      });
<<<<<<< Updated upstream
      expect(result.openAlerts).toEqual([]);
=======
      expect(result.pendingActivities).toEqual([
        {
          id: 21,
          activityId: 4,
          title: 'Registro de emociones',
          origin: 'psychologist',
          status: 'pending',
          assignedAt: new Date('2026-09-01T10:00:00.000Z'),
          dueAt: null,
        },
      ]);
      expect(result.activitiesSummary).toEqual({
        totalCount: 4,
        incompleteCount: 2,
        recentAssignments: [
          {
            id: 21,
            activityId: 4,
            title: 'Registro de emociones',
            origin: 'psychologist',
            status: 'pending',
            assignedAt: new Date('2026-09-01T10:00:00.000Z'),
            dueAt: null,
          },
        ],
      });
      expect(result.activeTreatmentPlan).toEqual({
        id: 51,
        title: 'Plan de seguimiento',
        generalGoal: 'Favorecer la adherencia al tratamiento.',
        startsAt: new Date('2026-09-01T10:00:00.000Z'),
        endsAt: null,
        status: 'active',
      });
      expect(result.recentFollowUps).toEqual([
        {
          id: 31,
          appointmentId: 12,
          createdAt: new Date('2026-09-02T10:00:00.000Z'),
          sessionDate: new Date('2026-09-02T09:00:00.000Z'),
          sessionType: 'follow_up',
          status: 'completed',
          therapist: {
            id: 'doc-uuid',
            fullName: 'Dra. X',
            email: 'x@e.com',
            specialty: null,
          },
        },
      ]);
      expect(result.recentSharedContent).toEqual([
        {
          id: 41,
          contentType: 'document',
          sharedAt: new Date('2026-09-03T10:00:00.000Z'),
        },
      ]);
      expect(result.recentBiometricSummary).toEqual({
        id: 61,
        avgHeartRate: 72,
        stressLevel: 18.5,
        bloodOxygen: null,
        timestamp: new Date('2026-09-04T10:00:00.000Z'),
      });
      expect(result.alertsSummary).toEqual({
        openCount: 4,
        recentAlerts: [
          {
            id: 71,
            alertType: AlertType.panic_button,
            priority: AlertPriority.critical,
            status: AlertStatus.new,
            createdAt: new Date('2026-09-05T10:00:00.000Z'),
          },
        ],
      });
      expect(result).not.toHaveProperty('recentClinicalNotes');
      expect(result.student).not.toHaveProperty('primaryDiagnosis');
      expect(result.recentSharedContent[0]).not.toHaveProperty('content');
      expect(result.pendingActivities[0]).not.toHaveProperty('response');
      expect(result.activitiesSummary.recentAssignments[0]).not.toHaveProperty(
        'response',
      );
      expect(result.activitiesSummary.recentAssignments[0]).not.toHaveProperty(
        'instructions',
      );
      expect(result.activeTreatmentPlan).not.toHaveProperty('notes');
      expect(result.recentFollowUps[0]).not.toHaveProperty('observations');
      expect(result.recentFollowUps[0]).not.toHaveProperty(
        'aiAssistantAnalysis',
      );
      expect(result.recentBiometricSummary).not.toHaveProperty(
        'sleepQualityHours',
      );
      expect(result.recentBiometricSummary).not.toHaveProperty(
        'bodyTemperature',
      );
      expect(result.alertsSummary.recentAlerts[0]).not.toHaveProperty(
        'description',
      );

      expect(tx.studentProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 8 },
        select: {
          id: true,
          studentCode: true,
          user: {
            select: {
              fullName: true,
              email: true,
              institution: { select: { timezone: true } },
            },
          },
          assignedDoctor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              psychologistProfile: { select: { specialty: true } },
            },
          },
        },
      });
      expect(tx.alert.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 8,
          status: {
            in: [
              AlertStatus.new,
              AlertStatus.reviewed,
              AlertStatus.in_follow_up,
            ],
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 3,
        select: {
          id: true,
          alertType: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      });
      expect(tx.alert.count).toHaveBeenCalledWith({
        where: {
          studentId: 8,
          status: {
            in: [
              AlertStatus.new,
              AlertStatus.reviewed,
              AlertStatus.in_follow_up,
            ],
          },
        },
      });
      expect(tx.biometricRecord.findFirst).toHaveBeenCalledWith({
        where: { device: { studentId: 8 } },
        orderBy: [
          { timestamp: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        select: {
          id: true,
          avgHeartRate: true,
          stressLevel: true,
          bloodOxygen: true,
          timestamp: true,
        },
      });
      expect(tx.studentActivity.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 8,
          status: { in: ['pending', 'in_progress'] },
        },
        orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
        take: 3,
        select: {
          id: true,
          activityId: true,
          origin: true,
          status: true,
          assignedAt: true,
          dueAt: true,
          activity: { select: { title: true } },
        },
      });
      expect(tx.studentActivity.count).toHaveBeenNthCalledWith(1, {
        where: { studentId: 8 },
      });
      expect(tx.studentActivity.count).toHaveBeenNthCalledWith(2, {
        where: {
          studentId: 8,
          status: { in: ['pending', 'in_progress'] },
        },
      });
      expect(tx.clinicalNote.findMany).toHaveBeenCalledWith({
        where: { studentId: 8, voidedAt: null },
        orderBy: [
          { sessionDate: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        take: 3,
        select: {
          id: true,
          appointmentId: true,
          createdAt: true,
          sessionDate: true,
          sessionType: true,
          doctor: { select: { id: true, fullName: true, email: true } },
          appointment: {
            select: {
              status: true,
            },
          },
        },
      });
      expect(tx.sharedPatientContent.findMany).toHaveBeenCalledWith({
        where: { studentId: 8, revokedAt: null },
        orderBy: { sharedAt: 'desc' },
        take: 3,
        select: { id: true, contentType: true, sharedAt: true },
      });
    });

    it('uses the approved default timezone when the institution is unavailable', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: {
          fullName: 'Ana',
          email: 'ana@example.com',
          institution: null,
        },
        assignedDoctor: null,
      });

      const result = await service.getStudentOverview(8);

      expect(result.institutionTimezone).toBe('America/El_Salvador');
>>>>>>> Stashed changes
    });

    it('excludes completed assignments from the incomplete summary', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: { fullName: 'Ana', email: 'ana@example.com', institution: null },
        assignedDoctor: null,
      });
      tx.studentActivity.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);

      const result = await service.getStudentOverview(8);

      expect(result.activitiesSummary).toEqual({
        totalCount: 2,
        incompleteCount: 0,
        recentAssignments: [],
      });
    });

    it('returns recent incomplete assignments in deterministic assignment order', async () => {
      tx.studentProfile.findUnique.mockResolvedValue({
        id: 8,
        studentCode: null,
        user: { fullName: 'Ana', email: 'ana@example.com', institution: null },
        assignedDoctor: null,
      });
      tx.studentActivity.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      tx.studentActivity.findMany.mockResolvedValue([
        {
          id: 12,
          activityId: 4,
          origin: 'psychologist',
          status: 'in_progress',
          assignedAt: new Date('2026-10-01T10:00:00.000Z'),
          dueAt: new Date('2026-10-03T10:00:00.000Z'),
          activity: { title: 'Actividad histórica inactiva', active: false },
        },
        {
          id: 11,
          activityId: 3,
          origin: 'psychologist',
          status: 'pending',
          assignedAt: new Date('2026-10-01T10:00:00.000Z'),
          dueAt: null,
          activity: { title: 'Actividad vigente', active: true },
        },
      ]);

      const result = await service.getStudentOverview(8);

      expect(result.activitiesSummary).toEqual({
        totalCount: 3,
        incompleteCount: 2,
        recentAssignments: [
          {
            id: 12,
            activityId: 4,
            title: 'Actividad histórica inactiva',
            origin: 'psychologist',
            status: 'in_progress',
            assignedAt: new Date('2026-10-01T10:00:00.000Z'),
            dueAt: new Date('2026-10-03T10:00:00.000Z'),
          },
          {
            id: 11,
            activityId: 3,
            title: 'Actividad vigente',
            origin: 'psychologist',
            status: 'pending',
            assignedAt: new Date('2026-10-01T10:00:00.000Z'),
            dueAt: null,
          },
        ],
      });
      expect(tx.studentActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
          where: {
            studentId: 8,
            status: { in: ['pending', 'in_progress'] },
          },
        }),
      );
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
        {
          id: 2,
          createdAt: new Date('2026-01-03'),
          sessionDate: new Date('2026-01-03'),
          sessionDiagnosis: 'x',
        },
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
        select: { id: true, studentCode: true },
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
