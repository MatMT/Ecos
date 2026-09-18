import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SharedContentService } from './shared-content.service';
import { SharedPatientContentResponseDto } from './dto/shared-patient-content-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

// No @Roles guard: RLS already scopes correctly (self / the named therapist / the current
// assigned therapist). No write endpoints here — creating and revoking shared content is
// mobile's responsibility (technical-guide.en.md §7.11); the RLS write policies exist so the
// table is correct for whenever that ships, without this app exposing that surface.
@ApiTags('shared-content')
@ApiBearerAuth()
@Controller()
export class SharedContentController {
  constructor(private readonly sharedContentService: SharedContentService) {}

  @Get('students/:studentId/shared-content')
  @ApiOperation({
    summary: 'List content a patient has explicitly shared',
    description: 'Excludes revoked content.',
  })
  @ApiResponse({
    status: 200,
    description: 'Shared content, most recently shared first.',
    type: [SharedPatientContentResponseDto],
  })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.sharedContentService.findByStudent(
      studentId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Get('shared-content/:id')
  @ApiOperation({
    summary: 'Get a single piece of shared content',
    description: 'Logs a SHARED_CONTENT_VIEWED audit event.',
  })
  @ApiResponse({
    status: 200,
    description: 'Shared content.',
    type: SharedPatientContentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'The content does not exist, has been revoked, or is not visible to the caller.',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.sharedContentService.findOne(id, currentUser);
  }
}
