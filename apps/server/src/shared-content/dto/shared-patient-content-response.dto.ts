import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SharedPatientContentResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  studentId!: number;

  @ApiPropertyOptional({ nullable: true })
  therapistId!: string | null;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceLocalId!: string | null;

  @ApiProperty()
  sharedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  revokedAt!: Date | null;

  @ApiProperty()
  updatedAt!: Date;
}
