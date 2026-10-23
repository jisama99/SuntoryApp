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

export function toInput(v: NeedFormValue) {
  return {
    dispositif: v.dispositif || null,
    campaign_code: v.campaign_code || null,
    sector_id: v.sector_id,
    position_label: v.position_label.trim() || null,
    weekly_hours: v.weekly_hours ? Number(v.weekly_hours) : null,
    priority: v.priority ? Number(v.priority) : null,
    periods: v.periods
      .map((p, i) => ({ period_no: (i + 1) as 1 | 2, ...p }))
      .filter((p) => p.start_date || p.end_date || p.start_week || p.end_week),
    days: v.days,
    hours_slot: v.hours_slot.trim() || null,
    store_codes: v.store_codes,
    client_comment: v.client_comment.trim() || null,
  };
}

