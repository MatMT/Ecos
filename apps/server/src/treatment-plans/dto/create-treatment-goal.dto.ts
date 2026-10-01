import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTreatmentGoalDto {
  @ApiProperty({ description: 'What this goal is.' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Target date (YYYY-MM-DD).' })
  @IsDateString()
  @IsOptional()
  targetDate?: string;
}
