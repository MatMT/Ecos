import {
  Body,
  Controller,
  DefaultValuePipe,
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
import { AppointmentStatus, Role } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({
    summary: 'Create an appointment',
    description:
      "Validates the slot against the availability engine and persists it in one transaction. Not restricted to the patient's currently-assigned therapist — any psychologist in the same institution may hold a session.",
  })
  @ApiResponse({
    status: 201,
    description: 'Appointment created.',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is neither an administrator nor a psychologist.',
  })
  @ApiResponse({
    status: 400,
    description:
      'The doctor does not exist, is not a psychologist, or belongs to a different institution.',
  })
  @ApiResponse({
    status: 409,
    description: 'The requested slot is no longer available.',
  })
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.appointmentsService.create(dto, currentUser?.id ?? null);
  }

  @Get()
  @ApiOperation({
    summary: 'List appointments',
    description:
      'Filtered by patient, therapist, and/or status. RLS scopes the result.',
  })
  @ApiQuery({ name: 'studentId', required: false, type: Number })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of appointments.',
    type: [AppointmentResponseDto],
  })
  findAll(
    @Query(
      'studentId',
      new DefaultValuePipe(undefined),
      new ParseIntPipe({ optional: true }),
    )
    studentId: number | undefined,
    @Query('doctorId') doctorId: string | undefined,
    @Query('status') status: AppointmentStatus | undefined,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.appointmentsService.findAll(
      { studentId, doctorId, status },
      skip,
      take,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an appointment by id' })
  @ApiResponse({
    status: 200,
    description: 'Appointment found.',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The appointment does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({ summary: 'Confirm a pending appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment confirmed.',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'The appointment is not in a state that allows this transition.',
  })
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.confirm(id);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({ summary: 'Cancel an appointment, keeping the reason' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled.',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'The appointment is not in a state that allows this transition.',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(id, dto);
  }

  @Patch(':id/no-show')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({ summary: 'Mark a confirmed appointment as a no-show' })
  @ApiResponse({
    status: 200,
    description: 'Appointment marked as no-show.',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'The appointment is not in a state that allows this transition.',
  })
  noShow(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.noShow(id);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({ summary: 'Mark a confirmed appointment as completed' })
  @ApiResponse({
    status: 200,
    description: 'Appointment completed.',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'The appointment is not in a state that allows this transition.',
  })
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.complete(id);
  }

  @Patch(':id/reschedule')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({
    summary: 'Reschedule an appointment',
    description:
      'Validates the new slot, creates a new linked appointment (rescheduledFromId), and marks the original as rescheduled — one transaction.',
  })
  @ApiResponse({
    status: 200,
    description: 'The new appointment.',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'The appointment/slot is not available for this transition.',
  })
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(id, dto);
  }
}
