import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority, AlertStatus, AlertType } from '@prisma/client';

export class AlertResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  studentId!: number | null;

  @ApiPropertyOptional({ nullable: true })
  biometricRecordId!: number | null;

  @ApiPropertyOptional({ enum: AlertType, nullable: true })
  alertType!: AlertType | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  resolved!: boolean;

  @ApiPropertyOptional({ enum: AlertPriority, nullable: true })
  priority!: AlertPriority | null;

  @ApiProperty({ enum: AlertStatus })
  status!: AlertStatus;

  @ApiPropertyOptional({ nullable: true })
  reviewedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedById!: string | null;

  @ApiPropertyOptional({ nullable: true })
  closedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  contextSummary!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
