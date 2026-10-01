import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority, AlertStatus, AlertType } from '@prisma/client';

export class AlertDetailActorDto {
  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;
}

export class AlertDetailAssignedTherapistDto extends AlertDetailActorDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;
}

export class AlertDetailPatientDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  studentCode!: string | null;

  @ApiPropertyOptional({ type: AlertDetailAssignedTherapistDto, nullable: true })
  assignedTherapist!: AlertDetailAssignedTherapistDto | null;

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;
}

export class AlertDetailResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: AlertDetailPatientDto })
  patient!: AlertDetailPatientDto;

  @ApiPropertyOptional({ enum: AlertType, nullable: true })
  alertType!: AlertType | null;

  @ApiPropertyOptional({ enum: AlertPriority, nullable: true })
  priority!: AlertPriority | null;

  @ApiProperty({ enum: AlertStatus })
  status!: AlertStatus;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contextSummary!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  reviewedAt!: Date | null;

  @ApiPropertyOptional({ type: AlertDetailActorDto, nullable: true })
  reviewedBy!: AlertDetailActorDto | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  closedAt!: Date | null;

  @ApiPropertyOptional({ type: AlertDetailActorDto, nullable: true })
  closedBy!: AlertDetailActorDto | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
