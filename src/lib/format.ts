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
