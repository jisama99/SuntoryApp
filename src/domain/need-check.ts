import type { Need, NeedInput } from '@/data/schemas';
import { findDuplicates } from './duplicates';
import type { DupCandidate } from './duplicates';
import { applyGravities } from './rules';
import type { Finding } from './rules';
import { evaluateSingleNeedRules, resolvePeriod } from './week-rules';
import type { RuleEnv, RuleInput } from './week-rules';

export const MISSING_FIELDS = [
  'dispositif', 'campaign_code', 'position_label', 'weekly_hours', 'priority', 'period', 'days', 'hours_slot',
] as const;
export type MissingField = (typeof MISSING_FIELDS)[number];

/** Champs obligatoires du dictionnaire (DICTIONNAIRE_DONNEES.md §2) encore vides. Le nombre de magasins peut valoir 0. */
export function missingFields(input: NeedInput): MissingField[] {
  const out: MissingField[] = [];
  if (!input.dispositif) out.push('dispositif');
  if (!input.campaign_code) out.push('campaign_code');
  if (!input.position_label?.trim()) out.push('position_label');
  if (input.weekly_hours === null) out.push('weekly_hours');
  if (input.priority === null) out.push('priority');
  const periods = input.periods.map(resolvePeriod);
  if (!periods.some((p) => p.start && p.end)) out.push('period');
  if (input.days.length === 0) out.push('days');
  if (!input.hours_slot?.trim()) out.push('hours_slot');
  return out;
}

export interface NeedIdentity {
  id: string | null;
  need_code: string | null;
  source_record_id: string | null;
}

export interface NeedCheck {
  findings: Finding[];
  missing: MissingField[];
  /** Complet = aucun champ manquant et pas de W9. Un besoin incomplet ne se soumet pas. */
  complete: boolean;
}

export function checkNeed(input: RuleInput, env: RuleEnv, existing: Need[], identity: NeedIdentity): NeedCheck {
  const periods = input.periods.map(resolvePeriod);
  const candidate: DupCandidate = {
    ...identity,
    sector_id: input.sector_id,
    dispositif: input.dispositif,
    position_label: input.position_label,
    weekly_hours: input.weekly_hours,
    hours_slot: input.hours_slot,
    store_codes: input.store_codes,
    periods,
  };
  const raw = [...evaluateSingleNeedRules(input, env), ...findDuplicates(candidate, existing)];
  const findings = applyGravities(raw, env.config);
  const missing = missingFields(input);
  const complete = missing.length === 0 && !findings.some((f) => f.rule === 'W9');
  return { findings, missing, complete };
}

export type SaveDecision = 'refuse' | 'confirm' | 'draft' | 'submit';

/**
 * Politique d'enregistrement.
 * - un constat bloquant refuse l'écriture, sauf W9 qui renvoie en brouillon ;
 * - une alerte demande une confirmation explicite ;
 * - un besoin incomplet est un brouillon, exclu des totaux ; un besoin complet est soumis.
 */
export function decideSave(check: NeedCheck, confirmed: boolean): SaveDecision {
  if (check.findings.some((f) => f.gravity === 'blocking' && f.rule !== 'W9')) return 'refuse';
  if (!confirmed && check.findings.some((f) => f.gravity === 'alert')) return 'confirm';
  return check.complete ? 'submit' : 'draft';
}
