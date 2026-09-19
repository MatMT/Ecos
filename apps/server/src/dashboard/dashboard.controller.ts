import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { StudentOverviewResponseDto } from './dto/student-overview-response.dto';
import { TimelineItemDto } from './dto/timeline-item.dto';
import { PsychologistDashboardResponseDto } from './dto/psychologist-dashboard-response.dto';
import { AdministratorDashboardResponseDto } from './dto/administrator-dashboard-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('students/:studentId/overview')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: "Aggregated view for a patient's clinical header",
    description:
      "Only the patient's current assigned therapist (RLS). One round trip: next appointment, active treatment plan, latest biometrics, open alerts, pending activities, recent notes, recent shared content.",
  })
  @ApiResponse({
    status: 200,
    description: 'Overview.',
    type: StudentOverviewResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist, or is not visible to the caller.',
  })
  getOverview(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.dashboardService.getStudentOverview(studentId);
  }

  @Get('students/:studentId/timeline')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: "A patient's unified chronological event feed",
    description:
      'Merges appointments, clinical notes, alerts, activities, and shared content into one timeline, most recent first.',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline items, most recent first.',
    type: [TimelineItemDto],
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist, or is not visible to the caller.',
  })
  getTimeline(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('take') take?: string,
  ) {
    return this.dashboardService.getStudentTimeline(
      studentId,
      take ? Number(take) : undefined,
    );
  }

  @Get('dashboard/psychologist')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: "The caller's own caseload dashboard",
    description:
      "Assigned patients, today's and upcoming appointments, pending/priority alerts, pending activities, recent follow-up.",
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard.',
    type: PsychologistDashboardResponseDto,
  })
  getPsychologistDashboard(@CurrentUser() currentUser?: RequestUser) {
    return this.dashboardService.getPsychologistDashboard(currentUser);
  }

  @Get('dashboard/administrator')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: "The caller's institution operational metrics",
    description:
      'User/patient counts, active assignments, appointments today, bound band devices. No clinical detail.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard.',
    type: AdministratorDashboardResponseDto,
  })
  getAdministratorDashboard(@CurrentUser() currentUser?: RequestUser) {
    return this.dashboardService.getAdministratorDashboard(currentUser);
  }
}
