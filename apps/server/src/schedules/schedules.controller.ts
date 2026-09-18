import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { ScheduleExceptionResponseDto } from './dto/schedule-exception-response.dto';
import { AvailabilitySlotResponseDto } from './dto/availability-slot-response.dto';

// Not @Roles-guarded on any handler here: "self or the owning therapist's admin" doesn't map
// onto a role-membership check — RLS (self OR admin-of-institution) is the authorization
// layer for every route below, same as PsychologistsController's self-service endpoints.
@ApiTags('schedules')
@ApiBearerAuth()
@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('psychologists/:id/schedules')
  @ApiOperation({
    summary: 'Create a recurring availability block',
    description:
      'Self (the therapist) or an administrator of the same institution.',
  })
  @ApiResponse({
    status: 201,
    description: 'Block created.',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description:
      'RLS denied the write (not this therapist, or not an admin of their institution).',
  })
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(id, dto);
  }

  @Get('psychologists/:id/schedules')
  @ApiOperation({ summary: "List a therapist's recurring availability blocks" })
  @ApiResponse({
    status: 200,
    description: 'Blocks, ordered by day of week then start time.',
    type: [ScheduleResponseDto],
  })
  findAll(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulesService.findAllForTherapist(id);
  }

  @Patch('schedules/:id')
  @ApiOperation({ summary: 'Update a recurring availability block' })
  @ApiResponse({
    status: 200,
    description: 'Block updated.',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The block does not exist, or is not visible to the caller.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(id, dto);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Delete a recurring availability block' })
  @ApiResponse({
    status: 200,
    description: 'Block deleted.',
    type: ScheduleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The block does not exist, or is not visible to the caller.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }

  @Post('psychologists/:id/schedule-exceptions')
  @ApiOperation({
    summary: 'Register an absence or extraordinary availability window',
    description:
      'Self or an admin of the same institution. Omit startTime/endTime for a full-day block.',
  })
  @ApiResponse({
    status: 201,
    description: 'Exception created.',
    type: ScheduleExceptionResponseDto,
  })
  createException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateScheduleExceptionDto,
  ) {
    return this.schedulesService.createException(id, dto);
  }

  @Get('psychologists/:id/schedule-exceptions')
  @ApiOperation({ summary: "List a therapist's schedule exceptions" })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  @ApiResponse({
    status: 200,
    description: 'Exceptions, ordered by date.',
    type: [ScheduleExceptionResponseDto],
  })
  findExceptions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.schedulesService.findExceptionsForTherapist(id, from, to);
  }

  @Patch('schedule-exceptions/:id')
  @ApiOperation({ summary: 'Update a schedule exception' })
  @ApiResponse({
    status: 200,
    description: 'Exception updated.',
    type: ScheduleExceptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The exception does not exist, or is not visible to the caller.',
  })
  updateException(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleExceptionDto,
  ) {
    return this.schedulesService.updateException(id, dto);
  }

  @Delete('schedule-exceptions/:id')
  @ApiOperation({ summary: 'Delete a schedule exception' })
  @ApiResponse({
    status: 200,
    description: 'Exception deleted.',
    type: ScheduleExceptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The exception does not exist, or is not visible to the caller.',
  })
  removeException(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.removeException(id);
  }

  @Get('psychologists/:id/availability')
  @ApiOperation({
    summary: "Compute a therapist's available slots for a given date",
    description:
      "Applies the recurring schedule, subtracts exceptions and existing pending/confirmed appointments, and drops past slots for the current day — all in the institution's own timezone.",
  })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @ApiResponse({
    status: 200,
    description: 'Available slots, ascending.',
    type: [AvailabilitySlotResponseDto],
  })
  @ApiResponse({
    status: 404,
    description:
      'The therapist does not exist, or is not visible to the caller.',
  })
  getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
  ) {
    return this.schedulesService.getAvailability(id, date);
  }
}
