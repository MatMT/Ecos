import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstitutionSummaryDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  name!: string | null;
}

export class AssignedTherapistDto {
  @ApiProperty({ description: 'Therapist User UUID' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  specialty!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  professionalLicense!: string | null;
}

export class NextAppointmentDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  appointmentDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  status!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;
}

export class StudentMeResponseDto {
  @ApiProperty({ description: 'Student profile id.' })
  id!: number;

  @ApiProperty({ description: 'User UUID.' })
  userId!: string;

  @ApiPropertyOptional({ nullable: true })
  studentCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  primaryDiagnosis!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ type: InstitutionSummaryDto, nullable: true })
  institution!: InstitutionSummaryDto | null;

  @ApiPropertyOptional({ type: AssignedTherapistDto, nullable: true })
  assignedTherapist!: AssignedTherapistDto | null;

  @ApiPropertyOptional({ type: NextAppointmentDto, nullable: true })
  nextAppointment!: NextAppointmentDto | null;

  @ApiProperty({ description: 'Number of active treatment plan goals.' })
  activeGoalsCount!: number;
}
