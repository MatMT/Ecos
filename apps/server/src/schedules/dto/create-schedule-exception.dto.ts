import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { TIME_STRING_PATTERN } from './create-schedule.dto';

const TIME_FORMAT_MESSAGE = 'La hora debe tener el formato HH:mm.';

export class CreateScheduleExceptionDto {
  @ApiProperty({
    description: 'Calendar date this exception applies to (YYYY-MM-DD).',
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    description:
      'Start of the excepted window, HH:mm. Omit (with endTime also omitted) for a full-day block.',
  })
  @IsString()
  @Matches(TIME_STRING_PATTERN, { message: TIME_FORMAT_MESSAGE })
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End of the excepted window, HH:mm.' })
  @IsString()
  @Matches(TIME_STRING_PATTERN, { message: TIME_FORMAT_MESSAGE })
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    description:
      'true = extraordinary availability (needs startTime/endTime); false = absence/block.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({ description: 'Reason for this exception.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
