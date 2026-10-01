-- Postgres restriction: a value added via ALTER TYPE ... ADD VALUE cannot be referenced
-- (compared, cast, used in a WHERE) within the SAME transaction it was added in — it must
-- commit first. `prisma migrate deploy` runs each migration.sql file as its own transaction,
-- so this migration contains ONLY the enum additions and nothing that could reference them;
-- every later migration that uses 'rescheduled'/'no_show' runs as a separate, later
-- transaction once these are already committed.

ALTER TYPE "enum_appointment_status" ADD VALUE IF NOT EXISTS 'rescheduled';
ALTER TYPE "enum_appointment_status" ADD VALUE IF NOT EXISTS 'no_show';
