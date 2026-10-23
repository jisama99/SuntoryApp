import type { ParamKey } from '@/data/schemas';
import { addDays } from '@/domain/week';
import type { Locale } from '@/domain/types';

export type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Statut de chaque paramètre de dispositif tel que documenté au doc 28 §2.2 : les valeurs du Workshop sont des valeurs de
 * départ à valider, jamais des décisions. Q-J1 est validée (D132).
 */
export const PARAM_STATUS: Record<ParamKey, 'toValidate' | 'toUpdate' | 'partlyBlocking' | 'validated'> = {
  min_minutes: 'toValidate',
  km_flat_rate: 'toUpdate',
  entry_window: 'toValidate',
  change_effect: 'toValidate',
  change_lead_days: 'toValidate',
  change_lead_unit: 'toValidate',
  entry_roles: 'partlyBlocking',
  horizon_weeks: 'toValidate',
  non_working_days: 'toValidate',
  days_allowed: 'validated',
};

const INTL: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

export function weekdayNames(days: readonly number[], locale: Locale): string {
  const f = new Intl.DateTimeFormat(INTL[locale], { weekday: 'short', timeZone: 'UTC' });
  return days.map((d) => f.format(new Date(`${addDays('2026-11-01', d)}T00:00:00Z`))).join(', ');
}

/** Valeur d'un paramètre en texte (tableau des paramètres, historique). « Non renseigné » ou « Valeur globale », jamais 0. */
export function formatParamValue(key: ParamKey, value: unknown, t: Translate, locale: Locale): string {
  const v = value as never;
  switch (key) {
    case 'min_minutes':
      return v === null ? t('value.undefined') : t('value.minutes', { n: Number(v) });
    case 'km_flat_rate': {
      const k = value as { applicable: boolean; amount_eur_ht: number | null };
      if (!k.applicable) return t('value.notApplicable');
      return k.amount_eur_ht === null ? t('value.unpriced') : t('value.amountFictive', { amount: new Intl.NumberFormat(INTL[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(k.amount_eur_ht) });
    }
    case 'entry_window': {
      const w = value as { reading: string } | null;
      return w === null ? t('value.calendar') : t(`value.window.${w.reading}`);
    }
    case 'change_effect':
      return v === null ? t('value.calendar') : t('value.nextMonth');
    case 'change_lead_days':
      return v === null ? t('value.calendar') : t('value.days', { n: Number(v) });
    case 'change_lead_unit':
      return t(`value.unit.${String(v)}`);
    case 'entry_roles': {
      const r = value as string[] | null;
      return r === null ? t('value.allRoles') : r.map((x) => t(`roles.${x}`)).join(', ');
    }
    case 'horizon_weeks':
      return v === null ? t('value.global') : t('value.weeks', { n: Number(v) });
    case 'non_working_days': {
      const n = value as { weekdays: number[]; holidays: boolean } | null;
      if (n === null) return t('value.global');
      return [weekdayNames(n.weekdays, locale), n.holidays ? t('value.holidays') : ''].filter(Boolean).join(', ');
    }
    case 'days_allowed':
      return v === null ? t('value.global') : weekdayNames(value as number[], locale);
  }
}
