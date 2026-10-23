import type { Need, NeedInput, Period } from '@/data/schemas';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import type { RuleConfig } from '@/domain/rules';
import { storedWeekOf } from '@/domain/week';
import type { RuleEnv, RuleInput } from '@/domain/week-rules';

export const SECTOR_A = '11111111-1111-4111-8111-111111111111';
export const SECTOR_B = '22222222-2222-4222-8222-222222222222';
export const TODAY = '2026-10-23';

/** Période complète : les semaines sont déduites des dates. */
export const period = (no: 1 | 2, start: string, end: string): Period => ({
  period_no: no, start_date: start, end_date: end, start_week: storedWeekOf(start), end_week: storedWeekOf(end),
});

/** Période avec valeurs libres, pour provoquer un écart. */
export const rawPeriod = (no: 1 | 2, over: Partial<Period>): Period => ({
  period_no: no, start_date: null, end_date: null, start_week: null, end_week: null, ...over,
});

export function input(over: Partial<RuleInput> = {}): RuleInput {
  return {
    dispositif: 'permanent',
    campaign_code: 'CMP-DEMO-01',
    sector_id: SECTOR_A,
    position_label: 'Poste 1',
    weekly_hours: 20,
    priority: 1,
    periods: [period(1, '2026-11-02', '2026-11-08')],
    days: [1, 2, 3, 4, 5],
    hours_slot: '09:00-17:00',
    store_codes: [],
    client_comment: null,
    ...over,
  };
}

export function env(over: Partial<Omit<RuleEnv, 'config'>> & { config?: Partial<RuleConfig> } = {}): RuleEnv {
  const { config, ...rest } = over;
  return {
    today: TODAY,
    closedWeeks: new Set<string>(),
    campaign: null,
    ...rest,
    config: { ...DEFAULT_RULE_CONFIG, ...config },
  };
}

export function need(over: Partial<Need> = {}): Need {
  const base: NeedInput = input();
  return {
    ...base,
    id: crypto.randomUUID(),
    need_code: 'BES-DEMO-900',
    need_state: 'submitted',
    position_status: null,
    store_count: base.store_codes.length,
    entered_by_profile: 'rs',
    on_behalf: false,
    created_at: '2026-10-20',
    modified_at: '2026-10-20',
    record_version: 1,
    source_record_id: null,
    is_demo: true,
    ...over,
  };
}
