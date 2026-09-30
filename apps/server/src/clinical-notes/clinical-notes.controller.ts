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
import { ClinicalNotesService } from './clinical-notes.service';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { CreateManualClinicalNoteDto } from './dto/create-manual-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';
import { VoidClinicalNoteDto } from './dto/void-clinical-note.dto';
import { ClinicalNoteResponseDto } from './dto/clinical-note-response.dto';
import { ClinicalNoteListQueryDto } from './dto/clinical-note-list-query.dto';
import { ClinicalNoteListResponseDto } from './dto/clinical-note-list-item-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('clinical-notes')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.psychologist)
@Controller()
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Post('clinical-notes')
  @ApiOperation({
    summary: 'Register a clinical note and complete its confirmed appointment',
    description:
      'The appointment must be confirmed and its own doctor must be the caller. The note and completion transition are persisted atomically. studentId/doctorId are derived from the appointment, never accepted directly.',
  })
  @ApiResponse({
    status: 201,
    description: 'Clinical note created.',
    type: ClinicalNoteResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'The appointment cannot receive a clinical note, or it already has one.',
  })
  @ApiResponse({
    status: 403,
    description: "The caller is not the appointment's doctor.",
  })
  @ApiResponse({ status: 404, description: 'The appointment does not exist.' })
  create(
    @Body() dto: CreateClinicalNoteDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.clinicalNotesService.create(dto, currentUser);
  }

  @Post('students/:studentId/clinical-notes')
  @ApiOperation({
    summary: 'Register a manual clinical session for a patient',
    description:
      "The patient and author are derived from the route and authenticated user. The caller must be the patient's current assigned psychologist.",
  })
  @ApiResponse({
    status: 201,
    description: 'Manual clinical session created.',
    type: ClinicalNoteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'The manual clinical session data is invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'The caller does not have clinical-session permissions.',
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist or is not visible to the caller.',
  })
  createManual(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateManualClinicalNoteDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.clinicalNotesService.createManual(studentId, dto, currentUser);
  }

  @Get('clinical-notes/:id')
  @ApiOperation({ summary: 'Get a single clinical note' })
  @ApiResponse({
    status: 200,
    description: 'Clinical note.',
    type: ClinicalNoteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The note does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clinicalNotesService.findOne(id);
  }

  @Get('students/:studentId/clinical-notes')
  @ApiOperation({ summary: "List a patient's clinical notes" })
  @ApiResponse({
    status: 200,
    description: 'Clinical notes, most recent first.',
    type: ClinicalNoteListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist or is not visible to the caller.',
  })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: ClinicalNoteListQueryDto,
  ) {
    return this.clinicalNotesService.findByStudent(studentId, query);
  }

  @Patch('clinical-notes/:id')
  @ApiOperation({
    summary: 'Update a clinical note',
    description: 'Original author only. Fails if the note has been voided.',
  })
  @ApiResponse({
    status: 200,
    description: 'Clinical note updated.',
    type: ClinicalNoteResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'The note has already been voided.',
  })
  @ApiResponse({
    status: 404,
    description: 'The note does not exist, or is not visible to the caller.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClinicalNoteDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.clinicalNotesService.update(id, dto, currentUser);
  }

  @Patch('clinical-notes/:id/void')
  @ApiOperation({
    summary: 'Void a clinical note',
    description:
      'Soft-delete: sets voidedAt/voidedById/voidReason. Original author only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Clinical note voided.',
    type: ClinicalNoteResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'The note has already been voided.',
  })
  @ApiResponse({
    status: 404,
    description: 'The note does not exist, or is not visible to the caller.',
  })
  void(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoidClinicalNoteDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.clinicalNotesService.void(id, dto, currentUser);
  }
}
