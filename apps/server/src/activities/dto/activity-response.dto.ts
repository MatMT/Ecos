import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  institutionId!: number | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  instructions!: string | null;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
