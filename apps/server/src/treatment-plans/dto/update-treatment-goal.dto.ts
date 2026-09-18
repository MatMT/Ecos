import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateTreatmentGoalDto } from './create-treatment-goal.dto';

// A plain validated string, not a Prisma enum — same reasoning as TREATMENT_PLAN_STATUSES.
export const TREATMENT_GOAL_STATUSES = [
  'pending',
  'in_progress',
  'achieved',
] as const;

export class UpdateTreatmentGoalDto extends PartialType(
  CreateTreatmentGoalDto,
) {
  @ApiPropertyOptional({ enum: TREATMENT_GOAL_STATUSES })
  @IsIn(TREATMENT_GOAL_STATUSES)
  @IsOptional()
  status?: string;
}
