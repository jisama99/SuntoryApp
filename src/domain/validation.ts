import type { Delegation, Validation, Zone } from '@/data/schemas';
import { lineage } from './access';
import type { NextStep, PipelineParams } from './pipeline';
import { addWorkingDays, urgencyOf } from './pipeline';
import type { DelegationStatus, Scope, ValidationState } from './types';
import { addDays, isValidIsoDate } from './week';
import type { IsoDate } from './week';
import type { CalendarRules } from './working-days';

/**
 * Validation managériale du besoin (F-30.1, F-30.2) et délégations (F-30.3). Modules purs : aucune horloge, aucune lecture
 * de données. La chaîne suit la sectorisation (D45) : un besoin relève du CVR parent de son secteur, puis du DR parent de
 * ce CVR. La validation est une dimension de plus : elle ne remplace ni la qualification de l'agence ni les statuts de A3.
 */

const lastOf = (records: readonly Validation[]): Validation | undefined => [...records].sort((a, b) => b.seq - a.seq)[0];

/** État déduit de la dernière trace. Sans trace, le besoin attend son CVR. */
export function validationState(records: readonly Validation[]): ValidationState {
  const last = lastOf(records);
  if (!last || last.outcome === 'resubmitted') return 'to_validate';
  if (last.outcome === 'escalated') return 'escalated';
  return last.outcome === 'validated' ? 'validated' : 'refused';
}

/** Date à partir de laquelle la validation attend : soumission, dernier renvoi ou dernière escalade. */
export function validationSince(records: readonly Validation[], submittedOn: IsoDate): IsoDate {
  const last = lastOf(records);
  return last && (last.outcome === 'resubmitted' || last.outcome === 'escalated') ? last.decided_on : submittedOn;
}

export const VALIDATION_ACTIONS = ['cvr_validate', 'cvr_refuse', 'cvr_escalate', 'dr_validate', 'dr_refuse', 'resubmit'] as const;
export type ValidationAction = (typeof VALIDATION_ACTIONS)[number];
export type ValidationRefusal = 'not_pending' | 'not_escalated' | 'not_refused';

/** Transitions autorisées : le CVR agit sur un besoin à valider, le DR sur un besoin escaladé, le renvoi suit un refus. */
export function validationTransition(state: ValidationState, action: ValidationAction): { ok: true } | { ok: false; reason: ValidationRefusal } {
  if (action === 'resubmit') return state === 'refused' ? { ok: true } : { ok: false, reason: 'not_refused' };
  if (action.startsWith('dr_')) return state === 'escalated' ? { ok: true } : { ok: false, reason: 'not_escalated' };
  return state === 'to_validate' ? { ok: true } : { ok: false, reason: 'not_pending' };
}

/**
 * Qui doit agir pendant la validation. Nul quand le besoin est validé (la qualification de l'agence prend le relais).
 * Le délai (jours ouvrés, paramétrable) est une valeur de départ à valider, au même titre que D199.
 */
