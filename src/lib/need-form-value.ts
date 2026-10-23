import { rowToInput } from '@/domain/batch';

/** Valeurs du formulaire de saisie et conversions : module sans composant, importable côté serveur comme côté client. */
export interface PeriodValue {
  start_date: string | null;
  end_date: string | null;
  start_week: string | null;
  end_week: string | null;
}

export interface NeedFormValue {
  dispositif: string;
  campaign_code: string;
  sector_id: string;
  position_label: string;
  weekly_hours: string;
  priority: string;
  periods: PeriodValue[];
  days: number[];
  hours_slot: string;
  store_codes: string[];
  client_comment: string;
}

export const EMPTY_PERIOD: PeriodValue = { start_date: null, end_date: null, start_week: null, end_week: null };
export const HOURS = [3, 6, 7, 8, 10, 12, 14, 15, 16, 18, 20, 21, 25, 28, 30, 33, 35];

export function emptyNeedForm(sectorId: string): NeedFormValue {
  return {
    dispositif: '', campaign_code: '', sector_id: sectorId, position_label: '', weekly_hours: '', priority: '',
    periods: [EMPTY_PERIOD], days: [], hours_slot: '', store_codes: [], client_comment: '',
  };
}

/** Entrée des règles pour le formulaire unitaire : même conversion que la saisie en lot (src/domain/batch.ts). */
export function toInput(v: NeedFormValue) {
  return rowToInput(v);
}
