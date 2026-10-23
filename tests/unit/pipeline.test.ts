import { describe, expect, it } from 'vitest';
import type { Decision, Note, Proposal, Recruitment } from '@/data/schemas';
import {
  DEFAULT_PIPELINE_PARAMS, addWorkingDays, billableFrom, blankRecruitment, computeDeviations, delaySampleOf, delayStats, funnelState,
  funnelSummary, median, needChangedSince, needSpan, nextStep, noteVisibleTo, positionStatus, proposalIssues, sameDeterminants, urgencyOf,
} from '@/domain/pipeline';
import type { Facts, FunnelRow } from '@/domain/pipeline';
import type { CalendarRules } from '@/domain/working-days';
import { need, period, TODAY } from './needs-util';

const CAL: CalendarRules = { nonWorkingWeekdays: [6, 7], excludeHolidays: true };
const P = DEFAULT_PIPELINE_PARAMS;
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const NEED_ID = ID(1);

const rec = (over: Partial<Recruitment> = {}): Recruitment => ({ ...blankRecruitment(NEED_ID), intake: 'taken', qualified_on: '2026-10-20', ...over });
const proposal = (over: Partial<Proposal> = {}): Proposal => ({
  id: ID(10), need_id: NEED_ID, version: 1, status: 'proposed', candidate_ref: 'INT-001', weekly_hours: 20, days: [1, 2, 3, 4, 5],
  hours_slot: '09:00-17:00', start_date: '2026-11-02', end_date: '2026-11-08', store_codes: [], deviation_note: null, cost_status: 'complete',
  deviations: [], author_profile: 'agency_operator', created_on: '2026-10-21', sent_on: '2026-10-21', due_on: null, withdrawn_on: null,
  withdrawn_motive: null, is_demo: true, ...over,
});
const decision = (over: Partial<Decision> = {}): Decision => ({
  id: ID(20), proposal_id: ID(10), need_id: NEED_ID, version: 1, outcome: 'approved', motive: null, status: 'valid', decided_by: 'cvr_client',
  decided_on: '2026-10-22', invalidated_on: null, invalidated_reason: null, invalidated_by_proposal_id: null, is_demo: true, ...over,
});
const facts = (r: Recruitment, proposals: Proposal[] = [], decisions: Decision[] = []): Facts => ({ recruitment: r, proposals, decisions });

describe('jours ouvrés et urgence', () => {
  it('ajoute des jours ouvrés en sautant le week-end', () => {
    expect(addWorkingDays('2026-10-23', 1, CAL)).toBe('2026-10-26'); // vendredi vers lundi
    expect(addWorkingDays('2026-10-23', 5, CAL)).toBe('2026-10-30');
  });
  it('urgence : en retard, urgent, proche, normal', () => {
    expect(urgencyOf('2026-10-22', TODAY, P, CAL)).toEqual({ urgency: 'overdue', lateDays: 1 });
    expect(urgencyOf('2026-10-23', TODAY, P, CAL).urgency).toBe('urgent');
    expect(urgencyOf('2026-10-27', TODAY, P, CAL).urgency).toBe('urgent'); // 2 jours ouvrés
    expect(urgencyOf('2026-10-30', TODAY, P, CAL).urgency).toBe('soon');
    expect(urgencyOf('2026-11-20', TODAY, P, CAL).urgency).toBe('normal');
  });
  it('un seuil paramétré change le niveau, rien n\'est figé', () => {
    expect(urgencyOf('2026-10-30', TODAY, { ...P, soon_within_days: 2, urgent_within_days: 0 }, CAL).urgency).toBe('normal');
  });
});

