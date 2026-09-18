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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { CreateStudentActivityDto } from './dto/create-student-activity.dto';
import { UpdateStudentActivityDto } from './dto/update-student-activity.dto';
import { StudentActivityResponseDto } from './dto/student-activity-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('activities')
@ApiBearerAuth()
@Controller()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post('activities')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: 'Add an entry to the activity catalog',
    description: "Administrator-only, scoped to the caller's own institution.",
  })
  @ApiResponse({
    status: 201,
    description: 'Activity created.',
    type: ActivityResponseDto,
  })
  create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.activitiesService.create(dto, currentUser);
  }

  @Get('activities')
  @ApiOperation({
    summary: 'List the activity catalog',
    description:
      "Own institution's entries plus every global (institution-less) entry.",
  })
  @ApiResponse({
    status: 200,
    description: 'Activities.',
    type: [ActivityResponseDto],
  })
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.activitiesService.findAll(
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Get('activities/:id')
  @ApiOperation({ summary: 'Get a single activity' })
  @ApiResponse({
    status: 200,
    description: 'Activity.',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The activity does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.findOne(id);
  }

  @Patch('activities/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({ summary: 'Update a catalog entry' })
  @ApiResponse({
    status: 200,
    description: 'Activity updated.',
    type: ActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The activity does not exist, or is not visible to the caller.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, dto);
  }

  @Post('students/:studentId/activities')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: 'Assign an activity to a patient',
    description:
      "Only the patient's current assigned therapist (RLS). origin is always set to 'psychologist'.",
  })
  @ApiResponse({
    status: 201,
    description: 'Assignment created.',
    type: StudentActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The patient or the activity does not exist.',
  })
  assign(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateStudentActivityDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.activitiesService.assign(studentId, dto, currentUser);
  }

  @Get('students/:studentId/activities')
  @ApiOperation({ summary: "List a patient's assigned activities" })
  @ApiResponse({
    status: 200,
    description: 'Assignments, most recently assigned first.',
    type: [StudentActivityResponseDto],
  })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.activitiesService.findByStudent(
      studentId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Get('student-activities/:id')
  @ApiOperation({ summary: 'Get a single activity assignment' })
  @ApiResponse({
    status: 200,
    description: 'Assignment.',
    type: StudentActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The assignment does not exist, or is not visible to the caller.',
  })
  findOneAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.findOneAssignment(id);
  }

  @Patch('student-activities/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: 'Update an activity assignment',
    description:
      'status/response. completedAt is set automatically when status becomes completed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment updated.',
    type: StudentActivityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The assignment does not exist, or is not visible to the caller.',
  })
  updateAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentActivityDto,
  ) {
    return this.activitiesService.updateAssignment(id, dto);
  }
}
