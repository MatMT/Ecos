import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ description: 'Short activity title.' })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Instructions shown to the patient.' })
  @IsString()
  @IsOptional()
  instructions?: string;
}
