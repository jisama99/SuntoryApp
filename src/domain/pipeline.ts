import type { Decision, Need, Note, Proposal, ProposalInput, Recruitment, Zone } from '@/data/schemas';
import type {
  Actor, DeviationKind, ExecutionStatus, FunnelState, NextAction, PositionStatus, Situation, Scope, Side, StartLagKind, Urgency,
} from './types';
import { START_LAG_KINDS } from './types';
import { addDays, daysBetween } from './week';
import type { IsoDate } from './week';
import { resolvePeriod } from './week-rules';
import { isWorkingDay, workingDaysBetween } from './working-days';
import type { CalendarRules } from './working-days';

/**
 * Circuit besoin, proposition, décision, recrutement (lot A3). Modules purs : aucune horloge, aucune lecture de données.
 * Les dimensions restent séparées (STATUTS_ET_ETATS.md) : l'entonnoir et le statut de poste se déduisent des jalons, des
 * propositions et des décisions, ils ne sont jamais saisis en un champ unique.
 */

/**
 * Délais cibles et seuils. Valeurs de départ À VALIDER (D93 : délais cibles à fixer) ; paramétrables, jamais figées.
 * Les jours sont des jours ouvrés du calendrier de l'agence.
 */
export interface PipelineParams {
  /** Délai de qualification d'un besoin soumis par l'agence. */
  qualify_due_days: number;
  /** Délai de proposition à compter de la soumission du besoin. */
  proposal_due_days: number;
  /** Délai de décision de la cliente à compter de l'envoi de la proposition. */
  decision_due_days: number;
  /** Une échéance dans ce nombre de jours ouvrés ou moins est « urgente ». */
  urgent_within_days: number;
  /** Une échéance dans ce nombre de jours ouvrés ou moins est « proche ». */
  soon_within_days: number;
  /** Effectif minimal pour conclure sur un délai (D93 : valeur proposée 5). */
  min_sample: number;
}

export const DEFAULT_PIPELINE_PARAMS: PipelineParams = {
  qualify_due_days: 2,
  proposal_due_days: 5,
  decision_due_days: 5,
  urgent_within_days: 2,
  soon_within_days: 5,
  min_sample: 5,
};

/** Le n-ième jour ouvré après `date` (n supérieur ou égal à 1). */
export function addWorkingDays(date: IsoDate, n: number, cal: CalendarRules): IsoDate {
  let d = date;
  let left = n;
  for (let guard = 0; guard < 4000 && left > 0; guard++) {
    d = addDays(d, 1);
    if (isWorkingDay(d, cal)) left--;
  }
  return d;
}

export const blankRecruitment = (needId: string): Recruitment => ({
  need_id: needId, intake: 'to_qualify', intake_motive: null, qualified_on: null, situation: 'new', reassigned_from_sector_id: null,
  white_zone_since: null, stopped: null, search_started_on: null, hired_on: null, training_on: null, start_work_date: null,
  vehicle_handover_date: null, refusal_count: 0, withdrawal_count: 0, exits: [], is_demo: true,
});

// ---------------------------------------------------------------------------------------------
// Proposition versionnée : éléments déterminants, écart au besoin, invalidation.
// ---------------------------------------------------------------------------------------------
type Determinants = Pick<ProposalInput, 'candidate_ref' | 'weekly_hours' | 'days' | 'hours_slot' | 'start_date' | 'end_date' | 'store_codes'>;

/** Éléments qui, s'ils changent, rendent caduque la décision prise sur la version précédente. */
export function determinantsOf(p: Determinants): string {
  return JSON.stringify({
    c: p.candidate_ref, h: p.weekly_hours, d: [...p.days].sort((a, b) => a - b), s: p.hours_slot ?? null, a: p.start_date, b: p.end_date,
    m: [...p.store_codes].sort(),
  });
}
export const sameDeterminants = (a: Determinants, b: Determinants): boolean => determinantsOf(a) === determinantsOf(b);

/** Début et fin du besoin sur l'ensemble de ses périodes (null si aucune période complète). */
export function needSpan(need: Pick<Need, 'periods'>): { start: IsoDate; end: IsoDate } | null {
  const starts: string[] = [];
  const ends: string[] = [];
  for (const p of need.periods.map(resolvePeriod)) {
    if (p.start && p.end) {
      starts.push(p.start);
      ends.push(p.end);
    }
  }
  if (starts.length === 0) return null;
  return { start: starts.reduce((m, d) => (d < m ? d : m)), end: ends.reduce((m, d) => (d > m ? d : m)) };
}

