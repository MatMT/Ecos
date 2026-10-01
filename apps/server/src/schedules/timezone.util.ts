import { DateTime } from 'luxon';

/** ISO weekday (1=Monday..7=Sunday) of `date` ("YYYY-MM-DD") as seen in `timezone`. */
export function dayOfWeekInTimezone(date: string, timezone: string): number {
  return DateTime.fromISO(date, { zone: timezone }).weekday;
}

/** Combines a calendar date + "HH:mm" wall-clock time in `timezone` into a UTC instant. */
export function combineDateAndTime(
  date: string,
  time: string,
  timezone: string,
): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const dt = DateTime.fromISO(date, { zone: timezone }).set({
    hour: hours,
    minute: minutes,
    second: 0,
    millisecond: 0,
  });
  return dt.toJSDate();
}

export function startOfDayInTimezone(date: string, timezone: string): Date {
  return DateTime.fromISO(date, { zone: timezone }).startOf('day').toJSDate();
}

export function endOfDayInTimezone(date: string, timezone: string): Date {
  return DateTime.fromISO(date, { zone: timezone })
    .plus({ days: 1 })
    .startOf('day')
    .toJSDate();
}

export function isBeforeToday(date: string, timezone: string): boolean {
  const today = DateTime.now().setZone(timezone).startOf('day');
  const target = DateTime.fromISO(date, { zone: timezone }).startOf('day');
  return target < today;
}

export function isToday(date: string, timezone: string): boolean {
  const today = DateTime.now().setZone(timezone).startOf('day');
  const target = DateTime.fromISO(date, { zone: timezone }).startOf('day');
  return target.equals(today);
}
