import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../decorators/current-user.decorator';

interface GoTrueJwtPayload {
  sub: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Se requiere un token de autenticación.');
    }

    let userId: string;
    try {
      const payload = this.jwtService.verify<GoTrueJwtPayload>(token);
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException(
        'El token de autenticación es inválido o ha expirado.',
      );
    }

    // Self-lookup, scoped explicitly (not via AsyncLocalStorage — the request-scoped RLS
    // context doesn't exist yet at the Guard stage; RlsContextInterceptor establishes it
    // right after this, from the RequestUser this call produces). The `remote_users_select`
    // policy always permits a caller to read their own row (`id = auth.uid()`).
    const profile = await this.prisma.withRls(
      (tx) => tx.user.findUnique({ where: { id: userId } }),
      { userId, role: 'authenticated' },
    );

    if (!profile) {
      throw new UnauthorizedException(
        'No existe un perfil ECOS para este usuario.',
      );
    }

    (request as Request & { user: RequestUser }).user = {
      id: profile.id,
      role: profile.role,
      institutionId: profile.institutionId,
    };

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
