import type { Locale } from '@/domain/types';

const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

/** Montant en centimes, affiché en euros selon la langue. Le signe moins reste devant (dépassement). */
export function formatMoney(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** Montant en euros (schéma), affiché de la même façon. */
export const formatEuros = (eur: number, locale: Locale): string => formatMoney(Math.round(eur * 100), locale);

/**
 * Lit un montant saisi (« 12 500,50 », « 12500.5 », « 1,200.75 ») : espaces et espaces insécables ignorés, virgule ou point comme
 * séparateur décimal, au plus deux décimales. Rend `null` pour tout texte qui n'est pas un montant : jamais 0 par défaut.
 */
export function parseMoneyInput(raw: string): number | null {
  const compact = raw.replace(/[\s  ]/g, '');
  if (!compact) return null;
  // « 12,345 » se lit 12,345 (trois décimales) ou 12 345 selon la langue : ambigu, donc refusé plutôt que deviné.
  if (/^\d+[.,]\d{3}$/.test(compact)) return null;
  // Séparateur de milliers (virgule ou point suivi de trois chiffres exactement et d'un autre séparateur) : on le retire.
  const decimal = compact.match(/^(\d+(?:[.,]\d{3})*)(?:[.,](\d{1,2}))?$/);
  if (!decimal) return null;
  const whole = (decimal[1] as string).replace(/[.,]/g, '');
  const value = Number(decimal[2] ? `${whole}.${decimal[2]}` : whole);
  return Number.isFinite(value) ? value : null;
}
