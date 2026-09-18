import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AlertStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { ReviewAlertDto } from './dto/review-alert.dto';
import { CreateAlertActionDto } from './dto/create-alert-action.dto';
import { CloseAlertDto } from './dto/close-alert.dto';

const MAX_PAGE_SIZE = 100;

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

  findByStudent(studentId: number, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.alert.findMany({
        where: { studentId },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { createdAt: 'desc' },
      }),
    );
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

      const updated = await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.reviewed,
          reviewedAt: new Date(),
          reviewedById: currentUser.id,
        },
      });

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

      const updated = await tx.alert.update({
        where: { id },
        data: {
          status: AlertStatus.closed,
          closedAt: new Date(),
          resolved: true,
        },
      });

      const action = await tx.alertAction.create({
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
        action: 'ALERT_ACTION_CREATED',
        entity: 'AlertAction',
        entityId: String(action.id),
      });

      return updated;
    });
  }
}
