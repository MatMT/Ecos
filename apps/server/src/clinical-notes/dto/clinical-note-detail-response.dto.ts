import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmotionalState } from '@prisma/client';

export class ClinicalNoteDetailTherapistDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;
}

export class ClinicalNoteDetailAssignedTherapistDto extends ClinicalNoteDetailTherapistDto {
  @ApiPropertyOptional({ nullable: true })
  email!: string | null;
}

export class ClinicalNoteDetailPatientDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  studentCode!: string | null;

  @ApiPropertyOptional({ type: ClinicalNoteDetailAssignedTherapistDto, nullable: true })
  assignedTherapist!: ClinicalNoteDetailAssignedTherapistDto | null;

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;
}

export class ClinicalNoteAppointmentContextDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  appointmentDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  sessionType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  modality!: string | null;
}

export class ClinicalNoteDetailResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: ClinicalNoteDetailPatientDto })
  patient!: ClinicalNoteDetailPatientDto;

  @ApiProperty({ type: ClinicalNoteDetailTherapistDto })
  therapist!: ClinicalNoteDetailTherapistDto;

  @ApiPropertyOptional({ type: ClinicalNoteAppointmentContextDto, nullable: true })
  appointment!: ClinicalNoteAppointmentContextDto | null;

  @ApiPropertyOptional({ nullable: true })
  sessionDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  sessionType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  modality!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sessionDiagnosis!: string | null;

  @ApiPropertyOptional({ enum: EmotionalState, nullable: true })
  observedEmotionalState!: EmotionalState | null;

  @ApiPropertyOptional({ nullable: true })
  sessionSummary!: string | null;

  @ApiPropertyOptional({ nullable: true })
  observations!: string | null;

  @ApiPropertyOptional({ nullable: true })
  clinicalImpression!: string | null;

  @ApiPropertyOptional({ nullable: true })
  interventions!: string | null;

  @ApiPropertyOptional({ nullable: true })
  agreements!: string | null;

  @ApiPropertyOptional({ nullable: true })
  followUpPlan!: string | null;

  @ApiPropertyOptional({ nullable: true })
  aiAssistantAnalysis!: string | null;

  @ApiProperty()
  isVoided!: boolean;

  @ApiPropertyOptional({ nullable: true })
  voidedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
