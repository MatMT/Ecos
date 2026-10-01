import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AlertStatus, AppointmentStatus, Role } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import {
  startOfDayInTimezone,
  endOfDayInTimezone,
} from '../schedules/timezone.util';
import { TimelineItemDto } from './dto/timeline-item.dto';

const DEFAULT_TIMEZONE = 'America/El_Salvador';
const OVERVIEW_RECENT_TAKE = 3;
const DASHBOARD_RECENT_TAKE = 5;
const TIMELINE_SOURCE_LIMIT = 50;
const DEFAULT_TIMELINE_TAKE = 20;
const MAX_TIMELINE_TAKE = 100;

const OPEN_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.pending,
  AppointmentStatus.confirmed,
];
const OPEN_ALERT_STATUSES: AlertStatus[] = [
  AlertStatus.new,
  AlertStatus.reviewed,
  AlertStatus.in_follow_up,
];
const INCOMPLETE_ACTIVITY_STATUSES: string[] = ['pending', 'in_progress'];

function todayIsoDate(timezone: string): string {
  const iso = DateTime.now().setZone(timezone).toISODate();
  if (!iso) {
    throw new Error(`Zona horaria inválida: ${timezone}`);
  }
  return iso;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getStudentOverview(studentId: number) {
    return this.prisma.withRls(async (tx) => {
      const profile = await tx.studentProfile.findUnique({
        where: { id: studentId },
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
      if (!profile) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const now = new Date();
      const activitiesSummaryPromise = Promise.all([
        tx.studentActivity.count({ where: { studentId } }),
        tx.studentActivity.count({
          where: {
            studentId,
            status: { in: INCOMPLETE_ACTIVITY_STATUSES },
          },
        }),
        tx.studentActivity.findMany({
          where: {
            studentId,
            status: { in: INCOMPLETE_ACTIVITY_STATUSES },
          },
          orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
          take: OVERVIEW_RECENT_TAKE,
          select: {
            id: true,
            activityId: true,
            origin: true,
            status: true,
            assignedAt: true,
            dueAt: true,
            activity: { select: { title: true } },
          },
        }),
      ]);

      const [
        nextAppointment,
        activeTreatmentPlan,
        recentBiometricSummary,
        openAlertsCount,
        recentOpenAlerts,
        [
          totalActivitiesCount,
          incompleteActivitiesCount,
          recentIncompleteActivities,
        ],
        recentFollowUps,
        recentSharedContent,
      ] = await Promise.all([
        tx.appointment.findFirst({
          where: {
            studentId,
            appointmentDate: { gte: now },
            status: { in: OPEN_APPOINTMENT_STATUSES },
          },
          orderBy: { appointmentDate: 'asc' },
          select: {
            id: true,
            appointmentDate: true,
            endAt: true,
            durationMinutes: true,
            sessionType: true,
            modality: true,
            status: true,
          },
        }),
        tx.treatmentPlan.findFirst({
          where: { studentId, status: 'active' },
          orderBy: { startsAt: 'desc' },
          select: {
            id: true,
            title: true,
            generalGoal: true,
            startsAt: true,
            endsAt: true,
            status: true,
          },
        }),
        tx.biometricRecord.findFirst({
          where: { device: { studentId } },
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
        }),
        tx.alert.count({
          where: { studentId, status: { in: OPEN_ALERT_STATUSES } },
        }),
        tx.alert.findMany({
          where: { studentId, status: { in: OPEN_ALERT_STATUSES } },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: OVERVIEW_RECENT_TAKE,
          select: {
            id: true,
            alertType: true,
            priority: true,
            status: true,
            createdAt: true,
          },
        }),
        activitiesSummaryPromise,
        tx.clinicalNote.findMany({
          where: { studentId, voidedAt: null },
          orderBy: [
            { sessionDate: { sort: 'desc', nulls: 'last' } },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          take: OVERVIEW_RECENT_TAKE,
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
        }),
        tx.sharedPatientContent.findMany({
          where: { studentId, revokedAt: null },
          orderBy: { sharedAt: 'desc' },
          take: OVERVIEW_RECENT_TAKE,
          select: { id: true, contentType: true, sharedAt: true },
        }),
      ]);

      return {
        student: {
          id: profile.id,
          studentCode: profile.studentCode,
          fullName: profile.user.fullName,
          email: profile.user.email,
        },
        institutionTimezone:
          profile.user.institution?.timezone ?? DEFAULT_TIMEZONE,
        currentTherapist: profile.assignedDoctor
          ? {
              id: profile.assignedDoctor.id,
              fullName: profile.assignedDoctor.fullName,
              email: profile.assignedDoctor.email,
              specialty:
                profile.assignedDoctor.psychologistProfile?.specialty ?? null,
            }
          : null,
        nextAppointment: nextAppointment
          ? {
              id: nextAppointment.id,
              appointmentDate: nextAppointment.appointmentDate,
              endAt: nextAppointment.endAt,
              durationMinutes: nextAppointment.durationMinutes,
              sessionType: nextAppointment.sessionType,
              modality: nextAppointment.modality,
              status: nextAppointment.status,
            }
          : null,
        activeTreatmentPlan: activeTreatmentPlan
          ? {
              id: activeTreatmentPlan.id,
              title: activeTreatmentPlan.title,
              generalGoal: activeTreatmentPlan.generalGoal,
              startsAt: activeTreatmentPlan.startsAt,
              endsAt: activeTreatmentPlan.endsAt,
              status: activeTreatmentPlan.status,
            }
          : null,
        recentBiometricSummary: recentBiometricSummary
          ? {
              id: recentBiometricSummary.id,
              avgHeartRate: recentBiometricSummary.avgHeartRate,
              stressLevel: recentBiometricSummary.stressLevel,
              bloodOxygen: recentBiometricSummary.bloodOxygen,
              timestamp: recentBiometricSummary.timestamp,
            }
          : null,
        alertsSummary: {
          openCount: openAlertsCount,
          recentAlerts: recentOpenAlerts.map((alert) => ({
            id: alert.id,
            alertType: alert.alertType,
            priority: alert.priority,
            status: alert.status,
            createdAt: alert.createdAt,
          })),
        },
        activitiesSummary: {
          totalCount: totalActivitiesCount,
          incompleteCount: incompleteActivitiesCount,
          recentAssignments: recentIncompleteActivities.map((activity) => ({
            id: activity.id,
            activityId: activity.activityId,
            title: activity.activity.title,
            origin: activity.origin,
            status: activity.status,
            assignedAt: activity.assignedAt,
            dueAt: activity.dueAt,
          })),
        },
        pendingActivities: recentIncompleteActivities.map((activity) => ({
          id: activity.id,
          activityId: activity.activityId,
          title: activity.activity.title,
          origin: activity.origin,
          status: activity.status,
          assignedAt: activity.assignedAt,
          dueAt: activity.dueAt,
        })),
        recentFollowUps: recentFollowUps.map((followUp) => ({
          id: followUp.id,
          appointmentId: followUp.appointmentId,
          createdAt: followUp.createdAt,
          sessionDate: followUp.sessionDate,
          sessionType: followUp.sessionType,
          status: followUp.appointment?.status ?? null,
          therapist: followUp.doctor
            ? {
                id: followUp.doctor.id,
                fullName: followUp.doctor.fullName,
                email: followUp.doctor.email,
                specialty: null,
              }
            : null,
        })),
        recentSharedContent: recentSharedContent.map((content) => ({
          id: content.id,
          contentType: content.contentType,
          sharedAt: content.sharedAt,
        })),
      };
    });
  }

  getStudentTimeline(studentId: number, take = DEFAULT_TIMELINE_TAKE) {
    return this.prisma.withRls(async (tx) => {
      const profile = await tx.studentProfile.findUnique({
        where: { id: studentId },
      });
      if (!profile) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const [appointments, clinicalNotes, alerts, activities, sharedContent] =
        await Promise.all([
          tx.appointment.findMany({
            where: { studentId },
            orderBy: { appointmentDate: 'desc' },
            take: TIMELINE_SOURCE_LIMIT,
          }),
          tx.clinicalNote.findMany({
            where: { studentId },
            orderBy: [
              { sessionDate: { sort: 'desc', nulls: 'last' } },
              { createdAt: 'desc' },
              { id: 'desc' },
            ],
            take: TIMELINE_SOURCE_LIMIT,
          }),
          tx.alert.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            take: TIMELINE_SOURCE_LIMIT,
          }),
          tx.studentActivity.findMany({
            where: { studentId },
            orderBy: { assignedAt: 'desc' },
            take: TIMELINE_SOURCE_LIMIT,
            include: { activity: true },
          }),
          tx.sharedPatientContent.findMany({
            where: { studentId, revokedAt: null },
            orderBy: { sharedAt: 'desc' },
            take: TIMELINE_SOURCE_LIMIT,
          }),
        ]);

      const items: TimelineItemDto[] = [
        ...appointments
          .filter(
            (a): a is typeof a & { appointmentDate: Date } =>
              a.appointmentDate !== null,
          )
          .map((a) => ({
            type: 'APPOINTMENT' as const,
            occurredAt: a.appointmentDate,
            title: a.sessionTitle ?? 'Cita',
            referenceId: a.id,
            summary: a.status,
          })),
        ...clinicalNotes
          .filter(
            (note): note is typeof note & { sessionDate: Date } =>
              note.sessionDate !== null,
          )
          .map((note) => ({
            type: 'CLINICAL_NOTE' as const,
            occurredAt: note.sessionDate,
            title: 'Nota clínica',
            referenceId: note.id,
            summary: note.sessionDiagnosis,
          })),
        ...alerts.map((al) => ({
          type: 'ALERT' as const,
          occurredAt: al.createdAt,
          title: al.alertType ?? 'Alerta',
          referenceId: al.id,
          summary: al.description,
        })),
        ...activities.map((sa) => ({
          type: 'ACTIVITY' as const,
          occurredAt: sa.assignedAt,
          title: sa.activity.title,
          referenceId: sa.id,
          summary: sa.status,
        })),
        ...sharedContent.map((sc) => ({
          type: 'SHARED_CONTENT' as const,
          occurredAt: sc.sharedAt,
          title: 'Contenido compartido',
          referenceId: sc.id,
          summary: sc.contentType,
        })),
      ];

      items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

      return items.slice(0, Math.min(take, MAX_TIMELINE_TAKE));
    });
  }

  getPsychologistDashboard(currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }
      const therapistId = currentUser.id;

      const institution = currentUser.institutionId
        ? await tx.institution.findUnique({
            where: { id: currentUser.institutionId },
          })
        : null;
      const timezone = institution?.timezone ?? DEFAULT_TIMEZONE;
      const todayDate = todayIsoDate(timezone);
      const todayStart = startOfDayInTimezone(todayDate, timezone);
      const todayEnd = endOfDayInTimezone(todayDate, timezone);

      const [
        assignedPatients,
        todayAppointments,
        upcomingAppointments,
        pendingAlerts,
        priorityAlerts,
        pendingActivities,
        recentFollowUp,
      ] = await Promise.all([
        tx.studentProfile.findMany({
          where: { assignedDoctorId: therapistId },
          select: { id: true, studentCode: true },
        }),
        tx.appointment.findMany({
          where: {
            doctorId: therapistId,
            appointmentDate: { gte: todayStart, lt: todayEnd },
          },
          orderBy: { appointmentDate: 'asc' },
        }),
        tx.appointment.findMany({
          where: {
            doctorId: therapistId,
            appointmentDate: { gte: todayEnd },
            status: { in: OPEN_APPOINTMENT_STATUSES },
          },
          orderBy: { appointmentDate: 'asc' },
          take: DASHBOARD_RECENT_TAKE,
        }),
        tx.alert.findMany({
          where: {
            student: { assignedDoctorId: therapistId },
            status: { not: 'closed' },
          },
          orderBy: { createdAt: 'desc' },
        }),
        tx.alert.findMany({
          where: {
            student: { assignedDoctorId: therapistId },
            priority: { in: ['high', 'critical'] },
            status: { not: 'closed' },
          },
          orderBy: { createdAt: 'desc' },
        }),
        tx.studentActivity.findMany({
          where: {
            student: { assignedDoctorId: therapistId },
            status: { not: 'completed' },
          },
          orderBy: { assignedAt: 'desc' },
        }),
        tx.alertAction.findMany({
          where: { therapistId },
          orderBy: { createdAt: 'desc' },
          take: DASHBOARD_RECENT_TAKE,
        }),
      ]);

      return {
        assignedPatients,
        todayAppointments,
        upcomingAppointments,
        pendingAlerts,
        priorityAlerts,
        pendingActivities,
        recentFollowUp,
      };
    });
  }

  getAdministratorDashboard(currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser?.institutionId) {
        throw new ForbiddenException(
          'No se ha podido identificar la institución del usuario.',
        );
      }
      const institutionId = currentUser.institutionId;

      const institution = await tx.institution.findUnique({
        where: { id: institutionId },
      });
      const timezone = institution?.timezone ?? DEFAULT_TIMEZONE;
      const todayDate = todayIsoDate(timezone);
      const todayStart = startOfDayInTimezone(todayDate, timezone);
      const todayEnd = endOfDayInTimezone(todayDate, timezone);

      const [
        studentCount,
        psychologistCount,
        administratorCount,
        activeAssignmentCount,
        todayAppointmentCount,
        boundBandDeviceCount,
      ] = await Promise.all([
        tx.user.count({ where: { institutionId, role: Role.student } }),
        tx.user.count({ where: { institutionId, role: Role.psychologist } }),
        tx.user.count({ where: { institutionId, role: Role.administrator } }),
        tx.therapistAssignment.count({
          where: { endsAt: null, student: { user: { institutionId } } },
        }),
        tx.appointment.count({
          where: {
            student: { user: { institutionId } },
            appointmentDate: { gte: todayStart, lt: todayEnd },
          },
        }),
        tx.bandDevice.count({
          where: {
            student: { user: { institutionId } },
            bindingStatus: true,
          },
        }),
      ]);

      return {
        studentCount,
        psychologistCount,
        administratorCount,
        activeAssignmentCount,
        todayAppointmentCount,
        boundBandDeviceCount,
      };
    });
  }
}
