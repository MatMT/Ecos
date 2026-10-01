import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ description: 'Therapist (User) id.' })
  therapistId!: string;

  @ApiProperty({ description: '1=Monday ... 7=Sunday.' })
  dayOfWeek!: number;

  @ApiProperty({ description: 'HH:mm', example: '08:00' })
  startTime!: string;

  @ApiProperty({ description: 'HH:mm', example: '12:00' })
  endTime!: string;

  @ApiProperty()
  sessionDurationMinutes!: number;

  @ApiProperty()
  breakMinutes!: number;

  @ApiPropertyOptional({ nullable: true })
  validFrom!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  validTo!: Date | null;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
