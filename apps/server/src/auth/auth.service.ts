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
    return this.request<GoTrueSession>(
      'POST',
      '/token?grant_type=password',
      { email, password },
      UnauthorizedException,
      'Correo electrónico o contraseña incorrectos.',
    );
  }

  async refresh(refreshToken: string): Promise<GoTrueSession> {
    return this.request<GoTrueSession>(
      'POST',
      '/token?grant_type=refresh_token',
      { refresh_token: refreshToken },
      UnauthorizedException,
      'La sesión ha expirado. Por favor, inicie sesión nuevamente.',
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
    body: Record<string, unknown>,
    errorType: new (message: string) => Error,
    fallbackMessage: string,
    options?: { admin?: boolean },
  ): Promise<T> {
    const authUrl = this.configService.get<string>('supabase.authUrl');
    const anonKey = this.configService.get<string>('supabase.anonKey');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    const authorization = options?.admin ? serviceRoleKey : anonKey;

    let response: Response;
    try {
      response = await fetch(`${authUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey!,
          Authorization: `Bearer ${authorization}`,
        },
        body: JSON.stringify(body),
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

    return response.json() as Promise<T>;
  }
}
