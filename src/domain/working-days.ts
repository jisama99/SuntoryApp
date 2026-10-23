import { holidayOf } from './holidays';
import type { HolidayKey } from './holidays';
import { addDays, weekdayOf } from './week';
import type { IsoDate } from './week';

/**
 * Jours ouvrés pour le calcul des échéances (D80, D82). Module pur, sans horloge : la date du jour est toujours passée
 * en argument. Ces jours ouvrés (lundi au vendredi hors fériés au départ) sont distincts des jours non ouvrés de
 * mission (W16, paramètre de dispositif) : ils servent à reculer ou compter les échéances de l'agence.
 */
export interface CalendarRules {
  /** 1 = lundi … 7 = dimanche. */
  nonWorkingWeekdays: readonly number[];
  excludeHolidays: boolean;
}

export type NonWorkingReason = { kind: 'weekday'; weekday: number } | { kind: 'holiday'; holiday: HolidayKey };

export function nonWorkingReason(date: IsoDate, cal: CalendarRules): NonWorkingReason | null {
  const weekday = weekdayOf(date);
  if (cal.nonWorkingWeekdays.includes(weekday)) return { kind: 'weekday', weekday };
  if (cal.excludeHolidays) {
    const holiday = holidayOf(date);
    if (holiday) return { kind: 'holiday', holiday };
  }
  return null;
}

export const isWorkingDay = (date: IsoDate, cal: CalendarRules): boolean => nonWorkingReason(date, cal) === null;

/** Recule à la veille ouvrée si la date n'est pas ouvrée (règle de D80 et D82). Inchangée sinon. */
export function previousWorkingDay(date: IsoDate, cal: CalendarRules): IsoDate {
  let d = date;
  for (let guard = 0; guard < 400 && !isWorkingDay(d, cal); guard++) d = addDays(d, -1);
  return d;
}

/** Le n-ième jour ouvré strictement avant `date` (n supérieur ou égal à 1). */
export function workingDaysBefore(date: IsoDate, n: number, cal: CalendarRules): IsoDate {
  let d = date;
  let left = n;
  for (let guard = 0; guard < 4000 && left > 0; guard++) {
    d = addDays(d, -1);
    if (isWorkingDay(d, cal)) left--;
  }
  return d;
}

/**
 * Nombre de jours ouvrés de `from` (exclu) à `to` (inclus). Nul si les dates sont égales, négatif si `to` précède `from`
 * (jours ouvrés écoulés depuis `to`).
 */
export function workingDaysBetween(from: IsoDate, to: IsoDate, cal: CalendarRules): number {
  if (from === to) return 0;
  const sign = to > from ? 1 : -1;
  const [lo, hi] = to > from ? [from, to] : [to, from];
  let n = 0;
  for (let d = addDays(lo, 1), guard = 0; d <= hi && guard < 4000; d = addDays(d, 1), guard++) {
    if (isWorkingDay(d, cal)) n++;
  }
  return sign * n;
}

// ---- Mois (AAAA-MM) ----
export const monthOf = (date: IsoDate): string => date.slice(0, 7);
export const monthStart = (month: string): IsoDate => `${month}-01`;

export function addMonths(month: string, n: number): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1 + n;
  const d = new Date(Date.UTC(y, m, 1));
  return d.toISOString().slice(0, 7);
}

export const monthEnd = (month: string): IsoDate => addDays(monthStart(addMonths(month, 1)), -1);
