import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  ANONYMOUS_CONTEXT,
  PostgresRole,
  RlsContext,
  rlsContextStorage,
} from '../common/context/rls-context';

const VALID_ROLES: readonly PostgresRole[] = [
  'anon',
  'authenticated',
  'service_role',
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    // Runtime connection: the `authenticator` role (not `postgres`), so Row Level
    // Security is actually enforced — see AGENTS.md and withRls() below.
    const pool = new Pool({
      connectionString: configService.get<string>('database.appUrl'),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Runs `fn` inside a transaction with the caller's identity applied to the Postgres
   * session (`request.jwt.claims` + `SET LOCAL ROLE`) — the same mechanism PostgREST uses
   * per-request, so RLS policies keyed on auth.uid()/auth.role() are genuinely enforced.
   *
   * Every query against an RLS-protected table MUST go through this. A bare
   * `this.prisma.user.findMany()` runs as `authenticator` with no role switched in and no
   * grants of its own — it will fail, not silently bypass RLS (see the `authenticator`
   * privileges checked during this session: NOLOGIN-adjacent NOBYPASSRLS, NOINHERIT).
   *
   * By default the identity comes from the current request's AsyncLocalStorage context
   * (set by RlsContextInterceptor). `overrideContext` exists only for the one call site
   * that runs *before* that context exists yet: JwtAuthGuard's own self-lookup of the
   * caller's profile row, needed to resolve their identity in the first place.
   */
  async withRls<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    overrideContext?: RlsContext,
  ): Promise<T> {
    const ctx =
      overrideContext ?? rlsContextStorage.getStore() ?? ANONYMOUS_CONTEXT;

    if (!VALID_ROLES.includes(ctx.role)) {
      throw new Error(`Rol de Postgres inválido: ${ctx.role as string}`);
    }

    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config(
        'request.jwt.claims',
        ${JSON.stringify({ sub: ctx.userId, role: ctx.role })},
        true
      )`;
      // Role name comes only from the fixed union validated above, never from raw input.
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${ctx.role}`);
      return fn(tx);
    });
  }
}
