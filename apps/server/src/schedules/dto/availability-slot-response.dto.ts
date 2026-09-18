import { ApiProperty } from '@nestjs/swagger';

export class AvailabilitySlotResponseDto {
  @ApiProperty({ description: 'Slot start, as a UTC instant.' })
  start!: Date;

  @ApiProperty({ description: 'Slot end, as a UTC instant.' })
  end!: Date;
}
