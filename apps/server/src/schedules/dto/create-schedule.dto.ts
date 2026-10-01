import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const TIME_STRING_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIME_FORMAT_MESSAGE = 'La hora debe tener el formato HH:mm.';

export class CreateScheduleDto {
  @ApiProperty({
    description:
      'ISO day of week this block applies to: 1=Monday ... 7=Sunday.',
    minimum: 1,
    maximum: 7,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({
    description: 'Block start time, 24h HH:mm.',
    example: '08:00',
  })
  @IsString()
  @Matches(TIME_STRING_PATTERN, { message: TIME_FORMAT_MESSAGE })
  startTime!: string;

  @ApiProperty({ description: 'Block end time, 24h HH:mm.', example: '12:00' })
  @IsString()
  @Matches(TIME_STRING_PATTERN, { message: TIME_FORMAT_MESSAGE })
  endTime!: string;

  @ApiPropertyOptional({
    description: 'Session duration, in minutes.',
    default: 60,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  sessionDurationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Break between consecutive sessions, in minutes.',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakMinutes?: number;

  @ApiPropertyOptional({
    description: 'First calendar date this block applies from (YYYY-MM-DD).',
  })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Last calendar date this block applies to (YYYY-MM-DD).',
  })
  @IsDateString()
  @IsOptional()
  validTo?: string;
}
