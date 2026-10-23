import { addDays } from './week';
import type { IsoDate } from './week';

/**
 * Jours fériés légaux français (règle publique de calendrier, aucune donnée réelle du projet).
 * Module pur : la clé renvoyée est traduite dans messages/*.json (picker.holiday.*).
 */
export const HOLIDAY_KEYS = [
  'new_year',
  'easter_monday',
  'labour_day',
  'victory_1945',
  'ascension',
  'whit_monday',
  'bastille_day',
  'assumption',
  'all_saints',
  'armistice',
  'christmas',
] as const;
export type HolidayKey = (typeof HOLIDAY_KEYS)[number];

/** Dimanche de Pâques (algorithme grégorien anonyme). */
export function easterSunday(year: number): IsoDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const cache = new Map<number, Map<IsoDate, HolidayKey>>();

export function holidaysOfYear(year: number): Map<IsoDate, HolidayKey> {
  const hit = cache.get(year);
  if (hit) return hit;
  const easter = easterSunday(year);
  const y = String(year);
  const map = new Map<IsoDate, HolidayKey>([
    [`${y}-01-01`, 'new_year'],
    [addDays(easter, 1), 'easter_monday'],
    [`${y}-05-01`, 'labour_day'],
    [`${y}-05-08`, 'victory_1945'],
    [addDays(easter, 39), 'ascension'],
    [addDays(easter, 50), 'whit_monday'],
    [`${y}-07-14`, 'bastille_day'],
    [`${y}-08-15`, 'assumption'],
    [`${y}-11-01`, 'all_saints'],
    [`${y}-11-11`, 'armistice'],
    [`${y}-12-25`, 'christmas'],
  ]);
  cache.set(year, map);
  return map;
}

export function holidayOf(date: IsoDate): HolidayKey | null {
  return holidaysOfYear(Number(date.slice(0, 4))).get(date) ?? null;
}
