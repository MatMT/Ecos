import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GoTrueSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: { id: string; email?: string };
}

export interface GoTrueAdminUser {
  id: string;
  email?: string;
}

interface GoTrueErrorBody {
  msg?: string;
  error_description?: string;
  error?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async login(email: string, password: string): Promise<GoTrueSession> {
    const session = await this.request<GoTrueSession>(
      'POST',
      '/token?grant_type=password',
      { email, password },
      UnauthorizedException,
      'Correo electrónico o contraseña incorrectos.',
    );
    return this.toSession(session);
  }

  async refresh(refreshToken: string): Promise<GoTrueSession> {
    const session = await this.request<GoTrueSession>(
      'POST',
      '/token?grant_type=refresh_token',
      { refresh_token: refreshToken },
      UnauthorizedException,
      'La sesión ha expirado. Por favor, inicie sesión nuevamente.',
    );
    return this.toSession(session);
  }

  /**
   * GoTrue's actual /token response embeds far more than GoTrueSession declares
   * (app_metadata, user_metadata, identities, etc.) — narrow it to exactly the
   * documented AuthResponseDto shape instead of passing the upstream body straight
   * through to the client.
   */
  private toSession(raw: GoTrueSession): GoTrueSession {
    return {
      access_token: raw.access_token,
      refresh_token: raw.refresh_token,
      expires_in: raw.expires_in,
      token_type: raw.token_type,
      user: { id: raw.user.id, email: raw.user.email },
    };
  }

  /**
   * Revokes the caller's own session(s) — acts as the caller (their own access token),
   * never the anon/service_role key. `scope=global` revokes every refresh token for this
   * user (all devices/sessions), not just the current one.
   */
  async logout(accessToken: string): Promise<void> {
    await this.request<void>(
      'POST',
      '/logout?scope=global',
      undefined,
      UnauthorizedException,
      'No fue posible cerrar la sesión.',
      { bearerToken: accessToken },
    );
  }

  /**
   * Starts GoTrue's password-recovery email flow. Always resolves the same way whether
   * or not the email exists (GoTrue's own anti-enumeration behavior) — don't use this to
   * infer whether an account exists. `redirectTo` should be a URL/deep link the *client
   * app* owns and can handle; GoTrue redirects the user's browser there (with
   * access_token/refresh_token in the URL fragment) after they click the emailed link —
   * that whole exchange happens directly between the user's browser and GoTrue, never
   * through this server.
   */
  async forgotPassword(email: string, redirectTo?: string): Promise<void> {
    const query = redirectTo
      ? `?redirect_to=${encodeURIComponent(redirectTo)}`
      : '';
    await this.request<void>(
      'POST',
      `/recover${query}`,
      { email },
      BadRequestException,
      'No fue posible iniciar el proceso de recuperación de contraseña.',
    );
  }

  /**
   * Self-service password change — acts as the caller. Works equally for "I know my
   * current password and want to change it" (normal Bearer token) and "I clicked the
   * recovery email link and landed with a fresh session" (that session's token passes
   * through JwtAuthGuard exactly like any other valid GoTrue JWT).
   */
  async updatePassword(accessToken: string, password: string): Promise<void> {
    await this.request<void>(
      'PUT',
      '/user',
      { password },
      BadRequestException,
      'No fue posible actualizar la contraseña.',
      { bearerToken: accessToken },
    );
  }

  /**
   * Server-only: provisions a GoTrue user directly (pre-confirmed, no email flow), using
   * the service_role key. Never expose this key or this call path to clients.
   */
  async adminCreateUser(
    email: string,
    password: string,
  ): Promise<GoTrueAdminUser> {
    return this.request<GoTrueAdminUser>(
      'POST',
      '/admin/users',
      { email, password, email_confirm: true },
      BadRequestException,
      'No fue posible crear la cuenta. El correo electrónico podría ya estar en uso.',
      { admin: true },
    );
  }

  /** Server-only: changes a GoTrue user's password via the Admin API. */
  async adminUpdatePassword(userId: string, password: string): Promise<void> {
    await this.request<GoTrueAdminUser>(
      'PUT',
      `/admin/users/${userId}`,
      { password },
      BadRequestException,
      'No fue posible actualizar la contraseña del usuario.',
      { admin: true },
    );
  }

  private async request<T>(
    method: 'POST' | 'PUT',
    path: string,
    body: Record<string, unknown> | undefined,
    errorType: new (message: string) => Error,
    fallbackMessage: string,
    options?: { admin?: boolean; bearerToken?: string },
  ): Promise<T> {
    const authUrl = this.configService.get<string>('supabase.authUrl');
    const anonKey = this.configService.get<string>('supabase.anonKey');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    const authorization =
      options?.bearerToken ?? (options?.admin ? serviceRoleKey : anonKey);

    let response: Response;
    try {
      response = await fetch(`${authUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey!,
          Authorization: `Bearer ${authorization}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new InternalServerErrorException(
        'No fue posible contactar al servicio de autenticación.',
      );
    }

    if (!response.ok) {
      const errorBody = (await response
        .json()
        .catch(() => ({}))) as GoTrueErrorBody;
      const detail =
        errorBody.msg ?? errorBody.error_description ?? errorBody.error;
      throw new errorType(
        detail ? `${fallbackMessage} (${detail})` : fallbackMessage,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
