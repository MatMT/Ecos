import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsOptional, Min } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({
    description:
      'New ISO 8601 date-time. Must be strictly in the future and match an available slot.',
    example: '2026-09-22T14:00:00.000Z',
  })
  @IsISO8601()
  appointmentDate!: string;

  @ApiPropertyOptional({
    description:
      "New session duration, in minutes. Defaults to the original appointment's duration.",
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;
}
