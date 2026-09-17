import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClinicalRecordResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  studentId!: number;

  @ApiProperty()
  openedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  initialReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  psychologicalHistory!: string | null;

  @ApiPropertyOptional({ nullable: true })
  psychiatricHistory!: string | null;

  @ApiPropertyOptional({ nullable: true })
  relevantFamilyHistory!: string | null;

  @ApiPropertyOptional({ nullable: true })
  previousTreatments!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentMedication!: string | null;

  @ApiPropertyOptional({ nullable: true })
  generalObservations!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
