import 'dotenv/config';
import { Client } from 'pg';
import { execSync } from 'node:child_process';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log('Cleaning custom schemas (app_private)...');
  await client.query('DROP SCHEMA IF EXISTS app_private CASCADE;');
  await client.end();

  console.log('Executing prisma migrate reset...');
  execSync('prisma migrate reset', { stdio: 'inherit' });
}

main().catch((error) => {
  console.error('Database reset failed:', error);
  process.exit(1);
});
