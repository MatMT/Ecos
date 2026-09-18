import { ApiProperty } from '@nestjs/swagger';

export class AdministratorDashboardResponseDto {
  @ApiProperty()
  studentCount!: number;

  @ApiProperty()
  psychologistCount!: number;

  @ApiProperty()
  administratorCount!: number;

  @ApiProperty()
  activeAssignmentCount!: number;

  @ApiProperty()
  todayAppointmentCount!: number;

  @ApiProperty()
  boundBandDeviceCount!: number;
}
