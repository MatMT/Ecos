import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;

  /** URL/deep link the client app owns — where GoTrue sends the user after they click
   *  the recovery email link. Optional: falls back to GoTrue's configured SITE_URL. */
  @IsString()
  @IsOptional()
  redirectTo?: string;
}
