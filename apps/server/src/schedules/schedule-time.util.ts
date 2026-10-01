/**
 * `@db.Time(0)` columns have no distinct client type in Prisma — they always round-trip as a
 * JS Date anchored at 1970-01-01 UTC (verified empirically against this project's actual
 * adapter-pg setup). These helpers keep that anchoring detail contained to this module: DTOs
 * accept/return plain "HH:mm" strings.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Converts a validated "HH:mm" string into the UTC-anchored Date Prisma expects. */
export function timeStringToDate(time: string): Date {
  const match = TIME_PATTERN.exec(time);
  if (!match) {
    // DTOs validate this format via @Matches before it ever reaches here — this is a
    // programmer-error guard, not a user-facing case, same treatment as the role check in
    // PrismaService.withRls().
    throw new Error(`Invalid HH:mm time string: ${time}`);
  }
  const [, hours, minutes] = match;
  return new Date(Date.UTC(1970, 0, 1, Number(hours), Number(minutes), 0));
}

/** Converts a Prisma `@db.Time(0)` Date back into an "HH:mm" string. */
export function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
