import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateActivityDto } from './create-activity.dto';

export class UpdateActivityDto extends PartialType(CreateActivityDto) {
  @ApiPropertyOptional({
    description: 'Retire an entry from the catalog without deleting it.',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
