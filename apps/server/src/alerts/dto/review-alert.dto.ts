import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewAlertDto {
  @ApiPropertyOptional({ description: 'Optional note about the review.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