describe('éléments déterminants et écart au besoin', () => {
  const n = need({ weekly_hours: 20, days: [1, 2, 3, 4, 5], hours_slot: '09:00-17:00', periods: [period(1, '2026-11-02', '2026-11-08')], store_codes: ['MAG-DEMO-001'] });
  it('aucun écart quand la proposition suit le besoin', () => {
    expect(computeDeviations(n, proposal({ store_codes: ['MAG-DEMO-001'] }))).toEqual([]);
  });
  it('chaque dimension écartée est nommée', () => {
    const p = proposal({ weekly_hours: 14, days: [1, 2], hours_slot: '08:00-12:00', end_date: '2026-11-15', store_codes: ['MAG-DEMO-002'] });
    expect(computeDeviations(n, p)).toEqual(['hours', 'days', 'slot', 'period', 'stores']);
  });
  it('l\'ordre des jours et des magasins ne compte pas', () => {
    const a = proposal({ days: [3, 1, 2], store_codes: ['MAG-DEMO-002', 'MAG-DEMO-001'] });
    const b = proposal({ days: [1, 2, 3], store_codes: ['MAG-DEMO-001', 'MAG-DEMO-002'] });
    expect(sameDeterminants(a, b)).toBe(true);
    expect(sameDeterminants(a, proposal({ days: [1, 2, 3], store_codes: ['MAG-DEMO-001'] }))).toBe(false);
  });
  it('un écart non expliqué est signalé, un écart expliqué passe', () => {
    const input = { ...proposal({ weekly_hours: 14, store_codes: ['MAG-DEMO-001'] }), deviation_note: null };
    expect(proposalIssues(n, input, undefined)).toContain('deviation_unexplained');
    expect(proposalIssues(n, { ...input, deviation_note: 'Candidate disponible 14 heures.' }, undefined)).toEqual([]);
  });
  it('une version identique à la précédente est refusée : aucun changement silencieux', () => {
    const prev = proposal({ store_codes: ['MAG-DEMO-001'] });
    expect(proposalIssues(n, { ...prev }, prev)).toContain('no_change');
    expect(proposalIssues(n, { ...prev, candidate_ref: 'INT-002' }, prev)).not.toContain('no_change');
  });
  it('fin avant début refusée', () => {
    expect(proposalIssues(n, proposal({ start_date: '2026-11-09', end_date: '2026-11-02', store_codes: ['MAG-DEMO-001'] }), undefined)).toContain('period_order');
  });
  it('le besoin a changé depuis la proposition : détecté', () => {
    const p = proposal({ store_codes: ['MAG-DEMO-001'], deviations: [] });
    expect(needChangedSince(n, p)).toBe(false);
    expect(needChangedSince({ ...n, periods: [period(1, '2026-11-02', '2026-11-22')] }, p)).toBe(true);
  });
  it('étendue du besoin sur ses périodes', () => {
    expect(needSpan(need({ periods: [period(1, '2026-11-02', '2026-11-08'), period(2, '2026-11-23', '2026-11-29')] }))).toEqual({ start: '2026-11-02', end: '2026-11-29' });
    expect(needSpan(need({ periods: [] }))).toBeNull();
  });
});

