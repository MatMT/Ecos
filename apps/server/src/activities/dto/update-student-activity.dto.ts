import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

// A plain validated string, not a Prisma enum — no exhaustive value list is given anywhere in
// the source guide (same reasoning as TREATMENT_PLAN_STATUSES/TREATMENT_GOAL_STATUSES).
export const STUDENT_ACTIVITY_STATUSES = [
  'pending',
  'in_progress',
  'completed',
] as const;

export class UpdateStudentActivityDto {
  @ApiPropertyOptional({ enum: STUDENT_ACTIVITY_STATUSES })
  @IsIn(STUDENT_ACTIVITY_STATUSES)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: "The patient's response, if any." })
  @IsString()
  @IsOptional()
  response?: string;
}
