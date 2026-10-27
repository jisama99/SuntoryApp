import type { Delegation, Need, Recruitment, Zone } from '@/data/schemas';
import { lineage } from './access';
import type { DelegationStatus, EscalationReason, ProfileId, Scope, ValidationLevel, ValidationOutcome, ValidationState } from './types';
import type { IsoDate } from './week';

/**
 * Validation managériale du besoin (F-30.1, F-30.2) et délégations (F-30.3), lot A3c. Modules purs : aucune horloge, aucune lecture
 * de données. La chaîne suit la sectorisation (D45) : un besoin est rattaché à son secteur, donc à son CVR puis à son DR, jamais par
 * département. Le prestataire ne tranche pas les règles ouvertes : D43 (enveloppe) et D09 (suppléants, délais) restent ouvertes.
 */

// ---------------------------------------------------------------------------------------------
// Chaîne : CVR et DR d'un secteur.
// ---------------------------------------------------------------------------------------------
export const cvrZoneOf = (zones: Zone[], sectorId: string): Zone | null => lineage(zones, sectorId).find((z) => z.kind === 'cvr') ?? null;
export const drZoneOf = (zones: Zone[], sectorId: string): Zone | null => lineage(zones, sectorId).find((z) => z.kind === 'dr') ?? null;

// ---------------------------------------------------------------------------------------------
// Délégations : état, périmètre effectif, règles de création.
// ---------------------------------------------------------------------------------------------
type DelegationDates = Pick<Delegation, 'start_date' | 'end_date' | 'revoked_on'>;

/**
 * Révoquée avant tout : une délégation révoquée ne redevient jamais active, même si ses dates couvrent le jour courant. La date de
 * fin est incluse : le suppléant agit jusqu'au dernier jour.
 */
export function delegationStatus(d: DelegationDates, today: IsoDate): DelegationStatus {
  if (d.revoked_on) return 'revoked';
  if (today < d.start_date) return 'planned';
  if (today > d.end_date) return 'ended';
  return 'active';
}

export const isActive = (d: DelegationDates, today: IsoDate): boolean => delegationStatus(d, today) === 'active';

/** Délégations en cours dont le suppléant est dans le périmètre donné. */
export function activeFor(scope: Scope, delegations: readonly Delegation[], today: IsoDate): Delegation[] {
  if (scope.kind !== 'cvr' && scope.kind !== 'dr') return [];
  return delegations.filter((d) => isActive(d, today) && scope.ids.includes(d.substitute_zone_id));
}

/**
 * Périmètre effectif d'un suppléant : son périmètre propre, plus celui de chaque délégant en cours. Jamais davantage : pas de chaîne
 * (la délégation d'un délégant n'est pas transmise), pas d'autre zone. Hors délégation, le périmètre est inchangé.
 */
export function effectiveScope(scope: Scope, delegations: readonly Delegation[], today: IsoDate): Scope {
  const extra = activeFor(scope, delegations, today).map((d) => d.delegator_zone_id);
  if (extra.length === 0 || (scope.kind !== 'cvr' && scope.kind !== 'dr')) return scope;
  return { kind: scope.kind, ids: [...new Set([...scope.ids, ...extra])] };
}

export type DelegationRefusal = 'invalid' | 'same_zone' | 'kind_mismatch' | 'period' | 'overlap' | 'chain';

/**
 * Contrôles de création d'une délégation. Les deux zones sont du même niveau (CVR ou DR). Un seul suppléant à la fois par délégant
 * (hypothèse : chevauchement refusé). Pas de chaîne : un délégant ne peut être suppléant, ni un suppléant délégant, sur une période
 * qui se recoupe (le suppléant n'élargit jamais le périmètre au-delà de celui du délégant).
 */
export function delegationIssue(
  input: Pick<Delegation, 'delegator_zone_id' | 'substitute_zone_id' | 'start_date' | 'end_date'>,
  zones: Zone[],
  existing: readonly Delegation[],
  today: IsoDate,
): DelegationRefusal | null {
  const delegator = zones.find((z) => z.id === input.delegator_zone_id);
  const substitute = zones.find((z) => z.id === input.substitute_zone_id);
  if (!delegator || !substitute) return 'invalid';
  if (delegator.id === substitute.id) return 'same_zone';
  if (delegator.kind !== substitute.kind || (delegator.kind !== 'cvr' && delegator.kind !== 'dr')) return 'kind_mismatch';
  // Pas de délégation rétroactive : elle réécrirait des décisions déjà prises (aucun changement silencieux).
  if (input.end_date < input.start_date || input.start_date < today) return 'period';
  const live = existing.filter((d) => !d.revoked_on && d.end_date >= today);
  const overlaps = (d: Pick<Delegation, 'start_date' | 'end_date'>) => d.start_date <= input.end_date && input.start_date <= d.end_date;
  if (live.some((d) => d.delegator_zone_id === delegator.id && overlaps(d))) return 'overlap';
  if (live.some((d) => overlaps(d) && (d.delegator_zone_id === substitute.id || d.substitute_zone_id === delegator.id))) return 'chain';
  return null;
}

