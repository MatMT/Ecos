import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  studentId!: number | null;

  @ApiPropertyOptional({ nullable: true })
  doctorId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sessionTitle!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sessionType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  appointmentDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  endAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  modality!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancelReason!: string | null;

  @ApiPropertyOptional({ enum: AppointmentStatus, nullable: true })
  status!: AppointmentStatus | null;

  @ApiPropertyOptional({ nullable: true })
  createdById!: string | null;

  @ApiPropertyOptional({
    description:
      'Set on the OLD appointment once it has been rescheduled into a new one.',
    nullable: true,
  })
  rescheduledFromId!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
