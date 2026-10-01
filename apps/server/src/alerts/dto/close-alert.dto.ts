import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CloseAlertDto {
  @ApiPropertyOptional({ description: 'Optional closing note.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
