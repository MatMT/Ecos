import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// A plain validated string, not a Prisma enum — deliberately deferred (see
// docs/clinical-panel/GOALS.md §5): no exhaustive value list is given anywhere in the source
// guide, and promoting/renaming a Postgres enum value is strictly harder than a string.
export const TREATMENT_PLAN_STATUSES = ['active', 'closed'] as const;

export class CreateTreatmentPlanDto {
  @ApiProperty({ description: 'Patient (StudentProfile) id.', example: 8 })
  @IsInt()
  @Min(1)
  studentId!: number;

  @ApiPropertyOptional({ description: 'Short plan title.' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'The overall goal this plan works toward.',
  })
  @IsString()
  @IsOptional()
  generalGoal?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
