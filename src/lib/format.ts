import type { Locale } from '@/domain/types';

// Format EN : Royaume-Uni (jj/mm/aaaa), hypothèse à confirmer (docs/GLOSSAIRE.md §4).
const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

/** Date stockée en ISO (AAAA-MM-JJ), affichée selon la langue. */
export function formatDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Semaine stockée « 2026-S53 », affichée « 2026-S53 » (FR) ou « 2026-W53 » (EN). Aucun calcul de semaine ici (lot A2a). */
export function formatIsoWeek(stored: string, locale: Locale): string {
  return locale === 'en' ? stored.replace('-S', '-W') : stored;
}

/** Tiret insécable (U+2011) : un code comme BES-DEMO-032 ne se coupe plus en fin de ligne. */
export const keepTogether = (code: string): string => code.replaceAll('-', '\u2011');

/** Mois stocké « 2026-11 », affiché « novembre 2026 » (FR) ou « November 2026 » (EN). */
export function formatMonth(month: string, locale: Locale): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
}

const MONTH_PARAM = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;
const STORED_WEEK_PARAM = /^\d{4}-S\d{2}$/;

/**
 * Prépare les paramètres d'un constat pour le message traduit : dates selon la langue (jj/mm/aaaa), semaines
 * (S en français, W en anglais), nom du jour pour le paramètre `weekday` (1 = lundi … 7 = dimanche).
 */
export function presentParams(params: Record<string, string | number>, locale: Locale): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === 'weekday' && typeof value === 'number') {
      out[key] = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'long', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2026, 10, 1 + value)),
      );
    } else if (typeof value === 'string' && ISO_DATE_PARAM.test(value)) out[key] = formatDate(value, locale);
    else if (typeof value === 'string' && STORED_WEEK_PARAM.test(value)) out[key] = formatIsoWeek(value, locale);
    else if (typeof value === 'string' && MONTH_PARAM.test(value)) out[key] = formatMonth(value, locale);
    else out[key] = value;
  }
  return out;
}
