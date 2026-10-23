import type { DispositifParams } from '@/data/schemas';
import type { RuleConfig } from './rules';
import { DISPOSITIFS } from './types';
import type { Dispositif } from './types';
import type { ParamsMap } from './deadlines';

/**
 * Paramètres par dispositif (F-30.10, D128, D145). Le paramètre du dispositif l'emporte sur la valeur globale quand il
 * existe ; une valeur nulle laisse la valeur globale s'appliquer. Aucune valeur n'est écrite ici.
 */
export function paramsMapOf(list: readonly DispositifParams[]): ParamsMap {
  const out: ParamsMap = {};
  for (const p of list) out[p.dispositif] = p;
  return out;
}

/** Configuration de règles effective pour un dispositif : horizon (W11), jours non ouvrés (W16), jours proposés (J3). */
export function applyDispositifParams(base: RuleConfig, p: DispositifParams | undefined): RuleConfig {
  if (!p) return base;
  return {
    ...base,
    horizonWeeks: p.horizon_weeks ?? base.horizonWeeks,
    excludedWeekdays: p.non_working_days ? p.non_working_days.weekdays : base.excludedWeekdays,
    excludeHolidays: p.non_working_days ? p.non_working_days.holidays : base.excludeHolidays,
    daysAllowed: p.days_allowed ?? base.daysAllowed,
  };
}

/** Durée en minutes d'un créneau « HH:MM-HH:MM », ou null si le créneau ne se lit pas (la règle P1 se tait alors). */
export function slotMinutes(slot: string | null | undefined): number | null {
  if (!slot) return null;
  const m = /^\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*$/.exec(slot);
  if (!m) return null;
  const [h1, m1, h2, m2] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (h1 > 23 || h2 > 23 || m1 > 59 || m2 > 59) return null;
  const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  return minutes > 0 ? minutes : null;
}

export const isDispositif = (v: unknown): v is Dispositif => (DISPOSITIFS as readonly unknown[]).includes(v);
