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
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';
import { VoidClinicalNoteDto } from './dto/void-clinical-note.dto';
import { ClinicalNoteResponseDto } from './dto/clinical-note-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('clinical-notes')
@ApiBearerAuth()
@Controller()
export class ClinicalNotesController {
  constructor(private readonly clinicalNotesService: ClinicalNotesService) {}

  @Post('clinical-notes')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
  @ApiOperation({
    summary: 'Register a clinical note for a completed appointment',
    description:
      'The appointment must be completed and its own doctor must be the caller. studentId/doctorId are derived from the appointment, never accepted directly.',
  })
  @ApiResponse({
    status: 201,
    description: 'Clinical note created.',
    type: ClinicalNoteResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'The appointment is not completed.',
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
    type: [ClinicalNoteResponseDto],
  })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.clinicalNotesService.findByStudent(
      studentId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Patch('clinical-notes/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
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
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist)
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
