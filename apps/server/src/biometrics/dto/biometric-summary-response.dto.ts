import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BiometricRangeKey } from './biometric-range.dto';

export class BiometricMetricSummaryResponseDto {
  @ApiProperty({ minimum: 0 })
  count!: number;

  @ApiPropertyOptional({ nullable: true })
  average!: number | null;

  @ApiPropertyOptional({ nullable: true })
  minimum!: number | null;

  @ApiPropertyOptional({ nullable: true })
  maximum!: number | null;
}

export class BiometricSummaryMetricsResponseDto {
  @ApiProperty({ type: BiometricMetricSummaryResponseDto })
  avgHeartRate!: BiometricMetricSummaryResponseDto;

  @ApiProperty({ type: BiometricMetricSummaryResponseDto })
  stressLevel!: BiometricMetricSummaryResponseDto;

  @ApiProperty({ type: BiometricMetricSummaryResponseDto })
  bloodOxygen!: BiometricMetricSummaryResponseDto;
}

export class BiometricSummaryRangeResponseDto {
  @ApiProperty({ enum: ['24h', '7d', '30d', '90d'] })
  key!: BiometricRangeKey;

  @ApiProperty({ format: 'date-time' })
  from!: Date;

  @ApiProperty({ format: 'date-time' })
  to!: Date;

  @ApiProperty({ enum: ['hour', 'day'] })
  bucket!: 'hour' | 'day';

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;
}

export class BiometricSummarySeriesPointResponseDto {
  @ApiProperty({ format: 'date-time' })
  timestamp!: Date;

  @ApiProperty({ minimum: 0 })
  sampleCount!: number;

  @ApiPropertyOptional({ nullable: true })
  avgHeartRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  stressLevel!: number | null;

  @ApiPropertyOptional({ nullable: true })
  bloodOxygen!: number | null;
}

export class BiometricSummaryResponseDto {
  @ApiProperty({ type: BiometricSummaryRangeResponseDto })
  range!: BiometricSummaryRangeResponseDto;

  @ApiProperty({ minimum: 0 })
  sampleCount!: number;

  @ApiProperty({ type: BiometricSummaryMetricsResponseDto })
  metrics!: BiometricSummaryMetricsResponseDto;

  @ApiProperty({ type: [BiometricSummarySeriesPointResponseDto] })
  series!: BiometricSummarySeriesPointResponseDto[];
}
