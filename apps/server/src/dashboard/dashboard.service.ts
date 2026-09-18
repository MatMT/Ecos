import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import {
  startOfDayInTimezone,
  endOfDayInTimezone,
} from '../schedules/timezone.util';
import { TimelineItemDto } from './dto/timeline-item.dto';

const DEFAULT_TIMEZONE = 'America/El_Salvador';
const RECENT_TAKE = 5;
const TIMELINE_SOURCE_LIMIT = 50;
const DEFAULT_TIMELINE_TAKE = 20;
const MAX_TIMELINE_TAKE = 100;

const OPEN_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.pending,
  AppointmentStatus.confirmed,
];

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
        include: { user: true, assignedDoctor: true },
      });
      if (!profile) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const now = new Date();

      const [
        nextAppointment,
        activeTreatmentPlan,
        recentBiometricSummary,
        openAlerts,
        pendingActivities,
        recentClinicalNotes,
        recentSharedContent,
      ] = await Promise.all([
        tx.appointment.findFirst({
          where: {
            studentId,
            appointmentDate: { gte: now },
            status: { in: OPEN_APPOINTMENT_STATUSES },
          },
          orderBy: { appointmentDate: 'asc' },
        }),
        tx.treatmentPlan.findFirst({
          where: { studentId, status: 'active' },
          orderBy: { startsAt: 'desc' },
        }),
        tx.biometricRecord.findFirst({
          where: { device: { studentId } },
          orderBy: { timestamp: 'desc' },
        }),
        tx.alert.findMany({
          where: { studentId, status: { not: 'closed' } },
          orderBy: { createdAt: 'desc' },
          take: RECENT_TAKE,
        }),
        tx.studentActivity.findMany({
          where: { studentId, status: { not: 'completed' } },
          orderBy: { assignedAt: 'desc' },
          take: RECENT_TAKE,
        }),
        tx.clinicalNote.findMany({
          where: { studentId, voidedAt: null },
          orderBy: { createdAt: 'desc' },
          take: RECENT_TAKE,
        }),
        tx.sharedPatientContent.findMany({
          where: { studentId, revokedAt: null },
          orderBy: { sharedAt: 'desc' },
          take: RECENT_TAKE,
        }),
      ]);

      return {
        student: {
          id: profile.id,
          studentCode: profile.studentCode,
          primaryDiagnosis: profile.primaryDiagnosis,
          fullName: profile.user.fullName,
          email: profile.user.email,
        },
        currentTherapist: profile.assignedDoctor
          ? {
              id: profile.assignedDoctor.id,
              fullName: profile.assignedDoctor.fullName,
              email: profile.assignedDoctor.email,
            }
          : null,
        nextAppointment,
        activeTreatmentPlan,
        recentBiometricSummary,
        openAlerts,
        pendingActivities,
        recentClinicalNotes,
        recentSharedContent,
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
            orderBy: { createdAt: 'desc' },
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
        ...clinicalNotes.map((n) => ({
          type: 'CLINICAL_NOTE' as const,
          occurredAt: n.createdAt,
          title: 'Nota clínica',
          referenceId: n.id,
          summary: n.sessionDiagnosis,
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
          take: RECENT_TAKE,
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
          take: RECENT_TAKE,
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
