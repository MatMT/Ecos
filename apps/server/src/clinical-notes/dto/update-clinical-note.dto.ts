import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmotionalState } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClinicalNoteDto {
  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'El diagnóstico registrado debe ser un texto válido.' })
  @MaxLength(255, {
    message: 'El diagnóstico registrado no puede exceder 255 caracteres.',
  })
  @IsOptional()
  sessionDiagnosis?: string | null;

  @ApiPropertyOptional({ enum: EmotionalState, nullable: true })
  @IsEnum(EmotionalState, {
    message: 'El estado emocional observado no es válido.',
  })
  @IsOptional()
  observedEmotionalState?: EmotionalState | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'Las observaciones clínicas deben ser un texto válido.' })
  @IsOptional()
  observations?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'Las notas de la sesión deben ser un texto válido.' })
  @IsOptional()
  sessionSummary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'La impresión clínica debe ser un texto válido.' })
  @IsOptional()
  clinicalImpression?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'Las intervenciones deben ser un texto válido.' })
  @IsOptional()
  interventions?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'Los acuerdos deben ser un texto válido.' })
  @IsOptional()
  agreements?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsString({ message: 'El plan de seguimiento debe ser un texto válido.' })
  @IsOptional()
  followUpPlan?: string | null;
}