const sameSet = (a: readonly (string | number)[], b: readonly (string | number)[]) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

/** Écarts entre la proposition et le besoin. Une valeur du besoin absente n'est pas comparée. */
export function computeDeviations(need: Pick<Need, 'weekly_hours' | 'days' | 'hours_slot' | 'periods' | 'store_codes'>, p: Determinants): DeviationKind[] {
  const out: DeviationKind[] = [];
  if (need.weekly_hours !== null && need.weekly_hours !== p.weekly_hours) out.push('hours');
  if (need.days.length > 0 && !sameSet(need.days, p.days)) out.push('days');
  if (need.hours_slot !== null && need.hours_slot !== p.hours_slot) out.push('slot');
  const span = needSpan(need);
  if (span && (span.start !== p.start_date || span.end !== p.end_date)) out.push('period');
  if (need.store_codes.length > 0 && !sameSet(need.store_codes, p.store_codes)) out.push('stores');
  return out;
}

export type ProposalIssue = 'period_order' | 'deviation_unexplained' | 'no_change';

/** Contrôles d'une proposition à l'envoi : un écart au besoin se justifie, une nouvelle version change un élément déterminant. */
export function proposalIssues(
  need: Parameters<typeof computeDeviations>[0],
  input: Determinants & Pick<ProposalInput, 'deviation_note'>,
  latestSent: Pick<Proposal, 'candidate_ref' | 'weekly_hours' | 'days' | 'hours_slot' | 'start_date' | 'end_date' | 'store_codes'> | undefined,
): ProposalIssue[] {
  const issues: ProposalIssue[] = [];
  if (input.end_date < input.start_date) issues.push('period_order');
  if (computeDeviations(need, input).length > 0 && !(input.deviation_note ?? '').trim()) issues.push('deviation_unexplained');
  if (latestSent && sameDeterminants(latestSent, input)) issues.push('no_change');
  return issues;
}

/**
 * Vrai si le besoin a changé depuis la proposition (les écarts d'origine ne sont plus les écarts d'aujourd'hui).
 * Une décision prise sur cette proposition n'est plus fondée : elle est invalidée, jamais conservée en silence.
 */
export function needChangedSince(need: Parameters<typeof computeDeviations>[0], p: Proposal): boolean {
  return !sameSet(computeDeviations(need, p), p.deviations);
}

// ---------------------------------------------------------------------------------------------
// États déduits.
// ---------------------------------------------------------------------------------------------
export interface Facts {
  recruitment: Recruitment;
  proposals: readonly Proposal[];
  decisions: readonly Decision[];
}

/** Proposition en cours : la version la plus récente qui n'est ni retirée ni remplacée. */
export function activeProposal(proposals: readonly Proposal[]): Proposal | null {
  return [...proposals].filter((p) => p.status === 'in_progress' || p.status === 'proposed').sort((a, b) => b.version - a.version)[0] ?? null;
}
export const sentProposal = (proposals: readonly Proposal[]): Proposal | null =>
  [...proposals].filter((p) => p.status === 'proposed').sort((a, b) => b.version - a.version)[0] ?? null;

export const validDecisionOn = (proposalId: string, decisions: readonly Decision[]): Decision | null =>
  decisions.find((d) => d.proposal_id === proposalId && d.status === 'valid') ?? null;

/** Besoin sorti du circuit : rejeté à la qualification ou stoppé (motif obligatoire, D85). */
export const isClosed = (r: Recruitment): boolean => r.intake === 'rejected' || r.stopped !== null;

/** Entonnoir D92. Nul tant que le besoin n'est pas pris en charge, ou s'il est sorti du circuit. */
export function funnelState(f: Facts, today: IsoDate): FunnelState | null {
  const r = f.recruitment;
  if (r.intake !== 'taken' || isClosed(r)) return null;
  // Un poste déjà occupé le reste (la date de prise de poste est atteinte). Avant, « Recrutement finalisé » exige l'accord en
  // vigueur : un accord invalidé (EV-12) ramène à « Proposé » sans effacer la date de recrutement ni la décision.
  if (r.hired_on && r.start_work_date && r.start_work_date <= today) return 'started';
  const sent = sentProposal(f.proposals);
  const decision = sent ? validDecisionOn(sent.id, f.decisions) : null;
  if (decision?.outcome === 'approved') return r.hired_on ? 'hired' : 'approved';
  // Proposé : décision attendue, ou révision demandée. Un refus ramène à « En recrutement » (D97).
  if (sent && (!decision || decision.outcome === 'revision')) return 'proposed';
  return r.search_started_on || r.refusal_count > 0 ? 'recruiting' : 'to_recruit';
}

