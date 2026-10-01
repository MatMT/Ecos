import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BiometricRecordListItemResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  avgHeartRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  stressLevel!: number | null;

  @ApiPropertyOptional({ nullable: true })
  bloodOxygen!: number | null;

  @ApiPropertyOptional({ nullable: true })
  timestamp!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class BiometricRecordListMetaResponseDto {
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

export class BiometricRecordListResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    type: BiometricRecordListItemResponseDto,
  })
  latest!: BiometricRecordListItemResponseDto | null;

  @ApiProperty({ type: [BiometricRecordListItemResponseDto] })
  data!: BiometricRecordListItemResponseDto[];

  @ApiProperty({ type: BiometricRecordListMetaResponseDto })
  meta!: BiometricRecordListMetaResponseDto;
}
