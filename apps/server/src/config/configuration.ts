export interface AppConfig {
  port: number;
  database: {
    /** Prisma CLI only (migrate/generate) — postgres superuser, needs DDL + RLS bypass. */
    url: string;
    /** Runtime connection (PrismaService) — `authenticator` role, subject to RLS. */
    appUrl: string;
  };
  supabase: {
    authUrl: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL!,
    appUrl: process.env.APP_DATABASE_URL!,
  },
  supabase: {
    authUrl: process.env.SUPABASE_AUTH_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    jwtSecret: process.env.SUPABASE_JWT_SECRET!,
  },
});
