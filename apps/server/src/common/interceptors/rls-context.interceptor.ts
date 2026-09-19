import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { rlsContextStorage } from '../context/rls-context';
import { RequestUser } from '../decorators/current-user.decorator';

/**
 * Promotes the identity JwtAuthGuard resolved (request.user) into AsyncLocalStorage, so every
 * PrismaService.withRls() call made downstream — in any service, for the rest of this
 * request — picks up the right Postgres session identity automatically. Global interceptor;
 * runs after guards, wrapping the controller/service execution itself.
 */
@Injectable()
export class RlsContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    return new Observable((subscriber) => {
      rlsContextStorage.run(
        user
          ? { userId: user.id, role: 'authenticated' }
          : { userId: null, role: 'anon' },
        () => {
          const subscription = next.handle().subscribe(subscriber);
          return () => subscription.unsubscribe();
        },
      );
    });
  }
}