/**
 * Statut de poste (neuf valeurs, D54), calculé. « En poste » exige une date de prise de poste atteinte ; un recrutement
 * finalisé sans prise de poste reste « Validé ». Après un désistement ou une rupture, le statut le dit jusqu'à la reprise.
 */
export function positionStatus(f: Facts, today: IsoDate): PositionStatus | null {
  const r = f.recruitment;
  if (r.intake === 'rejected' || r.stopped) return 'cancelled';
  if (r.intake !== 'taken') return null;
  const exit = r.exits[r.exits.length - 1];
  const funnel = funnelState(f, today);
  // Après un désistement ou une rupture, le poste le dit tant qu'aucune nouvelle proposition n'a été envoyée (retour à « En recrutement », D97).
  if (exit && (funnel === 'recruiting' || funnel === 'to_recruit')) return exit.kind === 'withdrawal' ? 'withdrawal' : 'termination';
  const sent = sentProposal(f.proposals);
  const decision = sent ? validDecisionOn(sent.id, f.decisions) : null;
  switch (funnel) {
    case 'started': return 'filled';
    case 'hired': case 'approved': return 'approved';
    case 'proposed': return 'proposed';
    case 'recruiting': return decision?.outcome === 'refused' ? 'refused' : 'recruiting';
    case 'to_recruit': return 'to_recruit';
    default: return null;
  }
}

/** Facturable à partir de la date de prise de poste seulement (S6, règle validée le 23/10/2026). Colonne « facturé ? » à confirmer avec la cliente. */
export const billableFrom = (r: Recruitment): IsoDate | null => (r.hired_on && r.start_work_date ? r.start_work_date : null);

// ---------------------------------------------------------------------------------------------
// Qui doit agir, échéance, urgence.
// ---------------------------------------------------------------------------------------------
export interface NextStep {
  actor: Actor;
  action: NextAction;
  due: IsoDate | null;
  urgency: Urgency | null;
  /** Jours ouvrés de retard (positif) quand l'échéance est dépassée. */
  lateDays: number;
}

export function urgencyOf(due: IsoDate, today: IsoDate, params: PipelineParams, cal: CalendarRules): { urgency: Urgency; lateDays: number } {
  if (due < today) return { urgency: 'overdue', lateDays: -workingDaysBetween(today, due, cal) };
  const left = workingDaysBetween(today, due, cal);
  return { urgency: left <= params.urgent_within_days ? 'urgent' : left <= params.soon_within_days ? 'soon' : 'normal', lateDays: 0 };
}

