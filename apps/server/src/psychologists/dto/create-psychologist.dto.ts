import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePsychologistDto {
  @ApiProperty({
    description: 'Full legal name of the psychologist being provisioned.',
    example: 'Marta López',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    description:
      'Email address used to sign in. Must be unique within the institution.',
    example: 'marta.lopez@example.com',
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
    description: 'Professional license/registration number.',
    example: 'JVPP-2026-0451',
  })
  @IsString()
  @IsOptional()
  professionalLicense?: string;

  @ApiPropertyOptional({
    description: 'Clinical specialty.',
    example: 'Terapia cognitivo-conductual',
  })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Contact phone number.' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Default session duration, in minutes.',
    default: 60,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultSessionMinutes?: number;
}
