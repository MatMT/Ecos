import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const ACTIVITY_ASSIGNMENT_STATUS_VALUES = [
  'pending',
  'in_progress',
  'completed',
] as const;

export class PatientActivityAssignmentListQueryDto {
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number;

  @ApiPropertyOptional({
    enum: ACTIVITY_ASSIGNMENT_STATUS_VALUES,
    description: 'Filter assignments by their persisted workflow status.',
  })
  @IsIn(ACTIVITY_ASSIGNMENT_STATUS_VALUES)
  @IsOptional()
  status?: (typeof ACTIVITY_ASSIGNMENT_STATUS_VALUES)[number];
}
