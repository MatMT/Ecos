import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  BIOMETRIC_RANGE_KEYS,
  type BiometricRangeKey,
} from './biometric-range.dto';

export class BiometricRecordListQueryDto {
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number;

  @ApiPropertyOptional({ enum: BIOMETRIC_RANGE_KEYS })
  @IsIn(BIOMETRIC_RANGE_KEYS)
  @IsOptional()
  range?: BiometricRangeKey;
}
