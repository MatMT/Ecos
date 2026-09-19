import { PartialType } from '@nestjs/swagger';
import { CreateClinicalRecordDto } from './create-clinical-record.dto';

export class UpdateClinicalRecordDto extends PartialType(
  CreateClinicalRecordDto,
) {}
