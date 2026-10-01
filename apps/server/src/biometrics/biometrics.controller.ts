import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { BiometricsService } from './biometrics.service';
import { BandDeviceResponseDto } from './dto/band-device-response.dto';
import { BiometricRecordResponseDto } from './dto/biometric-record-response.dto';
import { BiometricRecordListQueryDto } from './dto/biometric-record-list-query.dto';
import { BiometricRecordListResponseDto } from './dto/biometric-record-list-response.dto';
import { BiometricSummaryQueryDto } from './dto/biometric-summary-query.dto';
import { BiometricSummaryResponseDto } from './dto/biometric-summary-response.dto';
import { BiometricTrendPointDto } from './dto/biometric-trend-point.dto';
import { CreateBiometricSummaryDto } from './dto/create-biometric-summary.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('biometrics')
@ApiBearerAuth()
@Controller()
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService) {}

  @Post('biometrics/summary')
  @ApiOperation({
    summary: 'Ingest an aggregated biometric window from on-device Edge AI',
    description:
      'Saves aggregate average BPM, stress, and oxygen for the patient.',
  })
  @ApiResponse({
    status: 201,
    description: 'Biometric record created.',
    type: BiometricRecordResponseDto,
  })
  saveSummary(
    @Body() dto: CreateBiometricSummaryDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.biometricsService.saveSummary(dto, currentUser);
  }

  @Get('students/:studentId/bands')
  @ApiOperation({ summary: "List a patient's band devices" })
  @ApiResponse({
    status: 200,
    description: 'Band devices.',
    type: [BandDeviceResponseDto],
  })
  findBands(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.biometricsService.findBands(studentId);
  }

  @Get('students/:studentId/biometrics')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist, Role.student)
  @ApiOperation({
    summary: "List a patient's synchronized biometric records",
    description:
      'Returns a privacy-minimized, paginated history and a latest-record summary independent of pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated biometric records, ordered by record timestamp.',
    type: BiometricRecordListResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not a psychologist or student.',
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist or is not visible to the caller.',
  })
  findRecords(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: BiometricRecordListQueryDto,
  ) {
    return this.biometricsService.findRecords(studentId, query);
  }

  @Get('students/:studentId/biometrics/summary')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist, Role.student)
  @ApiOperation({
    summary: "Get a patient's descriptive biometric summary for a preset range",
    description:
      'Returns aggregated synchronized biometric data without exposing individual records outside the selected range.',
  })
  @ApiResponse({
    status: 200,
    description: 'Descriptive biometric summary and chronological series.',
    type: BiometricSummaryResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not a psychologist or student.',
  })
  @ApiResponse({
    status: 404,
    description: 'The patient does not exist or is not visible to the caller.',
  })
  findSummary(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: BiometricSummaryQueryDto,
  ) {
    return this.biometricsService.findSummary(studentId, query);
  }

  @Get('students/:studentId/biometrics/latest')
  @ApiOperation({ summary: "Get a patient's most recent biometric reading" })
  @ApiResponse({
    status: 200,
    description: 'Latest reading.',
    type: BiometricRecordResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No readings exist for this patient.',
  })
  findLatest(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.biometricsService.findLatest(studentId);
  }

  @Get('students/:studentId/biometrics/trends')
  @UseGuards(RolesGuard)
  @Roles(Role.psychologist, Role.student)
  @ApiOperation({
    summary: "Daily-bucketed trends for a patient's biometrics",
    description: 'Defaults to the last 30 days when from/to are omitted.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO 8601' })
  @ApiResponse({
    status: 200,
    description: 'Daily averages, ascending.',
    type: [BiometricTrendPointDto],
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not a psychologist or student.',
  })
  findTrends(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.biometricsService.findTrends(studentId, { from, to });
  }
}