export function nextValidationStep(state: ValidationState, since: IsoDate, today: IsoDate, params: PipelineParams, cal: CalendarRules): NextStep | null {
  const withDue = (actor: NextStep['actor'], action: NextStep['action'], due: IsoDate | null): NextStep => ({
    actor, action, due, ...(due ? urgencyOf(due, today, params, cal) : { urgency: null, lateDays: 0 }),
  });
  switch (state) {
    case 'to_validate': return withDue('cvr', 'validate_need', addWorkingDays(since, params.validation_due_days, cal));
    case 'escalated': return withDue('dr', 'arbitrate_need', addWorkingDays(since, params.validation_due_days, cal));
    case 'refused': return withDue('rs', 'resubmit_need', null);
    default: return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Délégations et suppléants.
// ---------------------------------------------------------------------------------------------
/** Hypothèse technique, pas un délai de réponse : une délégation ne se planifie pas à plus d'un an. */
export const DELEGATION_MAX_AHEAD_DAYS = 365;

export function delegationStatus(d: Delegation, today: IsoDate): DelegationStatus {
  // Arrêtée avant son début : annulée. Arrêtée un jour de couverture : terminée (la couverture s'arrête la veille de l'arrêt).
  if (d.stopped_on && d.stopped_on <= today) return d.stopped_on < d.starts_on ? 'cancelled' : 'ended';
  if (today < d.starts_on) return 'planned';
  return today > d.ends_on ? 'ended' : 'active';
}

export const activeDelegations = (ds: readonly Delegation[], today: IsoDate): Delegation[] => ds.filter((d) => delegationStatus(d, today) === 'active');

/**
 * Périmètre effectif d'un suppléant : le sien, plus la zone de l'absent, pendant la délégation seulement et à condition que
 * l'absent soit du même niveau. Un suppléant n'élargit jamais son périmètre au-delà de celui du délégant : la zone reçue est
 * exactement la zone de l'absent, et la suppléance ne se transmet pas (le suppléant d'un suppléant ne reçoit rien).
 */
export function effectiveScope(scope: Scope, delegations: readonly Delegation[], zones: readonly Zone[], today: IsoDate): Scope {
  if (scope.kind !== 'cvr' && scope.kind !== 'dr') return scope;
  const kind = scope.kind;
  const extra = activeDelegations(delegations, today)
    .filter((d) => scope.ids.includes(d.substitute_zone_id) && zones.find((z) => z.id === d.absent_zone_id)?.kind === kind)
    .map((d) => d.absent_zone_id)
    .filter((id) => !scope.ids.includes(id));
  return extra.length === 0 ? scope : { kind, ids: [...scope.ids, ...new Set(extra)] };
}

export type DelegationIssue = 'invalid_zone' | 'same_zone' | 'invalid_dates' | 'overlap' | 'chain';

export interface DelegationDraft {
  absentZoneId: string;
  substituteZoneId: string;
  startsOn: string;
  endsOn: string;
}

const overlaps = (aStart: IsoDate, aEnd: IsoDate, bStart: IsoDate, bEnd: IsoDate) => aStart <= bEnd && bStart <= aEnd;
/** Fin réelle d'une délégation arrêtée : la veille de l'arrêt (arrêtée le jour J, elle ne couvre plus J). */
const realEnd = (d: Delegation): IsoDate => (d.stopped_on && d.stopped_on <= d.ends_on ? addDays(d.stopped_on, -1) : d.ends_on);

/**
 * Contrôle d'une nouvelle délégation. Absent et suppléant sont des zones CVR ou DR de même niveau (hypothèse : le niveau
 * est identique, le DR de rattachement peut différer). Un seul suppléant à la fois par absent ; pas de chaîne (un suppléant
 * absent au même moment, ou un absent déjà suppléant, est refusé). Début au plus tôt aujourd'hui.
 */
export function delegationIssue(draft: DelegationDraft, existing: readonly Delegation[], zones: readonly Zone[], today: IsoDate): DelegationIssue | null {
  const absent = zones.find((z) => z.id === draft.absentZoneId);
  const substitute = zones.find((z) => z.id === draft.substituteZoneId);
  if (!absent || !substitute || (absent.kind !== 'cvr' && absent.kind !== 'dr') || substitute.kind !== absent.kind) return 'invalid_zone';
  if (absent.id === substitute.id) return 'same_zone';
  if (!isValidIsoDate(draft.startsOn) || !isValidIsoDate(draft.endsOn) || draft.startsOn < today || draft.endsOn < draft.startsOn || draft.endsOn > addDays(today, DELEGATION_MAX_AHEAD_DAYS)) {
    return 'invalid_dates';
  }
  const live = existing; // une délégation arrêtée garde une couverture vide ou raccourcie (realEnd)
  const clash = (d: Delegation) => overlaps(draft.startsOn, draft.endsOn, d.starts_on, realEnd(d));
  if (live.some((d) => d.absent_zone_id === absent.id && clash(d))) return 'overlap';
  if (live.some((d) => clash(d) && (d.absent_zone_id === substitute.id || d.substitute_zone_id === absent.id))) return 'chain';
  return null;
}

/** Zone du CVR de rattachement d'un secteur, puis du DR : la chaîne du besoin (D45). */
export function chainOf(zones: readonly Zone[], sectorId: string): { cvr: Zone | null; dr: Zone | null } {
  const chain = lineage(zones as Zone[], sectorId);
  return { cvr: chain.find((z) => z.kind === 'cvr') ?? null, dr: chain.find((z) => z.kind === 'dr') ?? null };
}
