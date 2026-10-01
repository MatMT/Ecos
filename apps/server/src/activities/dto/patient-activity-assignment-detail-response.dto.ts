import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientActivityAssignmentDetailTherapistResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;
}

export class PatientActivityAssignmentDetailPatientResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  studentCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: PatientActivityAssignmentDetailTherapistResponseDto,
  })
  assignedTherapist!: PatientActivityAssignmentDetailTherapistResponseDto | null;

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;
}

export class PatientActivityAssignmentDetailActivityResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  instructions!: string | null;

  @ApiProperty()
  active!: boolean;
}

export class PatientActivityAssignmentDetailResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: PatientActivityAssignmentDetailPatientResponseDto })
  patient!: PatientActivityAssignmentDetailPatientResponseDto;

  @ApiProperty({ type: PatientActivityAssignmentDetailActivityResponseDto })
  activity!: PatientActivityAssignmentDetailActivityResponseDto;

  @ApiPropertyOptional({
    nullable: true,
    type: PatientActivityAssignmentDetailTherapistResponseDto,
  })
  therapist!: PatientActivityAssignmentDetailTherapistResponseDto | null;

  @ApiProperty()
  origin!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ format: 'date-time' })
  assignedAt!: Date;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  dueAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  response!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'date-time' })
  completedAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
