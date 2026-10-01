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
import { StudentActivityResponseDto } from './dto/student-activity-response.dto';
import { ActivityCatalogListQueryDto } from './dto/activity-catalog-list-query.dto';
import { ActivityCatalogListResponseDto } from './dto/activity-catalog-list-response.dto';
import { PatientActivityAssignmentListQueryDto } from './dto/patient-activity-assignment-list-query.dto';
import { PatientActivityAssignmentListResponseDto } from './dto/patient-activity-assignment-list-response.dto';
import { PatientActivityAssignmentDetailResponseDto } from './dto/patient-activity-assignment-detail-response.dto';
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
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({
    summary: 'List the activity catalog',
    description:
      "Own institution's entries plus every global (institution-less) entry. Psychologists receive active entries only.",
  })
  @ApiResponse({
    status: 200,
    description: 'Activities.',
    type: ActivityCatalogListResponseDto,
  })
  findAll(
    @Query() query: ActivityCatalogListQueryDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.activitiesService.findAll(query, currentUser);
  }

  @Get('activities/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator, Role.psychologist)
  @ApiOperation({
    summary: 'Get a single activity',
    description: 'Psychologists can retrieve active entries only.',
  })
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
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.activitiesService.findOne(id, currentUser);
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
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.activitiesService.update(id, dto, currentUser);
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
    status: 400,
    description: 'The editable assignment payload is invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only psychologists can assign patient activities.',
  })
  @ApiResponse({
    status: 404,
    description: 'The patient or the activity does not exist.',
  })
  @ApiResponse({
    status: 409,
    description: 'The activity is inactive and cannot be assigned.',
  })
  assign(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateStudentActivityDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.activitiesService.assign(studentId, dto, currentUser);
  }

  @Get('students/:studentId/activities')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({ summary: "List a patient's assigned activities" })
  @ApiResponse({
    status: 200,
    description: 'Assignments, most recently assigned first.',
    type: PatientActivityAssignmentListResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller does not have patient-activity permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist or is not visible to the caller.',
  })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: PatientActivityAssignmentListQueryDto,
  ) {
    return this.activitiesService.findByStudent(studentId, query);
  }

  @Get('students/:studentId/activities/:assignmentId')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: "Get a patient's assigned activity detail",
    description:
      'Only the current assigned therapist can access the assignment through the patient-qualified route.',
  })
  @ApiResponse({
    status: 200,
    description: 'Read-only assignment detail and current catalog content.',
    type: PatientActivityAssignmentDetailResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only psychologists can access patient activity details.',
  })
  @ApiResponse({
    status: 404,
    description:
      'The patient or assignment does not exist, is not related, or is not visible to the caller.',
  })
  findOneByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.activitiesService.findOneByStudent(studentId, assignmentId);
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
}