describe('entonnoir D92 et statut de poste', () => {
  it('besoin non pris en charge : hors entonnoir, sans statut de poste', () => {
    const f = facts(blankRecruitment(NEED_ID));
    expect(funnelState(f, TODAY)).toBeNull();
    expect(positionStatus(f, TODAY)).toBeNull();
  });
  it('de « À recruter » à « En poste », chaque dimension suit ses propres jalons', () => {
    const p = proposal();
    expect(funnelState(facts(rec()), TODAY)).toBe('to_recruit');
    expect(positionStatus(facts(rec()), TODAY)).toBe('to_recruit');
    expect(funnelState(facts(rec({ search_started_on: '2026-10-21' })), TODAY)).toBe('recruiting');
    expect(funnelState(facts(rec({ search_started_on: '2026-10-21' }), [p]), TODAY)).toBe('proposed');
    expect(positionStatus(facts(rec({ search_started_on: '2026-10-21' }), [p]), TODAY)).toBe('proposed');
    const approved = facts(rec({ search_started_on: '2026-10-21' }), [p], [decision()]);
    expect(funnelState(approved, TODAY)).toBe('approved');
    expect(positionStatus(approved, TODAY)).toBe('approved');
    const hired = facts(rec({ search_started_on: '2026-10-21', hired_on: '2026-10-23' }), [p], [decision()]);
    expect(funnelState(hired, TODAY)).toBe('hired');
    expect(positionStatus(hired, TODAY)).toBe('approved'); // pas « Pourvu » sans prise de poste atteinte
    const started = facts(rec({ search_started_on: '2026-10-21', hired_on: '2026-10-22', start_work_date: '2026-10-23' }), [p], [decision()]);
    expect(funnelState(started, TODAY)).toBe('started');
    expect(positionStatus(started, TODAY)).toBe('filled');
  });
  it('une prise de poste future laisse le besoin à « Recrutement finalisé » (D11)', () => {
    const f = facts(rec({ hired_on: '2026-10-22', start_work_date: '2026-11-02' }), [proposal()], [decision()]);
    expect(funnelState(f, TODAY)).toBe('hired');
    expect(positionStatus(f, TODAY)).toBe('approved');
  });
  it('la remise du véhicule est un événement distinct : elle ne change pas l\'état', () => {
    const base = rec({ search_started_on: '2026-10-21', hired_on: '2026-10-22' });
    const withVehicle = { ...base, vehicle_handover_date: '2026-10-22' };
    expect(funnelState(facts(withVehicle, [proposal()], [decision()]), TODAY)).toBe(funnelState(facts(base, [proposal()], [decision()]), TODAY));
  });
  it('refus de la cliente : retour à « En recrutement », statut de poste « Refusé » (D97)', () => {
    const f = facts(rec({ search_started_on: '2026-10-21', refusal_count: 1 }), [proposal()], [decision({ outcome: 'refused', motive: 'Profil non adapté.' })]);
    expect(funnelState(f, TODAY)).toBe('recruiting');
    expect(positionStatus(f, TODAY)).toBe('refused');
  });
  it('révision demandée : la proposition reste « Proposé »', () => {
    const f = facts(rec({ search_started_on: '2026-10-21' }), [proposal()], [decision({ outcome: 'revision', motive: 'Horaires.' })]);
    expect(funnelState(f, TODAY)).toBe('proposed');
  });
  it('décision invalidée : plus aucun accord, retour à l\'état précédent', () => {
    const f = facts(rec({ search_started_on: '2026-10-21' }), [proposal()], [decision({ status: 'invalidated', invalidated_reason: 'new_version', invalidated_on: '2026-10-23' })]);
    expect(funnelState(f, TODAY)).toBe('proposed');
  });
  it('désistement : « En recrutement » et statut « Désistement » jusqu\'à une nouvelle proposition', () => {
    const r = rec({ search_started_on: '2026-10-23', withdrawal_count: 1, exits: [{ kind: 'withdrawal', on: '2026-10-23', hired_on: '2026-10-22', start_work_date: null }] });
    expect(funnelState(facts(r), TODAY)).toBe('recruiting');
    expect(positionStatus(facts(r), TODAY)).toBe('withdrawal');
    expect(positionStatus(facts(r, [proposal({ id: ID(11), version: 2 })]), TODAY)).toBe('proposed');
    const broken = rec({ search_started_on: '2026-10-23', exits: [{ kind: 'termination', on: '2026-10-23', hired_on: '2026-10-01', start_work_date: '2026-10-05' }] });
    expect(positionStatus(facts(broken), TODAY)).toBe('termination');
  });
  it('rejeté ou stoppé : sorti de l\'entonnoir, statut « Annulé »', () => {
    expect(positionStatus(facts(rec({ intake: 'rejected' })), TODAY)).toBe('cancelled');
    const stopped = rec({ stopped: { reason: 'Fermeture du magasin.', on: '2026-10-22' } });
    expect(funnelState(facts(stopped), TODAY)).toBeNull();
    expect(positionStatus(facts(stopped), TODAY)).toBe('cancelled');
  });
  it('facturable à partir de la prise de poste seulement (S6)', () => {
    expect(billableFrom(rec({ hired_on: '2026-10-22' }))).toBeNull();
    expect(billableFrom(rec({ hired_on: '2026-10-22', start_work_date: '2026-11-02' }))).toBe('2026-11-02');
  });
});

