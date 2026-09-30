import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ClinicalNoteListQueryDto {
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  take?: number;
}
