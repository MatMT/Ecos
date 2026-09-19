import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateClinicalRecordDto {
  @ApiPropertyOptional({
    description: 'Reason the clinical record was opened.',
  })
  @IsString()
  @IsOptional()
  initialReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  psychologicalHistory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  psychiatricHistory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  relevantFamilyHistory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previousTreatments?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentMedication?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  generalObservations?: string;
}
