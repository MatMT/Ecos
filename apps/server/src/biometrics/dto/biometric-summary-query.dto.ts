import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  BIOMETRIC_RANGE_KEYS,
  type BiometricRangeKey,
} from './biometric-range.dto';

export class BiometricSummaryQueryDto {
  @ApiPropertyOptional({ default: '7d', enum: BIOMETRIC_RANGE_KEYS })
  @IsIn(BIOMETRIC_RANGE_KEYS)
  @IsOptional()
  range?: BiometricRangeKey;
}
