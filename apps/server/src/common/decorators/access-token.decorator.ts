import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { extractBearerToken } from '../context/extract-bearer-token';

/**
 * The raw bearer token from the current request, already verified by JwtAuthGuard.
 * Needed only where we must call GoTrue *as the caller* (logout, self-service password
 * update) rather than as anon/service_role.
 */
export const AccessToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return extractBearerToken(request);
  },
);
