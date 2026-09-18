import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Account email address.',
    example: 'ana.martinez@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password.',
    example: 'Seed1234!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
