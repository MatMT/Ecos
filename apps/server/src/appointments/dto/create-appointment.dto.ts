import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

// A plain validated string, not a Prisma enum — deliberately deferred (see
// docs/clinical-panel/GOALS.md §5): a small, plausibly-changing catalog, promoted to an
// enum later once it stabilizes.
export const APPOINTMENT_MODALITIES = ['in_person', 'virtual'] as const;

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Patient (StudentProfile) id.', example: 8 })
  @IsInt()
  @Min(1)
  studentId!: number;

  @ApiProperty({
    description:
      'Therapist (User) id — must have role=psychologist, same institution as the patient.',
  })
  @IsUUID()
  doctorId!: string;

  @ApiPropertyOptional({ description: 'Short session title.' })
  @IsString()
  @IsOptional()
  sessionTitle?: string;

  @ApiPropertyOptional({ description: 'Session type/category.' })
  @IsString()
  @IsOptional()
  sessionType?: string;

  @ApiProperty({
    description:
      'ISO 8601 date-time. Must be strictly in the future and match an available slot.',
    example: '2026-09-21T14:00:00.000Z',
  })
  @IsISO8601()
  appointmentDate!: string;

  @ApiPropertyOptional({
    description:
      "Session duration, in minutes. Defaults to the therapist's configured default.",
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({ enum: APPOINTMENT_MODALITIES })
  @IsIn(APPOINTMENT_MODALITIES)
  modality!: string;

  @ApiPropertyOptional({ description: 'Short reason for the appointment.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
