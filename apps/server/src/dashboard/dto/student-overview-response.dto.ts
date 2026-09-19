import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentResponseDto } from '../../appointments/dto/appointment-response.dto';
import { TreatmentPlanResponseDto } from '../../treatment-plans/dto/treatment-plan-response.dto';
import { BiometricRecordResponseDto } from '../../biometrics/dto/biometric-record-response.dto';
import { AlertResponseDto } from '../../alerts/dto/alert-response.dto';
import { StudentActivityResponseDto } from '../../activities/dto/student-activity-response.dto';
import { ClinicalNoteResponseDto } from '../../clinical-notes/dto/clinical-note-response.dto';
import { SharedPatientContentResponseDto } from '../../shared-content/dto/shared-patient-content-response.dto';

class OverviewStudentDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  studentCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  primaryDiagnosis!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;
}

class OverviewTherapistDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;
}

export class StudentOverviewResponseDto {
  @ApiProperty({ type: OverviewStudentDto })
  student!: OverviewStudentDto;

  @ApiPropertyOptional({ type: OverviewTherapistDto, nullable: true })
  currentTherapist!: OverviewTherapistDto | null;

  @ApiPropertyOptional({ type: AppointmentResponseDto, nullable: true })
  nextAppointment!: AppointmentResponseDto | null;

  @ApiPropertyOptional({ type: TreatmentPlanResponseDto, nullable: true })
  activeTreatmentPlan!: TreatmentPlanResponseDto | null;

  @ApiPropertyOptional({ type: BiometricRecordResponseDto, nullable: true })
  recentBiometricSummary!: BiometricRecordResponseDto | null;

  @ApiProperty({ type: [AlertResponseDto] })
  openAlerts!: AlertResponseDto[];

  @ApiProperty({ type: [StudentActivityResponseDto] })
  pendingActivities!: StudentActivityResponseDto[];

  @ApiProperty({ type: [ClinicalNoteResponseDto] })
  recentClinicalNotes!: ClinicalNoteResponseDto[];

  @ApiProperty({ type: [SharedPatientContentResponseDto] })
  recentSharedContent!: SharedPatientContentResponseDto[];
}
