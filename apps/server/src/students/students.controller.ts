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
  UnauthorizedException,
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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { StudentMeResponseDto } from './dto/student-me-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: 'Provision a new patient',
    description:
      "Admin-only. Creates the account in Supabase Auth (GoTrue) and its patient profile in one call, within the calling administrator's own institution. If assignedDoctorId is given, also creates the initial therapist assignment — all in one transaction.",
  })
  @ApiResponse({
    status: 201,
    description: 'Patient created.',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not an administrator.',
  })
  @ApiResponse({
    status: 409,
    description: 'The email address is already in use.',
  })
  @ApiResponse({
    status: 400,
    description:
      'assignedDoctorId does not exist, is not a psychologist, or belongs to a different institution.',
  })
  create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.studentsService.create(dto, currentUser?.institutionId ?? null);
  }

  @Get()
  @ApiOperation({
    summary: 'List patients',
    description:
      'Returns the patients visible to the caller — an assigned psychologist sees their own patients, an administrator sees their institution.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of patients.',
    type: [StudentResponseDto],
  })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.studentsService.findAll(skip, take);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.student)
  @ApiOperation({
    summary: 'Get current authenticated student profile and clinical context',
    description:
      'Student-only. Resolves caller to their student profile, assigned therapist, next appointment, and active treatment plan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current student profile and context.',
    type: StudentMeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Student profile not found for this user.',
  })
  getMe(@CurrentUser() currentUser?: RequestUser) {
    if (!currentUser?.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.studentsService.getMe(currentUser.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by id' })
  @ApiResponse({
    status: 200,
    description: 'Patient found.',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a patient',
    description:
      'Only studentCode/primaryDiagnosis. Reassigning the therapist goes through /therapist-assignments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Patient updated.',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist, or is not visible to the caller.',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }
}
