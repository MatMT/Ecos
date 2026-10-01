export interface AppConfig {
  port: number;
  corsAllowedOrigins: string[];
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

// Local dev ports for the browser-based apps in this monorepo (therapist-web, admin-web).
// Override/extend via CORS_ALLOWED_ORIGINS (comma-separated) once real deployment URLs exist.
const DEFAULT_CORS_ALLOWED_ORIGINS = [
  'http://localhost:9443',
  'http://localhost:9444',
];

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : DEFAULT_CORS_ALLOWED_ORIGINS,
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
