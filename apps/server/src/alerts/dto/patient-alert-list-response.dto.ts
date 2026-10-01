import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority, AlertStatus, AlertType } from '@prisma/client';

export class PatientAlertListItemResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ enum: AlertType, nullable: true })
  alertType!: AlertType | null;

  @ApiPropertyOptional({ enum: AlertPriority, nullable: true })
  priority!: AlertPriority | null;

  @ApiProperty({ enum: AlertStatus })
  status!: AlertStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  reviewedAt!: Date | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  closedAt!: Date | null;
}

export class PatientAlertListMetaResponseDto {
  @ApiProperty({ minimum: 0 })
  skip!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  take!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0 })
  totalPages!: number;

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;
}

export class PatientAlertListResponseDto {
  @ApiProperty({ type: [PatientAlertListItemResponseDto] })
  data!: PatientAlertListItemResponseDto[];

  @ApiProperty({ type: PatientAlertListMetaResponseDto })
  meta!: PatientAlertListMetaResponseDto;
}
