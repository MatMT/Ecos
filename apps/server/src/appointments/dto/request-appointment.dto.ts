import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';
import { APPOINTMENT_MODALITIES } from './create-appointment.dto';

export class RequestAppointmentDto {
  @ApiPropertyOptional({
    description:
      'Therapist (User) UUID. If omitted, uses student’s assigned therapist.',
  })
  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @ApiProperty({
    description: 'Requested date and time for the appointment (ISO 8601).',
    example: '2026-10-05T15:00:00.000Z',
  })
  @IsISO8601()
  appointmentDate!: string;

  @ApiProperty({
    enum: APPOINTMENT_MODALITIES,
    description: 'Modality: in_person or virtual.',
    example: 'in_person',
  })
  @IsIn(APPOINTMENT_MODALITIES)
  modality!: string;

  @ApiPropertyOptional({
    description: 'Brief reason or note for the appointment request.',
    example: 'Consulta sobre manejo de ansiedad ante evaluaciones.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
