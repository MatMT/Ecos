import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TherapistAssignmentsService } from './therapist-assignments.service';
import { CreateTherapistAssignmentDto } from './dto/create-therapist-assignment.dto';
import { EndTherapistAssignmentDto } from './dto/end-therapist-assignment.dto';
import { TherapistAssignmentResponseDto } from './dto/therapist-assignment-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('therapist-assignments')
@ApiBearerAuth()
@Controller()
export class TherapistAssignmentsController {
  constructor(
    private readonly therapistAssignmentsService: TherapistAssignmentsService,
  ) {}

  @Post('therapist-assignments')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: 'Assign a primary therapist to a patient',
    description:
      "Admin-only. Ends the patient's current active primary assignment (if any), creates the new one, and syncs StudentProfile.assignedDoctorId — one transaction.",
  })
  @ApiResponse({
    status: 201,
    description: 'Assignment created.',
    type: TherapistAssignmentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not an administrator.',
  })
  @ApiResponse({
    status: 400,
    description:
      'The therapist does not exist, is not a psychologist, or belongs to a different institution than the patient.',
  })
  create(
    @Body() dto: CreateTherapistAssignmentDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.therapistAssignmentsService.create(
      dto,
      currentUser?.id ?? null,
    );
  }

  @Get('students/:studentId/therapist-assignments')
  @ApiOperation({ summary: "List a patient's assignment history" })
  @ApiResponse({
    status: 200,
    description: 'Assignment history, most recent first.',
    type: [TherapistAssignmentResponseDto],
  })
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.therapistAssignmentsService.findByStudent(studentId);
  }

  @Get('psychologists/:id/assignments')
  @ApiOperation({ summary: "List a therapist's assignments" })
  @ApiResponse({
    status: 200,
    description: 'Assignments, most recent first.',
    type: [TherapistAssignmentResponseDto],
  })
  findByTherapist(@Param('id', ParseUUIDPipe) id: string) {
    return this.therapistAssignmentsService.findByTherapist(id);
  }

  @Patch('therapist-assignments/:id/end')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: 'End an assignment',
    description:
      'Admin-only. Sets endsAt and, if it was the active primary assignment, clears StudentProfile.assignedDoctorId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment ended.',
    type: TherapistAssignmentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not an administrator.',
  })
  @ApiResponse({
    status: 404,
    description:
      'The assignment does not exist, or is not visible to the caller.',
  })
  end(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndTherapistAssignmentDto,
  ) {
    return this.therapistAssignmentsService.endAssignment(id, dto);
  }

  @Patch('therapist-assignments/:id/set-primary')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: 'Re-designate an assignment as the primary one',
    description:
      "Admin-only. Ends the patient's current active primary assignment (if different) and reactivates this one, syncing StudentProfile.assignedDoctorId.",
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment set as primary.',
    type: TherapistAssignmentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not an administrator.',
  })
  @ApiResponse({
    status: 404,
    description:
      'The assignment does not exist, or is not visible to the caller.',
  })
  setPrimary(@Param('id', ParseIntPipe) id: number) {
    return this.therapistAssignmentsService.setPrimary(id);
  }
}
