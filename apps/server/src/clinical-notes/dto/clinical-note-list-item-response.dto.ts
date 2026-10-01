import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, EmotionalState } from '@prisma/client';

export class ClinicalNoteTherapistResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

}

export class ClinicalNoteListItemResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  appointmentId!: number | null;

  @ApiPropertyOptional({ nullable: true })
  sessionDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  appointmentDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  sessionType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  modality!: string | null;

  @ApiPropertyOptional({ enum: AppointmentStatus, nullable: true })
  appointmentStatus!: AppointmentStatus | null;

  @ApiPropertyOptional({ enum: EmotionalState, nullable: true })
  observedEmotionalState!: EmotionalState | null;

  @ApiPropertyOptional({ type: ClinicalNoteTherapistResponseDto, nullable: true })
  therapist!: ClinicalNoteTherapistResponseDto | null;

  @ApiProperty()
  isVoided!: boolean;

  @ApiPropertyOptional({ nullable: true })
  voidedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ClinicalNoteListMetaResponseDto {
  @ApiProperty({ minimum: 0 })
  skip!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  take!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0 })
  totalPages!: number;

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;
}

export class ClinicalNoteListResponseDto {
  @ApiProperty({ type: [ClinicalNoteListItemResponseDto] })
  data!: ClinicalNoteListItemResponseDto[];

  @ApiProperty({ type: ClinicalNoteListMetaResponseDto })
  meta!: ClinicalNoteListMetaResponseDto;
}
