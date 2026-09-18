import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BiometricTrendPointDto {
  @ApiProperty({ description: 'Day this point summarizes (YYYY-MM-DD).' })
  date!: string;

  @ApiPropertyOptional({ nullable: true })
  avgHeartRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  avgStressLevel!: number | null;

  @ApiProperty({ description: 'Number of readings this point summarizes.' })
  sampleCount!: number;
}
