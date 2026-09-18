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
import { TreatmentPlansService } from './treatment-plans.service';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import { TreatmentPlanResponseDto } from './dto/treatment-plan-response.dto';
import { CreateTreatmentGoalDto } from './dto/create-treatment-goal.dto';
import { UpdateTreatmentGoalDto } from './dto/update-treatment-goal.dto';
import { TreatmentGoalResponseDto } from './dto/treatment-goal-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('treatment-plans')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.psychologist)
@Controller()
export class TreatmentPlansController {
  constructor(private readonly treatmentPlansService: TreatmentPlansService) {}

  @Post('treatment-plans')
  @ApiOperation({
    summary: 'Open a treatment plan for a patient',
    description: "Only the patient's current assigned therapist (RLS).",
  })
  @ApiResponse({
    status: 201,
    description: 'Plan created.',
    type: TreatmentPlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'The patient does not exist.' })
  create(
    @Body() dto: CreateTreatmentPlanDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.treatmentPlansService.create(dto, currentUser);
  }

  @Get('students/:studentId/treatment-plans')
  @ApiOperation({ summary: "List a patient's treatment plans" })
  @ApiResponse({
    status: 200,
    description: 'Plans, most recent first.',
    type: [TreatmentPlanResponseDto],
  })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.treatmentPlansService.findByStudent(
      studentId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Get('treatment-plans/:id')
  @ApiOperation({ summary: 'Get a single treatment plan' })
  @ApiResponse({
    status: 200,
    description: 'Plan.',
    type: TreatmentPlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The plan does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.treatmentPlansService.findOne(id);
  }

  @Patch('treatment-plans/:id')
  @ApiOperation({ summary: 'Update a treatment plan' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated.',
    type: TreatmentPlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The plan does not exist, or is not visible to the caller.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreatmentPlanDto,
  ) {
    return this.treatmentPlansService.update(id, dto);
  }

  @Patch('treatment-plans/:id/close')
  @ApiOperation({
    summary: 'Close a treatment plan',
    description: 'Sets status=closed and endsAt=now. Keeps history.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan closed.',
    type: TreatmentPlanResponseDto,
  })
  @ApiResponse({ status: 409, description: 'The plan is already closed.' })
  @ApiResponse({
    status: 404,
    description: 'The plan does not exist, or is not visible to the caller.',
  })
  close(@Param('id', ParseIntPipe) id: number) {
    return this.treatmentPlansService.close(id);
  }

  @Post('treatment-plans/:id/goals')
  @ApiOperation({ summary: 'Add a goal to a treatment plan' })
  @ApiResponse({
    status: 201,
    description: 'Goal created.',
    type: TreatmentGoalResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The plan does not exist, or is not visible to the caller.',
  })
  createGoal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTreatmentGoalDto,
  ) {
    return this.treatmentPlansService.createGoal(id, dto);
  }

  @Get('treatment-plans/:id/goals')
  @ApiOperation({ summary: "List a plan's goals" })
  @ApiResponse({
    status: 200,
    description: 'Goals, oldest first.',
    type: [TreatmentGoalResponseDto],
  })
  findGoals(
    @Param('id', ParseIntPipe) id: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.treatmentPlansService.findGoalsByPlan(
      id,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Patch('treatment-goals/:id')
  @ApiOperation({ summary: 'Update a treatment goal' })
  @ApiResponse({
    status: 200,
    description: 'Goal updated.',
    type: TreatmentGoalResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The goal does not exist, or is not visible to the caller.',
  })
  updateGoal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreatmentGoalDto,
  ) {
    return this.treatmentPlansService.updateGoal(id, dto);
  }
}
