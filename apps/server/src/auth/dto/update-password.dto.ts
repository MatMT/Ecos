import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description:
      'New password to set for the account. Valid both for a normal "change my password" call and for a session obtained from a recovery-email link.',
    minLength: 6,
    example: 'NewSeed1234!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
