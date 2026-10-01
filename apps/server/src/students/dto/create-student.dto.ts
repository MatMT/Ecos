import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({
    description: 'Full legal name of the patient being provisioned.',
    example: 'Ana Martínez',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    description:
      'Email address used to sign in. Must be unique within the institution.',
    example: 'ana.martinez@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Initial password for the account.',
    minLength: 6,
    example: 'Seed1234!',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    description: 'Institutional student code.',
    example: 'UDB-2026-001',
  })
  @IsString()
  @IsOptional()
  studentCode?: string;

  @ApiPropertyOptional({ description: 'Primary diagnosis, if any.' })
  @IsString()
  @IsOptional()
  primaryDiagnosis?: string;

  @ApiPropertyOptional({
    description:
      'Therapist (User) id to assign as primary on creation — must have role=psychologist, same institution. Optional: a patient can be created without one and assigned later.',
  })
  @IsUUID()
  @IsOptional()
  assignedDoctorId?: string;
}
