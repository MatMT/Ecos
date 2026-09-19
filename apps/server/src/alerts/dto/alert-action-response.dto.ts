import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlertActionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  alertId!: number;

  @ApiProperty()
  studentId!: number;

  @ApiProperty()
  therapistId!: string;

  @ApiProperty()
  actionType!: string;

  @ApiPropertyOptional({ nullable: true })
  comment!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