export function nextStep(
  i: Facts & { needState: Need['need_state']; submittedOn: IsoDate; requestedStart: IsoDate | null; needChanged?: boolean },
  today: IsoDate,
  params: PipelineParams,
  cal: CalendarRules,
): NextStep {
  const withDue = (actor: Actor, action: NextAction, due: IsoDate | null): NextStep => ({
    actor, action, due, ...(due ? urgencyOf(due, today, params, cal) : { urgency: null, lateDays: 0 }),
  });
  const r = i.recruitment;
  if (i.needState === 'draft') return withDue('rs', 'complete_need', null);
  if (r.intake === 'rejected' || r.stopped) return withDue('none', 'none', null);
  if (r.intake === 'to_qualify') return withDue('agency', 'qualify', addWorkingDays(i.submittedOn, params.qualify_due_days, cal));
  if (r.intake === 'clarification') return withDue('rs', 'clarify', null);

  const proposalDue = addWorkingDays(i.submittedOn, params.proposal_due_days, cal);
  const sent = sentProposal(i.proposals);
  const active = activeProposal(i.proposals);
  const decision = sent ? validDecisionOn(sent.id, i.decisions) : null;
  if (r.hired_on && r.start_work_date && r.start_work_date <= today) {
    // D212 : poste occupé, « En poste » est maintenu. Tant que l'accord n'est pas rétabli (besoin modifié, accord invalidé),
    // l'agence renvoie la proposition pour confirmation ; une version envoyée sans décision attend la cliente.
    if (!i.needChanged && sent && !decision) return withDue('decider', 'decide', sent.sent_on ? addWorkingDays(sent.sent_on, params.decision_due_days, cal) : null);
    if (!i.needChanged && decision?.outcome === 'approved') return withDue('none', 'none', null);
    const lost = i.decisions.filter((d) => d.status === 'invalidated' && d.invalidated_on).map((d) => d.invalidated_on as IsoDate).sort().pop();
    return withDue('agency', 'reconfirm_proposal', addWorkingDays(lost ?? i.submittedOn, params.proposal_due_days, cal));
  }
  if (decision?.outcome === 'approved') {
    return r.hired_on ? withDue('agency', 'start_work', r.start_work_date ?? i.requestedStart) : withDue('agency', 'finalise_hiring', null);
  }
  if (sent && !decision) return withDue('decider', 'decide', sent.sent_on ? addWorkingDays(sent.sent_on, params.decision_due_days, cal) : null);
  if (sent && decision?.outcome === 'revision') return withDue('agency', 'revise_proposal', proposalDue);
  if (active?.status === 'in_progress') return withDue('agency', 'send_proposal', proposalDue);
  if (decision?.outcome === 'refused') return withDue('agency', 'new_proposal', proposalDue);
  return withDue('agency', 'prepare_proposal', proposalDue);
}

/**
 * Statut d'exécution : où en est la prise de poste, indépendamment du statut de poste calculé (qui mêle accord et recrutement).
 * « Poste terminé » : besoin stoppé après la prise de poste, ou rupture sans nouvelle prise de poste.
 */
export function executionStatus(f: Facts, today: IsoDate): ExecutionStatus | null {
  const r = f.recruitment;
  if (r.intake !== 'taken') return null;
  if (r.stopped && r.hired_on && r.start_work_date && r.start_work_date <= r.stopped.on) return 'ended';
  const last = r.exits[r.exits.length - 1];
  if (last?.kind === 'termination' && !r.hired_on) return 'ended';
  if (r.hired_on && r.start_work_date) return r.start_work_date <= today ? 'in_post' : 'start_planned';
  return 'not_started';
}

// ---------------------------------------------------------------------------------------------
// Délais par situation (D87, D93) : médiane, étendue, effectif, jamais une moyenne unique.
// ---------------------------------------------------------------------------------------------
export const MILESTONES = ['j1', 'j2', 'j3', 'j4'] as const;
export type Milestone = (typeof MILESTONES)[number];
export type DelaySample = { situation: Situation } & Record<Milestone, number | null>;

