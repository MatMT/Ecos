import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { ClinicalNoteContentDto } from './clinical-note-content.dto';

export class CreateClinicalNoteDto extends ClinicalNoteContentDto {
  @ApiProperty({
    description:
      'The completed appointment this note is for. studentId and doctorId are derived from it — never accepted directly.',
    example: 75,
  })
  @IsInt()
  @Min(1)
  appointmentId!: number;
}
