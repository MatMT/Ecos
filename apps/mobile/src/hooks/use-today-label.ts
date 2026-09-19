import { useMemo } from 'react';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/** Today's date, formatted in Spanish with a capitalized first letter (e.g. "Lunes, 13 de..."). */
export function useTodayLabel(): string {
  return useMemo(() => {
    const label = new Date().toLocaleDateString('es-ES', DATE_FORMAT_OPTIONS);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, []);
}