export interface DelayStat {
  n: number;
  median: number | null;
  min: number | null;
  max: number | null;
  /** Faux sous l'effectif minimal : l'écran écrit « effectif trop faible pour conclure ». */
  sufficient: boolean;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

/**
 * Jalons, en jours calendaires (hypothèse à valider) : J1 soumission à proposition envoyée, J2 proposition à décision,
 * J3 décision à recrutement finalisé, J4 décision à prise de poste. La zone blanche n'a pas de délai (âge de vacance).
 */
export function delaySampleOf(i: Facts & { submittedOn: IsoDate }): DelaySample | null {
  const r = i.recruitment;
  if (r.intake !== 'taken' || isClosed(r) || r.situation === 'white_zone') return null;
  const sent = [...i.proposals].filter((p) => p.sent_on).sort((a, b) => a.version - b.version);
  const first = sent[0];
  const approved = i.decisions.filter((d) => d.outcome === 'approved' && d.status === 'valid').sort((a, b) => b.decided_on.localeCompare(a.decided_on))[0];
  const proposalOfDecision = approved ? i.proposals.find((p) => p.id === approved.proposal_id) : undefined;
  return {
    situation: r.situation,
    j1: first?.sent_on ? daysBetween(i.submittedOn, first.sent_on) : null,
    j2: approved && proposalOfDecision?.sent_on ? daysBetween(proposalOfDecision.sent_on, approved.decided_on) : null,
    j3: approved && r.hired_on ? daysBetween(approved.decided_on, r.hired_on) : null,
    j4: approved && r.start_work_date ? daysBetween(approved.decided_on, r.start_work_date) : null,
  };
}

export function delayStats(samples: readonly DelaySample[], minSample: number): Record<Situation, Record<Milestone, DelayStat>> {
  const out = {} as Record<Situation, Record<Milestone, DelayStat>>;
  for (const s of ['new', 'reassigned', 'white_zone'] as const) {
    out[s] = {} as Record<Milestone, DelayStat>;
    for (const m of MILESTONES) {
      const values = samples.filter((x) => x.situation === s).map((x) => x[m]).filter((v): v is number => v !== null);
      out[s][m] = {
        n: values.length, median: median(values), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null,
        sufficient: values.length >= minSample,
      };
    }
  }
  return out;
}

export interface StartLagSample {
  situation: Situation;
  kind: StartLagKind;
  /** Jours calendaires entre l'acceptation et la prise de poste. */
  days: number;
}

/**
 * Classe l'écart entre l'acceptation (date de la décision) et le poste démarré. Même jour = même jour calendaire (dates
 * stockées au fuseau de Paris). Aucun seuil : « plus tard dans la journée » exige l'heure des deux événements (HH:MM) ; sans
 * elle, un même jour reste « même jour ». Toute date postérieure est « jour ouvré suivant ou plus » (une prise de poste un jour non
 * ouvré entre deux n'a pas de catégorie propre : hypothèse). Une prise de poste antérieure à l'acceptation n'est pas classée.
 */
export function startLagKind(acceptedOn: IsoDate, startedOn: IsoDate, acceptedTime?: string | null, startedTime?: string | null): StartLagKind | null {
  if (startedOn < acceptedOn) return null;
  if (startedOn > acceptedOn) return 'next_working_day_or_more';
  return acceptedTime && startedTime && startedTime > acceptedTime ? 'later_in_day' : 'same_day';
}

/** Un poste démarré sous accord en vigueur ; la zone blanche, les besoins fermés et les postes pas encore démarrés n'ont pas d'écart. */
export function startLagSample(f: Facts, today: IsoDate): StartLagSample | null {
  const r = f.recruitment;
  if (r.intake !== 'taken' || isClosed(r) || r.situation === 'white_zone' || !r.hired_on || !r.start_work_date || r.start_work_date > today) return null;
  const sent = sentProposal(f.proposals);
  const accord = sent ? validDecisionOn(sent.id, f.decisions) : null;
  if (accord?.outcome !== 'approved') return null;
  const kind = startLagKind(accord.decided_on, r.start_work_date, accord.decided_time, r.start_work_time);
  return kind ? { situation: r.situation, kind, days: daysBetween(accord.decided_on, r.start_work_date) } : null;
}

export function startLagStats(samples: readonly StartLagSample[], minSample: number): Record<Situation, Record<StartLagKind, DelayStat>> {
  const out = {} as Record<Situation, Record<StartLagKind, DelayStat>>;
  for (const s of ['new', 'reassigned', 'white_zone'] as const) {
    out[s] = {} as Record<StartLagKind, DelayStat>;
    for (const k of START_LAG_KINDS) {
      const values = samples.filter((x) => x.situation === s && x.kind === k).map((x) => x.days);
      out[s][k] = { n: values.length, median: median(values), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null, sufficient: values.length >= minSample };
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Entonnoir : stock par état, positions hors entonnoir, taux d'heures.
// ---------------------------------------------------------------------------------------------
export interface FunnelRow {
  state: FunnelState | null;
  situation: Situation;
  /** Sorti du circuit : stoppé (motif obligatoire) ou rejeté à la qualification. */
  closed: 'stopped' | 'rejected' | null;
  /** Besoin pas encore pris en charge par l'agence. */
  toQualify: boolean;
  hours: number | null;
  refusals: number;
  withdrawals: number;
  /** Besoin stoppé après sa prise de poste : ses heures effectuées avant l'arrêt restent comptées (D211). */
  performedBeforeStop: boolean;
}

export interface FunnelSummary {
  byState: Record<FunnelState, { needs: number; hours: number }>;
  /** Positions hors entonnoir, comptées à part (D85). */
  stopped: number;
  rejected: number;
  /** Heures par semaine des besoins stoppés après leur prise de poste : comptées dans les taux, affichées à part. */
  stoppedPerformedHours: number;
  whiteZone: { needs: number; hours: number };
  toQualify: number;
  /** Besoin passé en « Réattribué » : compté dans son état, signalé à part. */
  reassigned: number;
  demandedHours: number;
  /** Taux d'heures recrutées et en poste. Nul si aucune heure demandée : l'écran écrit « Donnée indisponible », jamais 0. */
  hiredRate: number | null;
  startedRate: number | null;
  refusals: number;
  withdrawals: number;
  returned: number;
}

/**
 * Heures demandées : besoins pris en charge, hors zone blanche (exclue du numérateur et du dénominateur, D92) et hors besoins
 * stoppés, sauf leurs heures effectuées avant l'arrêt qui restent comptées (D211).
 */
export function funnelSummary(rows: readonly FunnelRow[]): FunnelSummary {
  const byState = Object.fromEntries((['to_recruit', 'recruiting', 'proposed', 'approved', 'hired', 'started'] as const).map((s) => [s, { needs: 0, hours: 0 }])) as FunnelSummary['byState'];
  let stopped = 0;
  let rejected = 0;
  let stoppedPerformed = 0;
  let toQualify = 0;
  let reassigned = 0;
  let demanded = 0;
  let hired = 0;
  let started = 0;
  let refusals = 0;
  let withdrawals = 0;
  let returned = 0;
  const white = { needs: 0, hours: 0 };
  for (const r of rows) {
    if (r.closed) {
      if (r.closed === 'stopped') {
        stopped += 1;
        if (r.performedBeforeStop) {
          // D211 : exclu du taux comme la zone blanche, sauf les heures déjà effectuées avant l'arrêt.
          stoppedPerformed += r.hours ?? 0;
          demanded += r.hours ?? 0;
          hired += r.hours ?? 0;
          started += r.hours ?? 0;
        }
      } else rejected += 1;
      continue;
    }
    if (r.toQualify) {
      toQualify += 1;
      continue;
    }
    refusals += r.refusals;
    withdrawals += r.withdrawals;
    if (r.refusals + r.withdrawals > 0) returned += 1;
    if (r.situation === 'white_zone') {
      white.needs += 1;
      white.hours += r.hours ?? 0;
      continue;
    }
    if (r.situation === 'reassigned') reassigned += 1;
    if (!r.state) continue;
    byState[r.state].needs += 1;
    byState[r.state].hours += r.hours ?? 0;
    demanded += r.hours ?? 0;
    if (r.state === 'hired' || r.state === 'started') hired += r.hours ?? 0;
    if (r.state === 'started') started += r.hours ?? 0;
  }
  return {
    byState, stopped, rejected, stoppedPerformedHours: stoppedPerformed, whiteZone: white, toQualify, reassigned, demandedHours: demanded,
    hiredRate: demanded > 0 ? hired / demanded : null, startedRate: demanded > 0 ? started / demanded : null,
    refusals, withdrawals, returned,
  };
}

// ---------------------------------------------------------------------------------------------
// Notes (D162) : visibilité, défaut refus.
// ---------------------------------------------------------------------------------------------
export interface NoteViewer {
  side: Side;
  scope: Scope;
}

/**
 * Une note est lisible si son besoin est dans le périmètre du lecteur ET si sa visibilité l'y autorise. L'agence lit tout,
 * y compris les notes retirées (trace). La cliente ne lit jamais une note interne ni une note retirée. Une valeur de
 * visibilité inconnue est refusée.
 */
export function noteVisibleTo(note: Note, viewer: NoteViewer, sectorInScope: boolean, recipient: Pick<Zone, 'id' | 'kind'> | null): boolean {
  if (!sectorInScope) return false;
  if (viewer.side === 'agency' || viewer.side === 'provider') return true;
  if (viewer.side !== 'client' || note.withdrawn_on) return false;
  if (note.visibility === 'shared_client') return true;
  if (note.visibility === 'shared_recipient') {
    return Boolean(recipient) && viewer.scope.kind === recipient?.kind && viewer.scope.ids.includes(recipient.id);
  }
  return false;
}

/** Libellé de la confirmation exigée avant tout partage : vrai pour toute visibilité autre qu'interne. */
export const needsShareConfirmation = (visibility: Note['visibility']): boolean => visibility !== 'agency_internal';