// ---------------------------------------------------------------------------------------------
// Autorité de validation.
// ---------------------------------------------------------------------------------------------
export interface Authority {
  level: Extract<ValidationLevel, 'cvr' | 'dr'>;
  /** Zone dont l'autorité s'exerce : le CVR ou le DR du besoin. */
  zoneId: string;
  /** Zone de la personne quand elle agit comme suppléant, sinon nul. */
  byZoneId: string | null;
  delegationId: string | null;
}

/**
 * Qui peut agir sur un besoin dans l'état donné, pour ce profil et ce périmètre.
 * - « à valider » : le CVR du besoin, ou son suppléant en cours de délégation.
 * - « escaladé » : le DR du besoin, ou son suppléant ; la direction cliente (périmètre complet) arbitre aussi.
 * Aucun autre état n'ouvre une action ; l'agence n'a aucune autorité de validation (elle qualifie ensuite).
 */
export function authorityFor(
  profile: ProfileId,
  scope: Scope,
  sectorId: string,
  state: ValidationState,
  zones: Zone[],
  delegations: readonly Delegation[],
  today: IsoDate,
): Authority | null {
  const wantLevel = state === 'to_validate' ? 'cvr' : state === 'escalated' ? 'dr' : null;
  if (!wantLevel) return null;
  const zone = wantLevel === 'cvr' ? cvrZoneOf(zones, sectorId) : drZoneOf(zones, sectorId);
  if (!zone) return null;
  if (wantLevel === 'dr' && profile === 'direction_client' && scope.kind === 'all') return { level: 'dr', zoneId: zone.id, byZoneId: null, delegationId: null };
  const own = wantLevel === 'cvr' ? 'cvr_client' : 'dr_client';
  if (profile !== own || scope.kind !== wantLevel) return null;
  if (scope.ids.includes(zone.id)) return { level: wantLevel, zoneId: zone.id, byZoneId: null, delegationId: null };
  const d = activeFor(scope, delegations, today).find((x) => x.delegator_zone_id === zone.id);
  const by = d ? scope.ids.find((id) => id === d.substitute_zone_id) : undefined;
  return d && by ? { level: wantLevel, zoneId: zone.id, byZoneId: by, delegationId: d.id } : null;
}

// ---------------------------------------------------------------------------------------------
// Transitions.
// ---------------------------------------------------------------------------------------------
export type ValidationRefusal = 'invalid' | 'motive_required' | 'invalid_reason' | 'invalid_other_zone';

export interface ValidationRequest {
  outcome: ValidationOutcome;
  motive?: string;
  reason?: EscalationReason;
  otherZoneId?: string;
}

/**
 * Contrôle de la demande avant écriture. Refuser et escalader exigent un motif (F-30.1). L'escalade n'existe qu'au niveau du CVR.
 * Un arbitrage entre CVR désigne l'autre CVR : il est sous le même DR que le CVR du besoin et n'est pas ce CVR.
 */
export function validationIssue(req: ValidationRequest, level: Authority['level'], need: Pick<Need, 'sector_id'>, zones: Zone[]): ValidationRefusal | null {
  const motive = (req.motive ?? '').trim();
  if (motive.length > 280) return 'invalid';
  if (!(['validate', 'refuse', 'escalate'] as const).includes(req.outcome)) return 'invalid';
  if (req.outcome === 'validate') return null;
  if (!motive) return 'motive_required';
  if (req.outcome === 'refuse') return null;
  if (level !== 'cvr') return 'invalid';
  if (!req.reason || !(['arbitration', 'out_of_perimeter', 'out_of_envelope'] as const).includes(req.reason)) return 'invalid_reason';
  if (req.reason !== 'arbitration') return req.otherZoneId ? 'invalid_other_zone' : null;
  const mine = cvrZoneOf(zones, need.sector_id);
  const dr = drZoneOf(zones, need.sector_id);
  const other = zones.find((z) => z.id === req.otherZoneId);
  if (!mine || !dr || !other || other.kind !== 'cvr' || other.id === mine.id || other.parent_id !== dr.id) return 'invalid_other_zone';
  return null;
}

/** Nouvelle soumission : seul un besoin refusé se soumet de nouveau, et rouvre un tour. */
export const canResubmit = (r: Pick<Recruitment, 'validation'>): boolean => r.validation === 'refused';

// ---------------------------------------------------------------------------------------------
// Point d'entrée « hors enveloppe » (D43 ouverte, règle branchée en A4b1).
// ---------------------------------------------------------------------------------------------
/** « non évalué » tant qu'aucune règle d'enveloppe n'est branchée : ce n'est ni « dans », ni « hors » l'enveloppe. */
export type EnvelopeStatus = 'not_evaluated' | 'within' | 'exceeded';
export type EnvelopeEvaluator = (need: Pick<Need, 'id' | 'sector_id' | 'weekly_hours'>) => EnvelopeStatus;

/** Aucune règle d'enveloppe n'est arrêtée (D43) : jamais de valeur inventée. A4b1 remplace cette fonction. */
export const NO_ENVELOPE_RULE: EnvelopeEvaluator = () => 'not_evaluated';