describe('qui doit agir', () => {
  const base = { needState: 'submitted' as 'submitted' | 'draft', submittedOn: '2026-10-20', requestedStart: '2026-11-02' };
  const step = (f: Facts, over: Partial<typeof base> = {}) => nextStep({ ...f, ...base, ...over }, TODAY, P, CAL);
  it('brouillon : la personne qui saisit', () => {
    expect(step(facts(blankRecruitment(NEED_ID)), { needState: 'draft' })).toMatchObject({ actor: 'rs', action: 'complete_need', due: null });
  });
  it('besoin soumis : l\'agence qualifie dans le délai', () => {
    expect(step(facts(blankRecruitment(NEED_ID)))).toMatchObject({ actor: 'agency', action: 'qualify', due: '2026-10-22', urgency: 'overdue' });
  });
  it('précision demandée : le RS répond', () => {
    expect(step(facts(rec({ intake: 'clarification' })))).toMatchObject({ actor: 'rs', action: 'clarify' });
  });
  it('pris en charge sans proposition : l\'agence prépare, retard de proposition mesuré en jours ouvrés', () => {
    const s = step(facts(rec()), { submittedOn: '2026-10-12' });
    expect(s).toMatchObject({ actor: 'agency', action: 'prepare_proposal', due: '2026-10-19', urgency: 'overdue', lateDays: 4 });
  });
  it('proposition en cours : l\'agence envoie', () => {
    expect(step(facts(rec(), [proposal({ status: 'in_progress', sent_on: null })]))).toMatchObject({ actor: 'agency', action: 'send_proposal' });
  });
  it('proposition envoyée : la cliente décide, échéance à compter de l\'envoi', () => {
    expect(step(facts(rec(), [proposal({ sent_on: '2026-10-21' })]))).toMatchObject({ actor: 'decider', action: 'decide', due: '2026-10-28', urgency: 'soon' });
  });
  it('révision demandée : l\'agence propose une nouvelle version ; refus : nouvelle proposition', () => {
    expect(step(facts(rec(), [proposal()], [decision({ outcome: 'revision', motive: 'x' })]))).toMatchObject({ actor: 'agency', action: 'revise_proposal' });
    expect(step(facts(rec(), [proposal()], [decision({ outcome: 'refused', motive: 'x' })]))).toMatchObject({ actor: 'agency', action: 'new_proposal' });
  });
  it('accord obtenu : l\'agence finalise le recrutement puis la prise de poste', () => {
    expect(step(facts(rec(), [proposal()], [decision()]))).toMatchObject({ actor: 'agency', action: 'finalise_hiring' });
    expect(step(facts(rec({ hired_on: '2026-10-22' }), [proposal()], [decision()]))).toMatchObject({ actor: 'agency', action: 'start_work', due: '2026-11-02' });
  });
  it('en poste, stoppé ou rejeté : personne ne doit agir', () => {
    expect(step(facts(rec({ hired_on: '2026-10-20', start_work_date: '2026-10-22' }), [proposal()], [decision()])).actor).toBe('none');
    expect(step(facts(rec({ stopped: { reason: 'x', on: '2026-10-22' } }))).actor).toBe('none');
    expect(step(facts(rec({ intake: 'rejected' }))).actor).toBe('none');
  });
});

