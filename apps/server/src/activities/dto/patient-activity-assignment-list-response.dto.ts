import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientActivityAssignmentActivityResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;
}

export class PatientActivityAssignmentTherapistResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;
}

export class PatientActivityAssignmentListItemResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: PatientActivityAssignmentActivityResponseDto })
  activity!: PatientActivityAssignmentActivityResponseDto;

  @ApiPropertyOptional({
    nullable: true,
    type: PatientActivityAssignmentTherapistResponseDto,
  })
  therapist!: PatientActivityAssignmentTherapistResponseDto | null;

  @ApiProperty()
  origin!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  assignedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  dueAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: Date | null;

  @ApiProperty({
    description: 'Whether a patient response exists without exposing its text.',
  })
  hasResponse!: boolean;
}

export class PatientActivityAssignmentListMetaResponseDto {
  @ApiProperty({ minimum: 0 })
  skip!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  take!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0 })
  totalPages!: number;

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;
}

export class PatientActivityAssignmentListResponseDto {
  @ApiProperty({ type: [PatientActivityAssignmentListItemResponseDto] })
  data!: PatientActivityAssignmentListItemResponseDto[];

  @ApiProperty({ type: PatientActivityAssignmentListMetaResponseDto })
  meta!: PatientActivityAssignmentListMetaResponseDto;
}
