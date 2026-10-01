import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AlertStatus, Role } from '@prisma/client';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { ReviewAlertDto } from './dto/review-alert.dto';
import { CreateAlertActionDto } from './dto/create-alert-action.dto';
import { CloseAlertDto } from './dto/close-alert.dto';
import { AlertResponseDto } from './dto/alert-response.dto';
import { AlertActionResponseDto } from './dto/alert-action-response.dto';
import { PatientAlertListQueryDto } from './dto/patient-alert-list-query.dto';
import { PatientAlertListResponseDto } from './dto/patient-alert-list-response.dto';
import { AlertDetailResponseDto } from './dto/alert-detail-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

// No class-level @Roles guard: unlike clinical-records/notes, a student must still be able to
// read their own alerts (RLS's alerts_select preserves self-access) — only the three
// professional lifecycle actions below are role-guarded, matching the narrowed RLS write
// policies exactly (no administrator branch).
@ApiTags('alerts')
@ApiBearerAuth()
@Controller()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('alerts')
  @ApiOperation({
    summary: 'Trigger a new panic or anomaly alert',
    description:
      'Can be invoked by a student (panic button / edge anomaly) or clinical staff.',
  })
  @ApiResponse({
    status: 201,
    description: 'Alert created.',
    type: AlertResponseDto,
  })
  create(
    @Body() dto: CreateAlertDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.alertsService.create(dto, currentUser);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'List alerts' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiResponse({
    status: 200,
    description: 'Alerts, most recent first.',
    type: [AlertResponseDto],
  })
  findAll(
    @Query('studentId') studentId?: string,
    @Query('status') status?: AlertStatus,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.alertsService.findAll(
      {
        studentId: studentId ? Number(studentId) : undefined,
        status,
      },
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Get a single alert, with its logged actions' })
  @ApiResponse({
    status: 200,
    description: 'Alert.',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The alert does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertsService.findOne(id);
  }

  @Get('students/:studentId/alerts')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist, Role.student)
  @ApiOperation({
    summary: "List a patient's persisted alerts",
    description:
      'Returns a privacy-minimized, paginated alert history for the visible patient.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated alerts, newest first.',
    type: PatientAlertListResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'El usuario no tiene un rol autorizado para consultar alertas.',
  })
  @ApiResponse({
    status: 404,
    description: 'El paciente no existe o no se encuentra disponible para el usuario.',
  })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: PatientAlertListQueryDto,
  ) {
    return this.alertsService.findByStudent(studentId, query);
  }

  @Get('students/:studentId/alerts/:alertId')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: "Get a patient's alert detail",
    description:
      'Returns the authorized alert only when it belongs to the requested patient. Administrators do not have clinical-alert access.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de alerta disponible.',
    type: AlertDetailResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'El usuario no tiene permisos para consultar alertas clínicas.',
  })
  @ApiResponse({
    status: 404,
    description:
      'La alerta no existe, no pertenece al paciente o no se encuentra disponible para el usuario.',
  })
  findOneByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('alertId', ParseIntPipe) alertId: number,
  ) {
    return this.alertsService.findOneByStudent(studentId, alertId);
  }

  @Get('alerts/:id/actions')
  @ApiOperation({ summary: 'List the actions logged for an alert' })
  @ApiResponse({
    status: 200,
    description: 'Actions, oldest first.',
    type: [AlertActionResponseDto],
  })
  findActions(
    @Param('id', ParseIntPipe) id: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.alertsService.findActionsByAlert(
      id,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Patch('alerts/:id/review')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: 'Mark an alert as reviewed',
    description:
      "Only the patient's current assigned therapist (RLS). Logs an AlertAction(reviewed) and an ALERT_REVIEWED audit event.",
  })
  @ApiResponse({
    status: 200,
    description: 'Alert reviewed.',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'La alerta ya fue revisada o cambió de estado.',
  })
  @ApiResponse({
    status: 404,
    description: 'The alert does not exist, or is not visible to the caller.',
  })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewAlertDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.alertsService.review(id, dto, currentUser);
  }

  @Post('alerts/:id/actions')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: 'Log an action taken on an alert',
    description:
      'Requires the alert to already be reviewed. Moves status to in_follow_up if it was just reviewed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Action logged.',
    type: AlertActionResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'La alerta no puede cerrarse en su estado actual.',
  })
  @ApiResponse({
    status: 404,
    description: 'The alert does not exist, or is not visible to the caller.',
  })
  addAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAlertActionDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.alertsService.addAction(id, dto, currentUser);
  }

  @Patch('alerts/:id/close')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: 'Close an alert',
    description:
      'Requires the alert to already be reviewed. Logs an AlertAction(closed).',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert closed.',
    type: AlertResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'The alert has not been reviewed yet, or is already closed.',
  })
  @ApiResponse({
    status: 404,
    description: 'The alert does not exist, or is not visible to the caller.',
  })
  close(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseAlertDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.alertsService.close(id, dto, currentUser);
  }
}
