import { PartialType } from '@nestjs/swagger';
import { ClinicalNoteContentDto } from './clinical-note-content.dto';

export class UpdateClinicalNoteDto extends PartialType(
  ClinicalNoteContentDto,
) {}
