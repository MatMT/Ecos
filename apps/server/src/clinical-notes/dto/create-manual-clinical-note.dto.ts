import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ClinicalNoteContentDto } from './clinical-note-content.dto';

export const CLINICAL_NOTE_MODALITIES = ['in_person', 'virtual'] as const;

class ManualClinicalNoteContentDto extends OmitType(ClinicalNoteContentDto, [
  'aiAssistantAnalysis',
] as const) {}

export class CreateManualClinicalNoteDto extends ManualClinicalNoteContentDto {
  @ApiProperty({
    description:
      'ISO 8601 clinical session date-time. It cannot be in the future.',
  })
  @IsISO8601({}, { message: 'La fecha clínica debe tener un formato válido.' })
  sessionDate!: string;

  @ApiPropertyOptional({ description: 'Clinical session type.' })
  @IsOptional()
  @IsString({ message: 'El tipo de sesión debe ser un texto válido.' })
  @MaxLength(255, {
    message: 'El tipo de sesión no puede exceder 255 caracteres.',
  })
  sessionType?: string;

  @ApiPropertyOptional({ description: 'Clinical session duration in minutes.' })
  @IsOptional()
  @IsInt({ message: 'La duración de la sesión debe ser un número entero.' })
  @Min(1, { message: 'La duración de la sesión debe ser mayor que cero.' })
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: CLINICAL_NOTE_MODALITIES })
  @IsOptional()
  @IsIn(CLINICAL_NOTE_MODALITIES, {
    message: 'La modalidad de la sesión no es válida.',
  })
  modality?: (typeof CLINICAL_NOTE_MODALITIES)[number];
}
