import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { AccessToken } from '../common/decorators/access-token.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Log in',
    description: 'Public. Exchanges an email/password pair for a token pair.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Incorrect email or password.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh a session',
    description:
      'Public (the refresh token itself is the credential). Returns a new token pair — the refresh token rotates on every call, so the caller must persist the new one and discard the old.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session refreshed.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'The refresh token is invalid or expired.',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // Not @Public() — requires a valid session, which is exactly what's being revoked.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out',
    description:
      "Revokes every one of the caller's sessions (all devices), not just the current one.",
  })
  @ApiResponse({ status: 204, description: 'Session(s) revoked.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  logout(@AccessToken() accessToken: string) {
    return this.authService.logout(accessToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Start password recovery',
    description:
      'Public. Always returns 204, whether or not the email exists (anti-enumeration) — never build UI that infers account existence from this response. See docs/AUTH_INTEGRATION.md for the full redirect flow.',
  })
  @ApiResponse({
    status: 204,
    description: 'Recovery email sent, if the account exists.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.redirectTo);
  }

  // Not @Public(): works both for a normal logged-in user changing their own password,
  // and for a user who just followed a recovery-email link (that session's token is a
  // normal GoTrue JWT and passes through JwtAuthGuard the same way).
  @Post('update-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change the caller's password",
    description:
      'Works both for a normal "I know my current password" change and for a session obtained by following a recovery-email link.',
  })
  @ApiResponse({ status: 204, description: 'Password updated.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  updatePassword(
    @AccessToken() accessToken: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(accessToken, dto.password);
  }
}
