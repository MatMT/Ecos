import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateStudentActivityDto } from './dto/create-student-activity.dto';
import { ActivityCatalogListQueryDto } from './dto/activity-catalog-list-query.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  create(dto: CreateActivityDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser?.institutionId) {
        throw new ForbiddenException(
          'No se ha podido identificar la institución del usuario.',
        );
      }
      const activity = await tx.activity.create({
        data: {
          institutionId: currentUser.institutionId,
          title: dto.title,
          description: dto.description,
          instructions: dto.instructions,
        },
      });

      await this.auditService.log(tx, {
        userId: currentUser.id,
        institutionId: currentUser.institutionId,
        action: 'ACTIVITY_CREATED',
        entity: 'Activity',
        entityId: String(activity.id),
        metadata: { changedFields: ['title', 'description', 'instructions'] },
      });

      return activity;
    });
  }

  async findAll(query: ActivityCatalogListQueryDto, currentUser?: RequestUser) {
    if (!currentUser) {
      throw new ForbiddenException('No se ha podido identificar al usuario.');
    }

    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 20, MAX_PAGE_SIZE);
    const active = currentUser.role === Role.psychologist ? true : query.active;
    const where = {
      active,
      ...(query.search
        ? {
            title: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    return this.prisma.withRls(async (tx) => {
      const [data, total] = await Promise.all([
        tx.activity.findMany({
          where,
          skip,
          take,
          orderBy: { title: 'asc' },
        }),
        tx.activity.count({ where }),
      ]);

      return {
        data,
        meta: {
          skip,
          take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    });
  }

  async findOne(id: number, currentUser?: RequestUser) {
    if (!currentUser) {
      throw new ForbiddenException('No se ha podido identificar al usuario.');
    }

    const activity = await this.prisma.withRls((tx) =>
      tx.activity.findFirst({
        where: {
          id,
          ...(currentUser.role === Role.psychologist ? { active: true } : {}),
        },
      }),
    );
    if (!activity) {
      throw new NotFoundException(
        'No se ha encontrado la actividad solicitada.',
      );
    }
    return activity;
  }

  update(id: number, dto: UpdateActivityDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser?.institutionId) {
        throw new ForbiddenException(
          'No se ha podido identificar la institución del usuario.',
        );
      }

      const existing = await tx.activity.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(
          'No se ha encontrado la actividad indicada.',
        );
      }
      const changedFields = getChangedActivityFields(existing, dto);
      const activity = await tx.activity.update({ where: { id }, data: dto });

      if (changedFields.length > 0) {
        await this.auditService.log(tx, {
          userId: currentUser.id,
          institutionId: currentUser.institutionId,
          action: getActivityAuditAction(existing.active, dto.active),
          entity: 'Activity',
          entityId: String(activity.id),
          metadata: { changedFields },
        });
      }

      return activity;
    });
  }

  assign(
    studentId: number,
    dto: CreateStudentActivityDto,
    currentUser?: RequestUser,
  ) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const student = await tx.studentProfile.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException(
          'No se ha encontrado el paciente indicado.',
        );
      }

      const activity = await tx.activity.findUnique({
        where: { id: dto.activityId },
      });
      if (!activity) {
        throw new NotFoundException(
          'No se ha encontrado la actividad indicada.',
        );
      }
      if (!activity.active) {
        throw new ConflictException(
          'La actividad seleccionada no se encuentra disponible para asignación.',
        );
      }

      return tx.studentActivity.create({
        data: {
          studentId,
          activityId: dto.activityId,
          therapistId: currentUser.id,
          origin: 'psychologist',
          dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        },
      });
    });
  }

  findByStudent(studentId: number, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.studentActivity.findMany({
        where: { studentId },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { assignedAt: 'desc' },
      }),
    );
  }

  async findOneAssignment(id: number) {
    const assignment = await this.prisma.withRls((tx) =>
      tx.studentActivity.findUnique({ where: { id } }),
    );
    if (!assignment) {
      throw new NotFoundException(
        'No se ha encontrado la asignación solicitada.',
      );
    }
    return assignment;
  }
}

const ACTIVITY_AUDITED_FIELDS = [
  'title',
  'description',
  'instructions',
  'active',
] as const;

function getChangedActivityFields(
  existing: {
    title: string;
    description: string | null;
    instructions: string | null;
    active: boolean;
  },
  dto: UpdateActivityDto,
): string[] {
  return ACTIVITY_AUDITED_FIELDS.filter(
    (field) => dto[field] !== undefined && dto[field] !== existing[field],
  );
}

function getActivityAuditAction(
  previousActive: boolean,
  nextActive: boolean | undefined,
) {
  if (nextActive !== undefined && nextActive !== previousActive) {
    return nextActive ? 'ACTIVITY_ACTIVATED' : 'ACTIVITY_DEACTIVATED';
  }

  return 'ACTIVITY_UPDATED';
}
