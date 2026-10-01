import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateBiometricSummaryDto {
  @ApiPropertyOptional({
    example: 45,
    description:
      'Patient ID. If omitted, resolved from the caller student identity.',
  })
  @IsOptional()
  @IsInt()
  studentId?: number;

  @ApiProperty({
    example: '2026-09-18T14:00:00Z',
    description: 'Start of the aggregated window (ISO 8601).',
  })
  @IsDateString()
  windowStart: string;

  @ApiProperty({
    example: '2026-09-18T15:00:00Z',
    description: 'End of the aggregated window (ISO 8601).',
  })
  @IsDateString()
  windowEnd: string;

  @ApiProperty({ example: 78, description: 'Average heart rate (BPM).' })
  @IsInt()
  averageHeartRate: number;

  @ApiPropertyOptional({
    example: 118,
    description: 'Maximum heart rate reached (BPM).',
  })
  @IsOptional()
  @IsInt()
  maxHeartRate?: number;

  @ApiProperty({
    example: 34.5,
    description: 'Calculated average autonomic stress index.',
  })
  @IsNumber()
  averageStress: number;

  @ApiPropertyOptional({
    example: 97,
    description: 'Average blood oxygen (SpO2 percentage).',
  })
  @IsOptional()
  @IsInt()
  averageOxygen?: number;

  @ApiPropertyOptional({
    example: 840,
    description: 'Total accumulated steps in the window.',
  })
  @IsOptional()
  @IsInt()
  totalSteps?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Count of classified anomaly episodes.',
  })
  @IsOptional()
  @IsInt()
  anomalyEpisodesCount?: number;
}
