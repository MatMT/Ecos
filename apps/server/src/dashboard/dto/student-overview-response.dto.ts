import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AlertPriority,
  AlertStatus,
  AlertType,
  AppointmentStatus,
} from '@prisma/client';

export class OverviewStudentDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  studentCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;
}

export class OverviewTherapistDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  specialty!: string | null;
}

export class OverviewAppointmentDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  appointmentDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  endAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  durationMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  sessionType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  modality!: string | null;

  @ApiPropertyOptional({ enum: AppointmentStatus, nullable: true })
  status!: AppointmentStatus | null;
}

export class OverviewTreatmentPlanDto {
  @ApiProperty()
  id!: number;

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
}

export class OverviewBiometricSummaryDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  avgHeartRate!: number | null;

  @ApiPropertyOptional({ nullable: true })
  stressLevel!: number | null;

  @ApiPropertyOptional({ nullable: true })
  bloodOxygen!: number | null;

  @ApiPropertyOptional({ nullable: true })
  timestamp!: Date | null;
}

export class OverviewAlertDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ enum: AlertType, nullable: true })
  alertType!: AlertType | null;

  @ApiPropertyOptional({ enum: AlertPriority, nullable: true })
  priority!: AlertPriority | null;

  @ApiProperty({ enum: AlertStatus })
  status!: AlertStatus;

  @ApiProperty()
  createdAt!: Date;
}

export class OverviewAlertsSummaryDto {
  @ApiProperty()
  openCount!: number;

  @ApiProperty({ type: [OverviewAlertDto] })
  recentAlerts!: OverviewAlertDto[];
}

export class OverviewActivityDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  activityId!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  origin!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  assignedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  dueAt!: Date | null;
}

export class OverviewActivitiesSummaryDto {
  @ApiProperty({ minimum: 0 })
  totalCount!: number;

  @ApiProperty({
    minimum: 0,
    description: 'Assignments whose status is pending or in_progress.',
  })
  incompleteCount!: number;

  @ApiProperty({ type: [OverviewActivityDto] })
  recentAssignments!: OverviewActivityDto[];
}

export class OverviewFollowUpDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  appointmentId!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  sessionDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  sessionType!: string | null;

  @ApiPropertyOptional({ enum: AppointmentStatus, nullable: true })
  status!: AppointmentStatus | null;

  @ApiPropertyOptional({ type: OverviewTherapistDto, nullable: true })
  therapist!: OverviewTherapistDto | null;
}

export class OverviewSharedContentDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  sharedAt!: Date;
}

export class StudentOverviewResponseDto {
  @ApiProperty({ type: OverviewStudentDto })
  student!: OverviewStudentDto;

  @ApiProperty({ example: 'America/El_Salvador' })
  institutionTimezone!: string;

  @ApiPropertyOptional({ type: OverviewTherapistDto, nullable: true })
  currentTherapist!: OverviewTherapistDto | null;

  @ApiPropertyOptional({ type: OverviewAppointmentDto, nullable: true })
  nextAppointment!: OverviewAppointmentDto | null;

  @ApiPropertyOptional({ type: OverviewTreatmentPlanDto, nullable: true })
  activeTreatmentPlan!: OverviewTreatmentPlanDto | null;

  @ApiPropertyOptional({ type: OverviewBiometricSummaryDto, nullable: true })
  recentBiometricSummary!: OverviewBiometricSummaryDto | null;

  @ApiProperty({ type: OverviewAlertsSummaryDto })
  alertsSummary!: OverviewAlertsSummaryDto;

  @ApiProperty({ type: OverviewActivitiesSummaryDto })
  activitiesSummary!: OverviewActivitiesSummaryDto;

  @ApiProperty({
    type: [OverviewActivityDto],
    deprecated: true,
    description: 'Deprecated compatibility field. Use activitiesSummary.',
  })
  pendingActivities!: OverviewActivityDto[];

  @ApiProperty({ type: [OverviewFollowUpDto] })
  recentFollowUps!: OverviewFollowUpDto[];

  @ApiProperty({ type: [OverviewSharedContentDto] })
  recentSharedContent!: OverviewSharedContentDto[];
}
