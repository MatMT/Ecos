import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertPriority, AlertType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAlertDto {
  @ApiPropertyOptional({
    example: 45,
    description:
      'Patient ID. If omitted, resolved from the calling authenticated student.',
  })
  @IsOptional()
  @IsInt()
  studentId?: number;

  @ApiProperty({
    enum: AlertType,
    example: AlertType.panic_button,
    description: 'The type of alert triggered.',
  })
  @IsEnum(AlertType)
  alertType: AlertType;

  @ApiPropertyOptional({
    enum: AlertPriority,
    example: AlertPriority.critical,
    description: 'Priority level of the alert.',
  })
  @IsOptional()
  @IsEnum(AlertPriority)
  priority?: AlertPriority;

  @ApiPropertyOptional({
    example: 'Pulsación voluntaria del botón de pánico.',
    description: 'Contextual notes regarding the trigger event.',
  })
  @IsOptional()
  @IsString()
  contextSummary?: string;

  @ApiPropertyOptional({
    example: null,
    description: 'Associated biometric record ID if triggered by an anomaly.',
  })
  @IsOptional()
  @IsInt()
  biometricRecordId?: number | null;
}
