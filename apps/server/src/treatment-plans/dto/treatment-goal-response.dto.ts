import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TreatmentGoalResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  planId!: number;

  @ApiProperty()
  studentId!: number;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  targetDate!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
