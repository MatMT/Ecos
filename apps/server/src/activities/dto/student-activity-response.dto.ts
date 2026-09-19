import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentActivityResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  studentId!: number;

  @ApiProperty()
  activityId!: number;

  @ApiPropertyOptional({ nullable: true })
  therapistId!: string | null;

  @ApiProperty()
  origin!: string;

  @ApiProperty()
  assignedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  dueAt!: Date | null;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  response!: string | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
