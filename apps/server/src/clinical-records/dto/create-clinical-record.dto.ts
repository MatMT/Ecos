import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateClinicalRecordDto {
  @ApiPropertyOptional({
    description: 'Reason the clinical record was opened.',
  })
  @IsString({ message: 'El motivo inicial debe ser un texto válido.' })
  @IsOptional()
  initialReason?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'El historial psicológico debe ser un texto válido.' })
  @IsOptional()
  psychologicalHistory?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'El historial psiquiátrico debe ser un texto válido.' })
  @IsOptional()
  psychiatricHistory?: string;

  @ApiPropertyOptional()
  @IsString({
    message: 'Los antecedentes familiares deben ser un texto válido.',
  })
  @IsOptional()
  relevantFamilyHistory?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Los tratamientos previos deben ser un texto válido.' })
  @IsOptional()
  previousTreatments?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'La medicación actual debe ser un texto válido.' })
  @IsOptional()
  currentMedication?: string;

  @ApiPropertyOptional()
  @IsString({
    message: 'Las observaciones generales deben ser un texto válido.',
  })
  @IsOptional()
  generalObservations?: string;
}
