import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TherapistAssignmentResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ description: 'Patient (StudentProfile) id.' })
  studentId!: number;

  @ApiProperty({ description: 'Therapist (User) id.' })
  therapistId!: string;

  @ApiPropertyOptional({
    description: 'User id of whoever created this assignment.',
    nullable: true,
  })
  assignedById!: string | null;

  @ApiProperty()
  startsAt!: Date;

  @ApiPropertyOptional({
    description: 'null while the assignment is still active.',
    nullable: true,
  })
  endsAt!: Date | null;

  @ApiProperty({
    description: "Whether this is the patient's primary assignment.",
  })
  isPrimary!: boolean;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
