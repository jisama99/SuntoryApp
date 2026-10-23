import type { DeadlineSettings, DispositifParams, Reopening } from '@/data/schemas';
import type { ParamsMap } from '@/domain/deadlines';
import type { Dispositif } from '@/domain/types';
import type { A2bEnv } from '@/domain/a2b-env';

/** Réglages de test : presets de docs/COMPLEMENTS_CADRAGE/24 §3 (valeurs de départ, non figées). */
export function settings(over: Partial<DeadlineSettings> = {}): DeadlineSettings {
  return {
    default_preset: 'standard',
    presets: {
      large: { needs_entry: { unit: 'calendar', days: 15 }, change_request: { unit: 'calendar', days: 15 } },
      standard: { needs_entry: { unit: 'working', days: 10 }, change_request: { unit: 'working', days: 5 } },
      short: { needs_entry: { unit: 'working', days: 3 }, change_request: { unit: 'working', days: 3 } },
    },
    cascade: [5, 2, 0],
    non_working_weekdays: [6, 7],
    exclude_holidays: true,
    entries: [],
    is_demo: true,
    ...over,
  };
}

/** Paramètres de test : valeurs de départ du Workshop pour le second placement (doc 28 §2.2). */
export function params(dispositif: Dispositif, over: Partial<DispositifParams> = {}): DispositifParams {
  return {
    dispositif,
    min_minutes: null,
    km_flat_rate: { applicable: false, amount_eur_ht: null },
    entry_window: null,
    change_effect: null,
    change_lead_days: null,
    change_lead_unit: 'calendar',
    entry_roles: null,
    horizon_weeks: null,
    non_working_days: null,
    days_allowed: null,
    campaign_single_dispositif: true,
    is_demo: true,
    ...over,
  };
}

export const SECOND: Partial<DispositifParams> = {
  min_minutes: 45,
  km_flat_rate: { applicable: true, amount_eur_ht: 10 },
  entry_window: { reading: 'last_full_week' },
  change_effect: 'next_month',
  change_lead_days: 10,
  change_lead_unit: 'calendar',
};

export function paramsMap(...list: DispositifParams[]): ParamsMap {
  const out: ParamsMap = {};
  for (const p of list) out[p.dispositif] = p;
  return out;
}

export function reopening(over: Partial<Reopening> = {}): Reopening {
  return {
    id: '99999999-9999-4999-8999-999999999999',
    scope: 'month',
    target: '2026-11',
    zone_id: '11111111-1111-4111-8111-111111111111',
    reason: 'Motif de test',
    expires_on: '2026-11-06',
    decided_by: 'agency_admin',
    decided_on: '2026-10-23',
    request_id: null,
    is_demo: true,
    ...over,
  };
}

export function a2b(over: Partial<A2bEnv> = {}): A2bEnv {
  return {
    actor: 'rs',
    writeKind: 'entry',
    settings: settings(),
    params: paramsMap(params('permanent'), params('seasonal'), params('hourly_merch'), params('second_placement', SECOND)),
    reopenings: [],
    campaignDispositifs: { 'CMP-DEMO-01': ['permanent'], 'CMP-DEMO-04': ['second_placement'] },
    ...over,
  };
}
