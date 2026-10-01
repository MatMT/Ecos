import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { CreateTreatmentGoalDto } from './dto/create-treatment-goal.dto';
import { UpdateTreatmentGoalDto } from './dto/update-treatment-goal.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class TreatmentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTreatmentPlanDto, currentUser?: RequestUser) {
    return this.prisma.withRls(async (tx) => {
      if (!currentUser) {
        throw new ForbiddenException('No se ha podido identificar al usuario.');
      }

      const student = await tx.studentProfile.findUnique({
        where: { id: dto.studentId },
      });
      if (!student) {
        throw new NotFoundException(
          'No se ha encontrado el paciente indicado.',
        );
      }

      return tx.treatmentPlan.create({
        data: {
          studentId: dto.studentId,
          therapistId: currentUser.id,
          title: dto.title,
          generalGoal: dto.generalGoal,
          notes: dto.notes,
        },
      });
    });
  }

  findByStudent(studentId: number, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.treatmentPlan.findMany({
        where: { studentId },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { startsAt: 'desc' },
      }),
    );
  }

  async findOne(id: number) {
    const plan = await this.prisma.withRls((tx) =>
      tx.treatmentPlan.findUnique({ where: { id } }),
    );
    if (!plan) {
      throw new NotFoundException('No se ha encontrado el plan solicitado.');
    }
    return plan;
  }

  update(id: number, dto: UpdateTreatmentPlanDto) {
    return this.prisma.withRls(async (tx) => {
      const existing = await tx.treatmentPlan.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('No se ha encontrado el plan indicado.');
      }
      return tx.treatmentPlan.update({ where: { id }, data: dto });
    });
  }

  close(id: number) {
    return this.prisma.withRls(async (tx) => {
      const existing = await tx.treatmentPlan.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('No se ha encontrado el plan indicado.');
      }
      if (existing.status === 'closed') {
        throw new ConflictException('El plan ya se encuentra cerrado.');
      }
      return tx.treatmentPlan.update({
        where: { id },
        data: { status: 'closed', endsAt: new Date() },
      });
    });
  }

  createGoal(planId: number, dto: CreateTreatmentGoalDto) {
    return this.prisma.withRls(async (tx) => {
      const plan = await tx.treatmentPlan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new NotFoundException('No se ha encontrado el plan indicado.');
      }
      return tx.treatmentGoal.create({
        data: {
          planId,
          studentId: plan.studentId,
          description: dto.description,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        },
      });
    });
  }

  findGoalsByPlan(planId: number, skip = 0, take = 20) {
    return this.prisma.withRls((tx) =>
      tx.treatmentGoal.findMany({
        where: { planId },
        skip,
        take: Math.min(take, MAX_PAGE_SIZE),
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  updateGoal(id: number, dto: UpdateTreatmentGoalDto) {
    return this.prisma.withRls(async (tx) => {
      const existing = await tx.treatmentGoal.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('No se ha encontrado la meta indicada.');
      }
      return tx.treatmentGoal.update({
        where: { id },
        data: {
          description: dto.description,
          status: dto.status,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        },
      });
    });
  }
}
