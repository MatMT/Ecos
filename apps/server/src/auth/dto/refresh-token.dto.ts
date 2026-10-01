import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token issued by the last login or refresh call. Single-use — rotates on every call to /auth/refresh, and the new one must replace the old one client-side.',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
