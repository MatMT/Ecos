import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmotionalState } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClinicalNoteContentDto {
  @ApiPropertyOptional({
    description: 'Diagnosis observed during the session.',
  })
  @IsString({ message: 'El diagnóstico registrado debe ser un texto válido.' })
  @MaxLength(255, {
    message: 'El diagnóstico registrado no puede exceder 255 caracteres.',
  })
  @IsOptional()
  sessionDiagnosis?: string;

  @ApiPropertyOptional({ enum: EmotionalState })
  @IsEnum(EmotionalState, {
    message: 'El estado emocional observado no es válido.',
  })
  @IsOptional()
  observedEmotionalState?: EmotionalState;

  @ApiPropertyOptional()
  @IsString({ message: 'Las observaciones clínicas deben ser un texto válido.' })
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({ description: 'AI-assisted analysis of the session.' })
  @IsString({ message: 'El análisis asistido debe ser un texto válido.' })
  @IsOptional()
  aiAssistantAnalysis?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Las notas de la sesión deben ser un texto válido.' })
  @IsOptional()
  sessionSummary?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'La impresión clínica debe ser un texto válido.' })
  @IsOptional()
  clinicalImpression?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Las intervenciones deben ser un texto válido.' })
  @IsOptional()
  interventions?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'Los acuerdos deben ser un texto válido.' })
  @IsOptional()
  agreements?: string;

  @ApiPropertyOptional()
  @IsString({ message: 'El plan de seguimiento debe ser un texto válido.' })
  @IsOptional()
  followUpPlan?: string;
}
