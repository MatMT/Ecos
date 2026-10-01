import { ApiProperty } from '@nestjs/swagger';
import { AppointmentResponseDto } from '../../appointments/dto/appointment-response.dto';
import { AlertResponseDto } from '../../alerts/dto/alert-response.dto';
import { StudentActivityResponseDto } from '../../activities/dto/student-activity-response.dto';
import { AlertActionResponseDto } from '../../alerts/dto/alert-action-response.dto';

class DashboardStudentSummaryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ nullable: true })
  studentCode!: string | null;
}

export class PsychologistDashboardResponseDto {
  @ApiProperty({ type: [DashboardStudentSummaryDto] })
  assignedPatients!: DashboardStudentSummaryDto[];

  @ApiProperty({ type: [AppointmentResponseDto] })
  todayAppointments!: AppointmentResponseDto[];

  @ApiProperty({ type: [AppointmentResponseDto] })
  upcomingAppointments!: AppointmentResponseDto[];

  @ApiProperty({ type: [AlertResponseDto] })
  pendingAlerts!: AlertResponseDto[];

  @ApiProperty({ type: [AlertResponseDto] })
  priorityAlerts!: AlertResponseDto[];

  @ApiProperty({ type: [StudentActivityResponseDto] })
  pendingActivities!: StudentActivityResponseDto[];

  @ApiProperty({ type: [AlertActionResponseDto] })
  recentFollowUp!: AlertActionResponseDto[];
}
