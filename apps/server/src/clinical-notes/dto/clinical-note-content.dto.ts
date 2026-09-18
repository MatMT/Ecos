import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmotionalState } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ClinicalNoteContentDto {
  @ApiPropertyOptional({
    description: 'Diagnosis observed during the session.',
  })
  @IsString()
  @IsOptional()
  sessionDiagnosis?: string;

  @ApiPropertyOptional({ enum: EmotionalState })
  @IsEnum(EmotionalState)
  @IsOptional()
  observedEmotionalState?: EmotionalState;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({ description: 'AI-assisted analysis of the session.' })
  @IsString()
  @IsOptional()
  aiAssistantAnalysis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionSummary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clinicalImpression?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  interventions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agreements?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  followUpPlan?: string;
}
