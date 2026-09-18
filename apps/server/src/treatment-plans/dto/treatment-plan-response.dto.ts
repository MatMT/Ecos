import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TreatmentPlanResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  studentId!: number;

  @ApiProperty()
  therapistId!: string;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiPropertyOptional({ nullable: true })
  generalGoal!: string | null;

  @ApiProperty()
  startsAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  endsAt!: Date | null;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
