import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateStudentActivityDto {
  @ApiProperty({ description: 'Activity (catalog entry) id to assign.' })
  @IsInt()
  @Min(1)
  activityId!: number;

  @ApiPropertyOptional({ description: 'Due date/time (ISO 8601).' })
  @IsDateString()
  @IsOptional()
  dueAt?: string;
}
