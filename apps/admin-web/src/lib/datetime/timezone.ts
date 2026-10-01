export function formatDateTimeInputValue(date: Date, timeZone: string): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(
    dateParts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function zonedDateTimeToIso(value: string, timeZone: string): string {
  const utcGuess = new Date(`${value}:00.000Z`);
  const initialOffset = getTimeZoneOffset(utcGuess, timeZone);
  const candidate = new Date(utcGuess.getTime() - initialOffset);
  const resolvedOffset = getTimeZoneOffset(candidate, timeZone);

  return new Date(utcGuess.getTime() - resolvedOffset).toISOString();
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const timeZoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!timeZoneName || timeZoneName === "GMT") {
    return 0;
  }

  const match = timeZoneName.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) {
    return 0;
  }

  const offset = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "+" ? offset * 60_000 : -offset * 60_000;
}
