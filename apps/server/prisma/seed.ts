/**
 * One-time bootstrap for a fresh environment: the RLS insert policy on remote_users
 * requires an existing administrator (POST /users is admin-only), so the very first
 * administrator cannot be created through the API. This script creates it directly,
 * connecting as the postgres superuser (bypasses RLS) and calling GoTrue's Admin API
 * the same way AuthService.adminCreateUser does.
 *
 * Usage: npx ts-node prisma/seed.ts <email> <password> <fullName> <institutionId?>
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const [email, password, fullName, institutionIdRaw] = process.argv.slice(2);

  if (!email || !password || !fullName) {
    console.error('Usage: ts-node prisma/seed.ts <email> <password> <fullName> [institutionId]');
    process.exit(1);
  }

  const authUrl = process.env.SUPABASE_AUTH_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.SUPABASE_ANON_KEY!;

  const response = await fetch(`${authUrl}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!response.ok) {
    console.error('GoTrue admin/users failed:', response.status, await response.text());
    process.exit(1);
  }

  const goTrueUser = (await response.json()) as { id: string };

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const user = await prisma.user.create({
    data: {
      id: goTrueUser.id,
      email,
      fullName,
      role: 'administrator',
      institutionId: institutionIdRaw ? parseInt(institutionIdRaw, 10) : null,
    },
  });

  console.log('Bootstrap administrator created:', user);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
