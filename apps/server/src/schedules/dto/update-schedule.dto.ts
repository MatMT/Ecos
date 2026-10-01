import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateScheduleDto } from './create-schedule.dto';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
  @ApiPropertyOptional({
    description: 'Whether this block is currently active.',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
