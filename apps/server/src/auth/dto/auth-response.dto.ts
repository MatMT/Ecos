import { ApiProperty } from '@nestjs/swagger';

/** Mirrors GoTrueSession (auth.service.ts) — the shape GoTrue itself returns. */
class AuthSessionUserDto {
  @ApiProperty({ description: 'Supabase Auth (GoTrue) user id.' })
  id!: string;

  @ApiProperty({ description: 'Email address.', required: false })
  email?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description:
      'JWT access token. Send it as `Authorization: Bearer <access_token>`.',
  })
  access_token!: string;

  @ApiProperty({
    description:
      'Opaque refresh token. Single-use — rotates on every call to /auth/refresh; the caller must persist the new one, discarding the old.',
  })
  refresh_token!: string;

  @ApiProperty({
    description: 'Access token lifetime, in seconds.',
    example: 3600,
  })
  expires_in!: number;

  @ApiProperty({ description: 'Token type.', example: 'bearer' })
  token_type!: string;

  @ApiProperty({ type: () => AuthSessionUserDto })
  user!: AuthSessionUserDto;
}
