import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateClinicalRecordDto {
  @ApiPropertyOptional({
    description: 'Reason the clinical record was opened.',
    nullable: true,
  })
  @IsString({ message: 'El motivo inicial debe ser un texto válido.' })
  @IsOptional()
  initialReason?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'El historial psicológico debe ser un texto válido.' })
  @IsOptional()
  psychologicalHistory?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'El historial psiquiátrico debe ser un texto válido.' })
  @IsOptional()
  psychiatricHistory?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({
    message: 'Los antecedentes familiares deben ser un texto válido.',
  })
  @IsOptional()
  relevantFamilyHistory?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'Los tratamientos previos deben ser un texto válido.' })
  @IsOptional()
  previousTreatments?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'La medicación actual debe ser un texto válido.' })
  @IsOptional()
  currentMedication?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({
    message: 'Las observaciones generales deben ser un texto válido.',
  })
  @IsOptional()
  generalObservations?: string | null;
}
