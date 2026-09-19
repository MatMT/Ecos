import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the account requesting a password reset.',
    example: 'ana.martinez@example.com',
  })
  @IsEmail()
  email!: string;

  /** URL/deep link the client app owns — where GoTrue sends the user after they click
   *  the recovery email link. Optional: falls back to GoTrue's configured SITE_URL. */
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  redirectTo?: string;
}
