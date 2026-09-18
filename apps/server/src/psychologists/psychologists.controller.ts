import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
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
import { Role } from '@prisma/client';
import { PsychologistsService } from './psychologists.service';
import { CreatePsychologistDto } from './dto/create-psychologist.dto';
import { UpdatePsychologistDto } from './dto/update-psychologist.dto';
import { PsychologistResponseDto } from './dto/psychologist-response.dto';
import { StudentResponseDto } from '../students/dto/student-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('psychologists')
@ApiBearerAuth()
@Controller('psychologists')
export class PsychologistsController {
  constructor(private readonly psychologistsService: PsychologistsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: 'Provision a new psychologist',
    description:
      "Admin-only. Creates the account in Supabase Auth (GoTrue) and its professional profile in one call, within the calling administrator's own institution.",
  })
  @ApiResponse({
    status: 201,
    description: 'Psychologist created.',
    type: PsychologistResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not an administrator.',
  })
  @ApiResponse({
    status: 409,
    description: 'The email address is already in use.',
  })
  create(
    @Body() dto: CreatePsychologistDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.psychologistsService.create(
      dto,
      currentUser?.institutionId ?? null,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List psychologists',
    description:
      'Returns the psychologists visible to the caller. RLS scopes the result — a non-admin only sees their own profile.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of psychologists.',
    type: [PsychologistResponseDto],
  })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.psychologistsService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Get a psychologist's profile by user id",
  })
  @ApiResponse({
    status: 200,
    description: 'Profile found.',
    type: PsychologistResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The profile does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.psychologistsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Update a psychologist's profile",
    description:
      'Any authenticated caller may attempt this, including changing `active` — but activating/deactivating is rejected for non-administrators at the database level.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated.',
    type: PsychologistResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'A non-administrator attempted to change `active`.',
  })
  @ApiResponse({
    status: 404,
    description: 'The profile does not exist, or is not visible to the caller.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePsychologistDto,
  ) {
    return this.psychologistsService.update(id, dto);
  }

  @Get(':id/students')
  @ApiOperation({
    summary: "List a psychologist's currently assigned patients",
    description:
      'Patients whose StudentProfile.assignedDoctorId currently points at this psychologist. RLS scopes the result.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned patients.',
    type: [StudentResponseDto],
  })
  findStudents(@Param('id', ParseUUIDPipe) id: string) {
    return this.psychologistsService.findStudents(id);
  }
}
