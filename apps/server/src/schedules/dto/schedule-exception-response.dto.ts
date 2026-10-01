import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleExceptionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ description: 'Therapist (User) id.' })
  therapistId!: string;

  @ApiProperty()
  date!: Date;

  @ApiPropertyOptional({ description: 'HH:mm', nullable: true })
  startTime!: string | null;

  @ApiPropertyOptional({ description: 'HH:mm', nullable: true })
  endTime!: string | null;

  @ApiProperty({
    description: 'true = extraordinary availability; false = absence/block.',
  })
  available!: boolean;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
