import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { AccessToken } from '../common/decorators/access-token.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // Not @Public() — requires a valid session, which is exactly what's being revoked.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@AccessToken() accessToken: string) {
    return this.authService.logout(accessToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.redirectTo);
  }

  // Not @Public(): works both for a normal logged-in user changing their own password,
  // and for a user who just followed a recovery-email link (that session's token is a
  // normal GoTrue JWT and passes through JwtAuthGuard the same way).
  @Post('update-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  updatePassword(
    @AccessToken() accessToken: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(accessToken, dto.password);
  }
}
