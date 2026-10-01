import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BandDeviceResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  studentId!: number | null;

  @ApiPropertyOptional({ nullable: true })
  deviceCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bindingStatus!: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  lastSync!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
