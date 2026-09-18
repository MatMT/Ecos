import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
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
import { BiometricTrendPointDto } from './dto/biometric-trend-point.dto';

// No @Roles guard anywhere here: every route is a read scoped by the existing
// can_access_student_profile-based RLS on remote_band_devices/remote_biometric_records
// (self/assigned-doctor/admin), unchanged by this phase.
@ApiTags('biometrics')
@ApiBearerAuth()
@Controller()
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService) {}

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
  @ApiOperation({ summary: "List a patient's biometric readings" })
  @ApiQuery({ name: 'from', required: false, description: 'ISO 8601' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO 8601' })
  @ApiResponse({
    status: 200,
    description: 'Readings, most recent first.',
    type: [BiometricRecordResponseDto],
  })
  findRecords(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.biometricsService.findRecords(
      studentId,
      { from, to },
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
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
  findTrends(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.biometricsService.findTrends(studentId, { from, to });
  }
}
