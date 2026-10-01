import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  CreateTreatmentPlanDto,
  TREATMENT_PLAN_STATUSES,
} from './create-treatment-plan.dto';

// studentId is intentionally excluded — a plan's patient never changes after creation.
export class UpdateTreatmentPlanDto extends PartialType(
  PickType(CreateTreatmentPlanDto, ['title', 'generalGoal', 'notes'] as const),
) {
  @ApiPropertyOptional({ enum: TREATMENT_PLAN_STATUSES })
  @IsIn(TREATMENT_PLAN_STATUSES)
  @IsOptional()
  status?: string;
}