describe('délais par situation, jamais une moyenne unique', () => {
  const sample = (situation: 'new' | 'reassigned', j1: number | null): Parameters<typeof delayStats>[0][number] => ({ situation, j1, j2: null, j3: null, j4: null });
  it('médiane, étendue et effectif par situation', () => {
    const stats = delayStats([sample('new', 2), sample('new', 4), sample('new', 9), sample('reassigned', 1)], 3);
    expect(stats.new.j1).toEqual({ n: 3, median: 4, min: 2, max: 9, sufficient: true });
    expect(stats.reassigned.j1).toMatchObject({ n: 1, median: 1, sufficient: false });
  });
  it('sous l\'effectif minimal : insuffisant, pas de conclusion', () => {
    expect(delayStats([sample('new', 2), sample('new', 3)], 5).new.j1.sufficient).toBe(false);
  });
  it('aucune valeur : null, jamais 0', () => {
    const s = delayStats([], 5);
    expect(s.new.j1).toEqual({ n: 0, median: null, min: null, max: null, sufficient: false });
  });
  it('médiane d\'un effectif pair', () => {
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  it('jalons J1 à J4 d\'un besoin et zone blanche sans délai', () => {
    const f = facts(rec({ search_started_on: '2026-10-21', hired_on: '2026-10-27', start_work_date: '2026-11-02' }), [proposal({ sent_on: '2026-10-22' })], [decision({ decided_on: '2026-10-24' })]);
    expect(delaySampleOf({ ...f, submittedOn: '2026-10-20' })).toEqual({ situation: 'new', j1: 2, j2: 2, j3: 3, j4: 9 });
    expect(delaySampleOf({ ...facts(rec({ situation: 'white_zone' })), submittedOn: '2026-10-20' })).toBeNull();
    expect(delaySampleOf({ ...facts(rec({ stopped: { reason: 'x', on: '2026-10-22' } })), submittedOn: '2026-10-20' })).toBeNull();
  });
  it('réattribution : mesurée dans sa propre situation', () => {
    const f = facts(rec({ situation: 'reassigned', search_started_on: '2026-10-21' }), [proposal({ sent_on: '2026-10-21' })]);
    expect(delaySampleOf({ ...f, submittedOn: '2026-10-20' })).toMatchObject({ situation: 'reassigned', j1: 1 });
  });
});

describe('entonnoir : stock, hors entonnoir, taux', () => {
  const row = (over: Partial<FunnelRow>): FunnelRow => ({ state: 'recruiting', situation: 'new', closed: null, toQualify: false, hours: 10, refusals: 0, withdrawals: 0, performedBeforeStop: false, ...over });
  it('la zone blanche sort du numérateur et du dénominateur, ligne séparée', () => {
    const s = funnelSummary([row({ state: 'started', hours: 20 }), row({ state: 'recruiting', hours: 20 }), row({ state: 'recruiting', situation: 'white_zone', hours: 40 })]);
    expect(s.demandedHours).toBe(40);
    expect(s.startedRate).toBeCloseTo(0.5);
    expect(s.whiteZone).toEqual({ needs: 1, hours: 40 });
  });
  it('un besoin stoppé sort du taux et se compte à part', () => {
    const s = funnelSummary([row({ state: 'started', hours: 10 }), row({ state: null, closed: 'stopped', hours: 30 })]);
    expect(s.stopped).toBe(1);
    expect(s.rejected).toBe(0);
    expect(s.demandedHours).toBe(10);
    expect(s.startedRate).toBe(1);
  });
  it('aucune heure demandée : taux nul (donnée indisponible), jamais 0 %', () => {
    const s = funnelSummary([row({ toQualify: true, state: null })]);
    expect(s.hiredRate).toBeNull();
    expect(s.startedRate).toBeNull();
    expect(s.toQualify).toBe(1);
  });
  it('refus et désistements comptés, réattribué compté dans son état', () => {
    const s = funnelSummary([row({ refusals: 2, withdrawals: 1 }), row({ situation: 'reassigned', state: 'started' })]);
    expect(s).toMatchObject({ refusals: 2, withdrawals: 1, returned: 1, reassigned: 1 });
    expect(s.byState.started.needs).toBe(1);
  });
});

describe('visibilité des notes (D162), défaut refus', () => {
  const zone = (kind: 'dr' | 'cvr' | 'rs') => ({ id: ID(kind === 'dr' ? 31 : kind === 'cvr' ? 32 : 33), kind });
  const note = (over: Partial<Note> = {}): Note => ({
    id: ID(40), object_kind: 'proposal', object_id: ID(10), need_id: NEED_ID, sector_id: ID(33), text: 'Note de démonstration.',
    visibility: 'agency_internal', recipient_zone_id: null, author_profile: 'agency_operator', created_on: '2026-10-22', seq: 1,
    withdrawn_on: null, withdrawn_by: null, is_demo: true, ...over,
  });
  const agency = { side: 'agency' as const, scope: { kind: 'all' as const } };
  const direction = { side: 'client' as const, scope: { kind: 'all' as const } };
  const cvr = { side: 'client' as const, scope: { kind: 'cvr' as const, ids: [zone('cvr').id] } };
  const otherCvr = { side: 'client' as const, scope: { kind: 'cvr' as const, ids: [ID(99)] } };
  it('une note interne ne sort jamais de l\'agence', () => {
    expect(noteVisibleTo(note(), agency, true, null)).toBe(true);
    expect(noteVisibleTo(note(), direction, true, null)).toBe(false);
    expect(noteVisibleTo(note(), cvr, true, null)).toBe(false);
  });
  it('partagée avec la cliente : tous les profils cliente du périmètre', () => {
    const n = note({ visibility: 'shared_client' });
    expect(noteVisibleTo(n, cvr, true, null)).toBe(true);
    expect(noteVisibleTo(n, direction, true, null)).toBe(true);
    expect(noteVisibleTo(n, cvr, false, null)).toBe(false); // hors périmètre
  });
  it('partagée avec un destinataire : ce destinataire seul', () => {
    const n = note({ visibility: 'shared_recipient', recipient_zone_id: zone('cvr').id });
    expect(noteVisibleTo(n, cvr, true, zone('cvr'))).toBe(true);
    expect(noteVisibleTo(n, otherCvr, true, zone('cvr'))).toBe(false);
    expect(noteVisibleTo(n, direction, true, zone('cvr'))).toBe(false);
    expect(noteVisibleTo(n, agency, true, zone('cvr'))).toBe(true);
    expect(noteVisibleTo(n, cvr, true, null)).toBe(false);
  });
  it('une note retirée disparaît pour la cliente, la trace reste pour l\'agence', () => {
    const n = note({ visibility: 'shared_client', withdrawn_on: '2026-10-23', withdrawn_by: 'agency_operator' });
    expect(noteVisibleTo(n, cvr, true, null)).toBe(false);
    expect(noteVisibleTo(n, agency, true, null)).toBe(true);
  });
  it('une visibilité inconnue est refusée', () => {
    expect(noteVisibleTo(note({ visibility: 'nope' as never }), cvr, true, null)).toBe(false);
  });
});

// ---- Reprises de la revue A3 (D198, D210, D211) ----
import { executionStatus, startLagKind, startLagSample, startLagStats } from '@/domain/pipeline';

describe('reprise 1 : un accord invalidé ne laisse pas « Recrutement finalisé »', () => {
  const invalid = decision({ status: 'invalidated', invalidated_reason: 'need_changed', invalidated_on: '2026-10-23' });
  const hiredRec = rec({ search_started_on: '2026-10-21', hired_on: '2026-10-22', start_work_date: '2026-11-02' });
  it('accord valide : recrutement finalisé', () => {
    expect(funnelState(facts(hiredRec, [proposal()], [decision()]), TODAY)).toBe('hired');
  });
  it('accord invalidé : retour à « Proposé », statut de poste cohérent, la décision reste au dossier', () => {
    const f = facts(hiredRec, [proposal()], [invalid]);
    expect(funnelState(f, TODAY)).toBe('proposed');
    expect(positionStatus(f, TODAY)).toBe('proposed');
    expect(f.decisions).toHaveLength(1);
  });
  it('qui doit agir : la cliente redécide, l\'agence ne « finalise » ni ne prend un poste sans accord', () => {
    const step = nextStep({ ...facts(hiredRec, [proposal()], [invalid]), needState: 'submitted', submittedOn: '2026-10-20', requestedStart: '2026-11-02' }, TODAY, P, CAL);
    expect(step).toMatchObject({ actor: 'decider', action: 'decide' });
  });
  it('proposition retirée avec l\'accord : retour à « En recrutement »', () => {
    const f = facts(hiredRec, [proposal({ status: 'withdrawn' })], [invalid]);
    expect(funnelState(f, TODAY)).toBe('recruiting');
  });
  it('poste déjà démarré : l\'état « En poste » ne dépend pas de l\'accord, le poste est occupé', () => {
    const started = rec({ search_started_on: '2026-10-21', hired_on: '2026-10-22', start_work_date: '2026-10-23' });
    expect(funnelState(facts(started, [proposal()], [invalid]), TODAY)).toBe('started');
  });
});

describe('reprise 4 : statut d\'exécution', () => {
  it('non démarrée, prise de poste planifiée, en poste, terminée', () => {
    expect(executionStatus(facts(blankRecruitment(NEED_ID)), TODAY)).toBeNull();
    expect(executionStatus(facts(rec()), TODAY)).toBe('not_started');
    expect(executionStatus(facts(rec({ hired_on: '2026-10-22', start_work_date: '2026-11-02' })), TODAY)).toBe('start_planned');
    expect(executionStatus(facts(rec({ hired_on: '2026-10-22', start_work_date: '2026-10-23' })), TODAY)).toBe('in_post');
    expect(executionStatus(facts(rec({ hired_on: '2026-10-01', start_work_date: '2026-10-05', stopped: { reason: 'x', on: '2026-10-20' } })), TODAY)).toBe('ended');
    expect(executionStatus(facts(rec({ search_started_on: '2026-10-23', exits: [{ kind: 'termination', on: '2026-10-23', hired_on: '2026-10-01', start_work_date: '2026-10-05' }] })), TODAY)).toBe('ended');
  });
  it('indépendant du statut de poste : un recrutement finalisé sans prise de poste n\'est pas démarré', () => {
    const f = facts(rec({ hired_on: '2026-10-22' }), [proposal()], [decision()]);
    expect(positionStatus(f, TODAY)).toBe('approved');
    expect(executionStatus(f, TODAY)).toBe('not_started');
  });
});

describe('reprise 2 : besoin stoppé et taux d\'heures (D211)', () => {
  const row = (over: Partial<FunnelRow>): FunnelRow => ({ state: 'recruiting', situation: 'new', closed: null, toQualify: false, hours: 10, refusals: 0, withdrawals: 0, performedBeforeStop: false, ...over });
  it('stoppé avant d\'avoir démarré : hors dénominateur et numérateur', () => {
    const s = funnelSummary([row({ state: 'started', hours: 10 }), row({ state: null, closed: 'stopped', hours: 30 })]);
    expect(s.demandedHours).toBe(10);
    expect(s.startedRate).toBe(1);
    expect(s.stopped).toBe(1);
    expect(s.stoppedPerformedHours).toBe(0);
  });
  it('stoppé en cours d\'exécution : ses heures effectuées restent comptées au dénominateur et au numérateur', () => {
    const s = funnelSummary([row({ state: 'started', hours: 10 }), row({ state: null, closed: 'stopped', hours: 30, performedBeforeStop: true })]);
    expect(s.demandedHours).toBe(40);
    expect(s.hiredRate).toBe(1);
    expect(s.startedRate).toBe(1);
    expect(s.stopped).toBe(1);
    expect(s.stoppedPerformedHours).toBe(30);
    expect(s.byState.started.needs).toBe(1); // le stock par état ne compte pas un besoin stoppé
  });
  it('un besoin rejeté n\'a jamais d\'heures effectuées', () => {
    const s = funnelSummary([row({ state: null, closed: 'rejected', hours: 30, performedBeforeStop: true })]);
    expect(s.demandedHours).toBe(0);
    expect(s.rejected).toBe(1);
  });
});

describe('reprise 3 : écart entre l\'acceptation et le poste démarré (D210)', () => {
  it('même jour calendaire, jour ouvré suivant ou plus', () => {
    expect(startLagKind('2026-10-20', '2026-10-20')).toBe('same_day');
    expect(startLagKind('2026-10-20', '2026-10-21')).toBe('next_working_day_or_more');
    expect(startLagKind('2026-10-23', '2026-10-24')).toBe('next_working_day_or_more'); // samedi : aucune catégorie propre, regroupé
    expect(startLagKind('2026-10-20', '2026-11-30')).toBe('next_working_day_or_more');
  });
  it('« plus tard dans la journée » exige les heures des deux événements, sinon il reste vide', () => {
    expect(startLagKind('2026-10-20', '2026-10-20', '09:30', '10:30')).toBe('later_in_day');
    expect(startLagKind('2026-10-20', '2026-10-20', '09:30', '09:30')).toBe('same_day');
    expect(startLagKind('2026-10-20', '2026-10-20', '09:30', null)).toBe('same_day');
  });
  it('un poste démarré dont la date précède l\'acceptation n\'est pas classé', () => {
    expect(startLagKind('2026-10-21', '2026-10-20')).toBeNull();
  });
  it('échantillon : seulement un accord en vigueur et une prise de poste atteinte', () => {
    const started = rec({ search_started_on: '2026-10-20', hired_on: '2026-10-21', start_work_date: '2026-10-22' });
    expect(startLagSample(facts(started, [proposal()], [decision({ decided_on: '2026-10-22' })]), TODAY)).toMatchObject({ kind: 'same_day', days: 0, situation: 'new' });
    expect(startLagSample(facts(started, [proposal()], [decision({ decided_on: '2026-10-20' })]), TODAY)).toMatchObject({ kind: 'next_working_day_or_more', days: 2 });
    expect(startLagSample(facts({ ...started, start_work_date: '2026-11-02' }, [proposal()], [decision()]), TODAY)).toBeNull(); // pas démarré
    expect(startLagSample(facts(started, [proposal()], []), TODAY)).toBeNull();
    expect(startLagSample(facts({ ...started, situation: 'white_zone' }, [proposal()], [decision()]), TODAY)).toBeNull();
  });
  it('statistiques par situation, sans seuil figé, effectif minimal paramétrable', () => {
    const samples = [
      { situation: 'new' as const, kind: 'same_day' as const, days: 0 }, { situation: 'new' as const, kind: 'next_working_day_or_more' as const, days: 3 },
      { situation: 'new' as const, kind: 'next_working_day_or_more' as const, days: 9 }, { situation: 'reassigned' as const, kind: 'same_day' as const, days: 0 },
    ];
    const s = startLagStats(samples, 2);
    expect(s.new.same_day).toMatchObject({ n: 1, sufficient: false });
    expect(s.new.next_working_day_or_more).toEqual({ n: 2, median: 6, min: 3, max: 9, sufficient: true });
    expect(s.new.later_in_day).toMatchObject({ n: 0, median: null });
    expect(s.reassigned.same_day.n).toBe(1);
    expect(s.white_zone.same_day.n).toBe(0);
  });
});

// ---- D212 (action « renvoyer pour confirmation ») et D214 (heures) ----
describe('D212 : accord perdu après la prise de poste', () => {
  const startedRec = rec({ search_started_on: '2026-10-01', hired_on: '2026-10-05', start_work_date: '2026-10-10' });
  const invalid = decision({ status: 'invalidated', invalidated_reason: 'need_changed', invalidated_on: '2026-10-21' });
  const step = (f: Facts, needChanged?: boolean) =>
    nextStep({ ...f, needState: 'submitted', submittedOn: '2026-10-01', requestedStart: '2026-10-10', ...(needChanged === undefined ? {} : { needChanged }) }, TODAY, P, CAL);
  it('accord en vigueur : personne n\'a rien à faire', () => {
    expect(step(facts(startedRec, [proposal()], [decision()])).actor).toBe('none');
  });
  it('besoin modifié, accord invalidé : l\'agence renvoie la proposition pour confirmation, avec échéance', () => {
    const s = step(facts(startedRec, [proposal()], [invalid]), true);
    expect(s).toMatchObject({ actor: 'agency', action: 'reconfirm_proposal', due: '2026-10-28' });
  });
  it('nouvelle version envoyée : la cliente décide', () => {
    expect(step(facts(startedRec, [proposal({ version: 2, id: ID(11) })], [invalid]), false)).toMatchObject({ actor: 'decider', action: 'decide' });
  });
  it('aucune proposition envoyée : l\'agence propose', () => {
    expect(step(facts(startedRec, [], []), false)).toMatchObject({ actor: 'agency', action: 'reconfirm_proposal' });
  });
});

describe('D214 : heures de l\'acceptation et de la prise de poste', () => {
  it('même jour avec heure de prise de poste postérieure : « plus tard dans la journée »', () => {
    const r = rec({ search_started_on: '2026-10-20', hired_on: '2026-10-21', start_work_date: '2026-10-22', start_work_time: '11:00' });
    const d = decision({ decided_on: '2026-10-22', decided_time: '09:30' });
    expect(startLagSample(facts(r, [proposal()], [d]), TODAY)).toMatchObject({ kind: 'later_in_day', days: 0 });
    expect(startLagSample(facts({ ...r, start_work_time: '09:30' }, [proposal()], [d]), TODAY)).toMatchObject({ kind: 'same_day' });
    expect(startLagSample(facts({ ...r, start_work_time: null }, [proposal()], [d]), TODAY)).toMatchObject({ kind: 'same_day' });
  });
});
