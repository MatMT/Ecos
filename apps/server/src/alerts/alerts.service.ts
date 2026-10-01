import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AlertPriority, AlertStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateAlertDto } from './dto/create-alert.dto';
import { ReviewAlertDto } from './dto/review-alert.dto';
import { CreateAlertActionDto } from './dto/create-alert-action.dto';
import { CloseAlertDto } from './dto/close-alert.dto';
import { PatientAlertListQueryDto } from './dto/patient-alert-list-query.dto';
import { AlertDetailResponseDto } from './dto/alert-detail-response.dto';

const MAX_PAGE_SIZE = 100;
const DEFAULT_TIMEZONE = 'America/El_Salvador';

interface AlertFilters {
  studentId?: number;
  status?: AlertStatus;
}

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  create(dto: CreateAlertDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      let resolvedStudentId = dto.studentId;

      if (!resolvedStudentId && currentUser) {
        const student = await tx.studentProfile.findFirst({
          where: { userId: currentUser.id },
        });
        if (student) {
          resolvedStudentId = student.id;
        }
      }

      if (!resolvedStudentId) {
        throw new BadRequestException(
          'No se ha podido asociar la alerta a un paciente válido.',
        );
      }

      const alert = await tx.alert.create({
        data: {
          studentId: resolvedStudentId,
          alertType: dto.alertType,
          priority: dto.priority ?? AlertPriority.critical,
          status: AlertStatus.new,
          description: dto.contextSummary
            ? dto.contextSummary.slice(0, 255)
            : 'Pulsación del botón de pánico SOS.',
          contextSummary: dto.contextSummary,
          biometricRecordId: dto.biometricRecordId,
        },
      });

      return alert;
    });
  }

  findAll(filters: AlertFilters, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.alert.findMany({
        where: { studentId: filters.studentId, status: filters.status },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findOne(id: number) {
    const alert = await this.prisma.withRls((tx) =>
      tx.alert.findUnique({ where: { id }, include: { actions: true } }),
    );
    if (!alert) {
      throw new NotFoundException('No se ha encontrado la alerta solicitada.');
    }
    return alert;
  }

  async findByStudent(studentId: number, query: PatientAlertListQueryDto) {
    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 20, MAX_PAGE_SIZE);

    return this.prisma.withRls(async (tx) => {
      const patient = await tx.studentProfile.findUnique({
        where: { id: studentId },
        select: {
          user: {
            select: {
              institution: { select: { timezone: true } },
            },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const where = {
        studentId,
        status: query.status,
        alertType: query.alertType,
        priority: query.priority,
      };
      const select = {
        id: true,
        alertType: true,
        priority: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        closedAt: true,
      };
      const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
      const [data, total] = await Promise.all([
        tx.alert.findMany({ where, skip, take, orderBy, select }),
        tx.alert.count({ where }),
      ]);

      return {
        data,
        meta: {
          skip,
          take,
          total,
          totalPages: Math.ceil(total / take),
          institutionTimezone:
            patient.user.institution?.timezone ?? DEFAULT_TIMEZONE,
        },
      };
    });
  }

  async findOneByStudent(
    studentId: number,
    alertId: number,
  ): Promise<AlertDetailResponseDto> {
    return this.prisma.withRls(async (tx) => {
      const patient = await tx.studentProfile.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          studentCode: true,
          user: {
            select: {
              email: true,
              fullName: true,
              institution: { select: { timezone: true } },
            },
          },
          assignedDoctor: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException(
          'No se ha encontrado el paciente solicitado.',
        );
      }

      const alert = await tx.alert.findFirst({
        where: { id: alertId, studentId },
        select: {
          id: true,
          alertType: true,
          priority: true,
          status: true,
          description: true,
          contextSummary: true,
          reviewedAt: true,
          closedAt: true,
          createdAt: true,
          updatedAt: true,
          reviewedBy: { select: { fullName: true } },
          actions: {
            where: { actionType: 'closed' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { therapist: { select: { fullName: true } } },
          },
        },
      });

      if (!alert) {
        throw new NotFoundException('No se ha encontrado la alerta solicitada.');
      }

      const closingAction = alert.actions[0] ?? null;

      return {
        id: alert.id,
        patient: {
          id: patient.id,
          fullName: patient.user.fullName,
          email: patient.user.email,
          studentCode: patient.studentCode,
          assignedTherapist: patient.assignedDoctor,
          institutionTimezone:
            patient.user.institution?.timezone ?? DEFAULT_TIMEZONE,
        },
        alertType: alert.alertType,
        priority: alert.priority,
        status: alert.status,
        description: alert.description,
        contextSummary: alert.contextSummary,
        reviewedAt: alert.reviewedAt,
        reviewedBy: alert.reviewedBy,
        closedAt: alert.closedAt,
        closedBy: closingAction?.therapist ?? null,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      };
    });
  }

  findActionsByAlert(alertId: number, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.alertAction.findMany({
        where: { alertId },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  review(id: number, dto: ReviewAlertDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const alert = await tx.alert.findUnique({ where: { id } });
      if (!alert) {
        throw new NotFoundException('No se ha encontrado la alerta indicada.');
      }
      if (alert.status !== AlertStatus.new) {
        throw new ConflictException('La alerta ya ha sido revisada.');
      }
      if (alert.studentId === null) {
        throw new ConflictException('La alerta no tiene un paciente asociado.');
      }

      const reviewed = await tx.alert.updateMany({
        where: { id, status: AlertStatus.new },
        data: {
          status: AlertStatus.reviewed,
          reviewedAt: new Date(),
          reviewedById: currentUser.id,
        },
      });

      if (reviewed.count !== 1) {
        throw new ConflictException(
          'La alerta cambió de estado antes de poder ser revisada.',
        );
      }

      const updated = await tx.alert.findUnique({ where: { id } });
      if (!updated) {
        throw new NotFoundException('No se ha encontrado la alerta indicada.');
      }

      await tx.alertAction.create({
        data: {
          alertId: id,
          studentId: alert.studentId,
          therapistId: currentUser.id,
          actionType: 'reviewed',
          comment: dto.comment,
        },
      });

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'ALERT_REVIEWED',
        entity: 'Alert',
        entityId: String(id),
        metadata: { patientId: alert.studentId },
      });

      return updated;
    });
  }

  addAction(id: number, dto: CreateAlertActionDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const alert = await tx.alert.findUnique({ where: { id } });
      if (!alert) {
        throw new NotFoundException('No se ha encontrado la alerta indicada.');
      }
      if (alert.status === AlertStatus.new) {
        throw new ConflictException(
          'Debe revisar la alerta antes de registrar una acción.',
        );
      }
      if (alert.status === AlertStatus.closed) {
        throw new ConflictException(
          'No se pueden registrar acciones en una alerta cerrada.',
        );
      }
      if (alert.studentId === null) {
        throw new ConflictException('La alerta no tiene un paciente asociado.');
      }

      const action = await tx.alertAction.create({
        data: {
          alertId: id,
          studentId: alert.studentId,
          therapistId: currentUser.id,
          actionType: dto.actionType,
          comment: dto.comment,
        },
      });

      if (alert.status === AlertStatus.reviewed) {
        await tx.alert.update({
          where: { id },
          data: { status: AlertStatus.in_follow_up },
        });
      }

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'ALERT_ACTION_CREATED',
        entity: 'AlertAction',
        entityId: String(action.id),
      });

      return action;
    });
  }

  close(id: number, dto: CloseAlertDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const alert = await tx.alert.findUnique({ where: { id } });
      if (!alert) {
        throw new NotFoundException('No se ha encontrado la alerta indicada.');
      }
      if (alert.status === AlertStatus.new) {
        throw new ConflictException(
          'Debe revisar la alerta antes de cerrarla.',
        );
      }
      if (alert.status === AlertStatus.closed) {
        throw new ConflictException('La alerta ya se encuentra cerrada.');
      }
      if (alert.studentId === null) {
        throw new ConflictException('La alerta no tiene un paciente asociado.');
      }

      const closed = await tx.alert.updateMany({
        where: {
          id,
          status: { in: [AlertStatus.reviewed, AlertStatus.in_follow_up] },
        },
        data: {
          status: AlertStatus.closed,
          closedAt: new Date(),
          resolved: true,
        },
      });

      if (closed.count !== 1) {
        throw new ConflictException(
          'La alerta cambió de estado antes de poder ser cerrada.',
        );
      }

      const updated = await tx.alert.findUnique({ where: { id } });
      if (!updated) {
        throw new NotFoundException('No se ha encontrado la alerta indicada.');
      }

      await tx.alertAction.create({
        data: {
          alertId: id,
          studentId: alert.studentId,
          therapistId: currentUser.id,
          actionType: 'closed',
          comment: dto.comment,
        },
      });

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'ALERT_CLOSED',
        entity: 'Alert',
        entityId: String(id),
        metadata: { patientId: alert.studentId },
      });

      return updated;
    });
  }
}
