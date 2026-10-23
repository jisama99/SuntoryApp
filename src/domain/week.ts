/**
 * Calendrier ISO 8601 en modules purs (lot A2a, règles W1 à W22 de docs/REGLES_SEMAINE_ET_DOUBLONS_V0.4.md).
 * Dates stockées en AAAA-MM-JJ, semaines stockées en AAAA-Snn avec l'année ISO (ex. 2026-S53, 2027-S01).
 * Tout le calcul se fait en UTC : aucune dépendance au fuseau du poste.
 */
export type IsoDate = string;
export interface IsoWeek {
  year: number;
  week: number;
}

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const STORED_WEEK = /^(\d{4})-S(\d{2})$/;

export function parseIsoDate(value: string): Date | null {
  const m = ISO_DATE.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  const ok = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
  return ok ? date : null;
}

export const isValidIsoDate = (value: string): boolean => parseIsoDate(value) !== null;

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

function mustParse(iso: IsoDate): Date {
  const d = parseIsoDate(iso);
  if (!d) throw new Error(`Date ISO invalide : ${iso}`);
  return d;
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  return toIsoDate(new Date(mustParse(iso).getTime() + n * DAY_MS));
}

/** Nombre de jours de `from` à `to` (positif si `to` est postérieure). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((mustParse(to).getTime() - mustParse(from).getTime()) / DAY_MS);
}

/** 1 = lundi … 7 = dimanche. */
export function weekdayOf(iso: IsoDate): number {
  const d = mustParse(iso).getUTCDay();
  return d === 0 ? 7 : d;
}

/** Semaine ISO 8601 d'une date : la semaine appartient à l'année de son jeudi. */
export function isoWeekOf(iso: IsoDate): IsoWeek {
  const d = mustParse(iso);
  const thursday = new Date(d.getTime() + (4 - weekdayOf(iso)) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  return { year, week: Math.floor((thursday.getTime() - jan1) / DAY_MS / 7) + 1 };
}

/** 52 ou 53 : le 28 décembre appartient toujours à la dernière semaine ISO de l'année. */
export function weeksInIsoYear(year: number): number {
  return isoWeekOf(`${String(year).padStart(4, '0')}-12-28`).week;
}

export const isValidWeek = (w: IsoWeek): boolean =>
  Number.isInteger(w.week) && w.week >= 1 && w.week <= weeksInIsoYear(w.year);

export function formatWeek(w: IsoWeek): string {
  return `${String(w.year).padStart(4, '0')}-S${String(w.week).padStart(2, '0')}`;
}

/** Lit un format stocké strict AAAA-Snn ; ne contrôle pas la plage (c'est le rôle de W1). */
export function parseStoredWeek(value: string): IsoWeek | null {
  const m = STORED_WEEK.exec(value);
  return m ? { year: Number(m[1]), week: Number(m[2]) } : null;
}

export const isStoredWeek = (value: string): boolean => STORED_WEEK.test(value);

export function weekStart(w: IsoWeek): IsoDate {
  const jan4 = `${String(w.year).padStart(4, '0')}-01-04`;
  const monday1 = addDays(jan4, -(weekdayOf(jan4) - 1));
  return addDays(monday1, (w.week - 1) * 7);
}

export const weekEnd = (w: IsoWeek): IsoDate => addDays(weekStart(w), 6);

export const storedWeekOf = (iso: IsoDate): string => formatWeek(isoWeekOf(iso));

/** Semaines ISO couvertes par une période, de la première à la dernière, triées. */
export function weeksBetween(start: IsoDate, end: IsoDate): string[] {
  if (end < start) return [];
  const out: string[] = [];
  let cursor = addDays(start, -(weekdayOf(start) - 1));
  while (cursor <= end) {
    out.push(storedWeekOf(cursor));
    cursor = addDays(cursor, 7);
  }
  return out;
}

export interface NormalizedWeek {
  week: IsoWeek | null;
  /** Vrai si l'entrée était déjà au format stocké AAAA-Snn. */
  canonical: boolean;
}

/**
 * W13 : normalise « S5 », « 5 », « 2026-S05 », « W05 », « 2026-W05 » ou un nombre vers une semaine ISO.
 * Sans année dans la saisie, `fallbackYear` s'applique. La plage (1 à 52 ou 53) n'est pas contrôlée ici : voir W1.
 */
export function normalizeWeekInput(raw: string | number, fallbackYear: number): NormalizedWeek {
  const text = String(raw).trim();
  if (isStoredWeek(text)) return { week: parseStoredWeek(text), canonical: true };
  const m = /^(?:(\d{4})\s*-?\s*)?[SsWw]?\s*(\d{1,2})$/.exec(text);
  if (!m) return { week: null, canonical: false };
  return { week: { year: m[1] ? Number(m[1]) : fallbackYear, week: Number(m[2]) }, canonical: false };
}

/**
 * W2 : numéro de semaine du calcul par défaut des tableurs (la semaine 1 contient le 1er janvier, semaines du
 * dimanche). Sert à reconnaître un numéro non ISO, décalé d'une semaine autour du 1er janvier.
 */
export function spreadsheetWeekNumber(iso: IsoDate): number {
  const year = mustParse(iso).getUTCFullYear();
  const jan1 = `${String(year).padStart(4, '0')}-01-01`;
  const offset = mustParse(jan1).getUTCDay();
  return Math.floor((daysBetween(jan1, iso) + offset) / 7) + 1;
}

export type DateInput =
  | { kind: 'iso'; date: IsoDate }
  | { kind: 'inverted_or_ambiguous' }
  | { kind: 'unrecognised' };

/**
 * W14 et W15 : lecture stricte d'une date reçue en texte (import, collage). Les saisies manuelles n'existent pas dans
 * l'interface (sélecteurs de date, D133) : ce contrôle protège les fichiers d'échange.
 */
export function parseDateInput(raw: string): DateInput {
  const text = raw.trim();
  const iso = parseIsoDate(text);
  if (iso) return { kind: 'iso', date: text };
  const m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(text);
  if (!m) return { kind: 'unrecognised' };
  const a = Number(m[1]);
  const b = Number(m[2]);
  const y = m[3] as string;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (a === b || (a > 12 && b <= 12)) {
    const date = `${y}-${pad(b)}-${pad(a)}`;
    return isValidIsoDate(date) ? { kind: 'iso', date } : { kind: 'unrecognised' };
  }
  if (a <= 12 && b <= 12) return { kind: 'inverted_or_ambiguous' };
  if (b > 12 && a <= 12) return { kind: 'inverted_or_ambiguous' };
  return { kind: 'unrecognised' };
}
