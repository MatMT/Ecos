import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateStudentActivityDto } from './dto/create-student-activity.dto';
import { UpdateStudentActivityDto } from './dto/update-student-activity.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateActivityDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser?.institutionId) {
        throw new ForbiddenException(
          'No se ha podido identificar la institución del usuario.',
        );
      }
      return await tx.activity.create({
        data: {
          institutionId: currentUser.institutionId,
          title: dto.title,
          description: dto.description,
          instructions: dto.instructions,
        },
      });
    });
  }

  findAll(skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.activity.findMany({
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { title: 'asc' },
      }),
    );
  }

  async findOne(id: number) {
    const activity = await this.prisma.withRls((tx) =>
      tx.activity.findUnique({ where: { id } }),
    );
    if (!activity) {
      throw new NotFoundException(
        'No se ha encontrado la actividad solicitada.',
      );
    }
    return activity;
  }

  update(id: number, dto: UpdateActivityDto) {
    return this.prisma.withRls(async (tx) => {
      const existing = await tx.activity.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(
          'No se ha encontrado la actividad indicada.',
        );
      }
      return tx.activity.update({ where: { id }, data: dto });
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

  updateAssignment(id: number, dto: UpdateStudentActivityDto) {
    return this.prisma.withRls(async (tx) => {
      const existing = await tx.studentActivity.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(
          'No se ha encontrado la asignación indicada.',
        );
      }

      const justCompleted =
        dto.status === 'completed' && existing.status !== 'completed';

      return tx.studentActivity.update({
        where: { id },
        data: {
          status: dto.status,
          response: dto.response,
          completedAt: justCompleted ? new Date() : undefined,
        },
      });
    });
  }
}
