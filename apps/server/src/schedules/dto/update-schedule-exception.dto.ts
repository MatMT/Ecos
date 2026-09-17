import { PartialType } from '@nestjs/swagger';
import { CreateScheduleExceptionDto } from './create-schedule-exception.dto';

export class UpdateScheduleExceptionDto extends PartialType(
  CreateScheduleExceptionDto,
) {}
