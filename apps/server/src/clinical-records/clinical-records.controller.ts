import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { ClinicalRecordsService } from './clinical-records.service';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';
import { ClinicalRecordResponseDto } from './dto/clinical-record-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('clinical-records')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.psychologist)
@Controller()
export class ClinicalRecordsController {
  constructor(
    private readonly clinicalRecordsService: ClinicalRecordsService,
  ) {}

  @Post('students/:studentId/clinical-record')
  @ApiOperation({
    summary: 'Open a clinical record for a patient',
    description:
      'Psychologist-only, and only for a patient the caller is assigned to (RLS). Create-only — fails if the patient already has a record.',
  })
  @ApiResponse({
    status: 201,
    description: 'Clinical record created.',
    type: ClinicalRecordResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'The patient already has a clinical record.',
  })
  @ApiResponse({ status: 404, description: 'The patient does not exist.' })
  create(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateClinicalRecordDto,
  ) {
    return this.clinicalRecordsService.create(studentId, dto);
  }

  @Get('students/:studentId/clinical-record')
  @ApiOperation({
    summary: "Get a patient's clinical record",
    description: "Visible only to the patient's current assigned therapist.",
  })
  @ApiResponse({
    status: 200,
    description: 'Clinical record.',
    type: ClinicalRecordResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'No clinical record exists, or it is not visible to the caller.',
  })
  findOne(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.clinicalRecordsService.findOne(studentId, currentUser);
  }

  @Patch('students/:studentId/clinical-record')
  @ApiOperation({ summary: "Update a patient's clinical record" })
  @ApiResponse({
    status: 200,
    description: 'Clinical record updated.',
    type: ClinicalRecordResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No clinical record exists yet.' })
  update(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: UpdateClinicalRecordDto,
  ) {
    return this.clinicalRecordsService.update(studentId, dto);
  }
}
