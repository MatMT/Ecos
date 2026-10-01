import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { ClinicalNoteContentDto } from './clinical-note-content.dto';

class CreateClinicalNoteContentDto extends OmitType(ClinicalNoteContentDto, [
  'aiAssistantAnalysis',
] as const) {}

export class CreateClinicalNoteDto extends CreateClinicalNoteContentDto {
  @ApiProperty({
    description:
      'The completed appointment this note is for. studentId and doctorId are derived from it — never accepted directly.',
    example: 75,
  })
  @IsInt()
  @Min(1)
  appointmentId!: number;
}
