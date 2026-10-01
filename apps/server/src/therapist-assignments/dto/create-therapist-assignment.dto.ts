import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTherapistAssignmentDto {
  @ApiProperty({ description: 'Patient (StudentProfile) id.', example: 8 })
  @IsInt()
  @Min(1)
  studentId!: number;

  @ApiProperty({
    description:
      'Therapist (User) id — must have role=psychologist, in the same institution as the patient.',
  })
  @IsUUID()
  therapistId!: string;

  @ApiPropertyOptional({ description: 'Reason for this assignment.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
