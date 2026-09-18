import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmotionalState } from '@prisma/client';

export class ClinicalNoteResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  appointmentId!: number;

  @ApiPropertyOptional({ nullable: true })
  doctorId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  studentId!: number | null;

  @ApiPropertyOptional({ nullable: true })
  sessionDiagnosis!: string | null;

  @ApiPropertyOptional({ enum: EmotionalState, nullable: true })
  observedEmotionalState!: EmotionalState | null;

  @ApiPropertyOptional({ nullable: true })
  observations!: string | null;

  @ApiPropertyOptional({ nullable: true })
  aiAssistantAnalysis!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sessionSummary!: string | null;

  @ApiPropertyOptional({ nullable: true })
  clinicalImpression!: string | null;

  @ApiPropertyOptional({ nullable: true })
  interventions!: string | null;

  @ApiPropertyOptional({ nullable: true })
  agreements!: string | null;

  @ApiPropertyOptional({ nullable: true })
  followUpPlan!: string | null;

  @ApiPropertyOptional({ nullable: true })
  voidedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  voidedById!: string | null;

  @ApiPropertyOptional({ nullable: true })
  voidReason!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
