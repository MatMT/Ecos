import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full legal name of the user being provisioned.',
    example: 'Ana Martínez',
  })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({
    description:
      'Email address used to sign in. Must be unique within the institution.',
    example: 'ana.martinez@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Initial password for the account. The user can change it later via /auth/update-password.',
    minLength: 6,
    example: 'Seed1234!',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description:
      'Role assigned to the new user. Determines what the account can access.',
    enum: Role,
    example: Role.student,
  })
  @IsEnum(Role)
  role!: Role;
}
