import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class EndTherapistAssignmentDto {
  @ApiPropertyOptional({ description: 'Reason for ending the assignment.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
