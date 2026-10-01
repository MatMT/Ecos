import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @ApiPropertyOptional({
    description: 'Reason for cancelling the appointment.',
  })
  @IsString()
  @IsOptional()
  cancelReason?: string;
}
