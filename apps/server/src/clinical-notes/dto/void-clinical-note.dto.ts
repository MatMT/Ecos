import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VoidClinicalNoteDto {
  @ApiPropertyOptional({ description: 'Reason for voiding the note.' })
  @IsString()
  @IsOptional()
  voidReason?: string;
}
