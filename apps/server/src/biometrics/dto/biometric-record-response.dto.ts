import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BiometricRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  deviceId!: number | null;

  @ApiPropertyOptional({ nullable: true })
  avgHeartRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  stressLevel!: number | null;

  @ApiPropertyOptional({ nullable: true })
  sleepQualityHours!: number | null;

  @ApiPropertyOptional({ nullable: true })
  bloodOxygen!: number | null;

  @ApiPropertyOptional({ nullable: true })
  systolicBloodPressure!: number | null;

  @ApiPropertyOptional({ nullable: true })
  diastolicBloodPressure!: number | null;

  @ApiPropertyOptional({ nullable: true })
  bodyTemperature!: number | null;

  @ApiPropertyOptional({ nullable: true })
  timestamp!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
