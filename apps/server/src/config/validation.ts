const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'APP_DATABASE_URL',
  'SUPABASE_AUTH_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
] as const;

/**
 * Fails fast at boot instead of at the first request that happens to touch a
 * missing variable. Passed to ConfigModule.forRoot({ validate }).
 */
export function validate(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_ENV_VARS.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan las siguientes variables de entorno requeridas: ${missing.join(', ')}`,
    );
  }

  return config;
}
