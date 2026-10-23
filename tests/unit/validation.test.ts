import { describe, expect, it } from 'vitest';
import type { Delegation, Validation, Zone } from '@/data/schemas';
import {
  activeDelegations, delegationIssue, delegationStatus, effectiveScope, nextValidationStep, validationSince, validationState, validationTransition,
} from '@/domain/validation';
import { DEFAULT_PIPELINE_PARAMS } from '@/domain/pipeline';
import type { CalendarRules } from '@/domain/working-days';

const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const zone = (n: number, kind: Zone['kind'], parent: number | null): Zone => ({ id: U(n), kind, code: `Z-${n}`, parent_id: parent ? U(parent) : null, is_demo: true } as Zone);
// DR 1 > CVR 2, 3 > RS 4 (sous 2), 5 (sous 3) ; DR 6 > CVR 7 > RS 8
const ZONES: Zone[] = [zone(1, 'dr', null), zone(2, 'cvr', 1), zone(3, 'cvr', 1), zone(4, 'rs', 2), zone(5, 'rs', 3), zone(6, 'dr', null), zone(7, 'cvr', 6), zone(8, 'rs', 7)];
const CAL: CalendarRules = { nonWorkingWeekdays: [6, 7], excludeHolidays: false } as CalendarRules;
const TODAY = '2026-10-23';

const rec = (over: Partial<Validation>): Validation => ({
  id: U(100), need_id: U(50), sector_id: U(4), seq: 1, round: 1, outcome: 'validated', level: 'cvr', escalation_case: null, concerned_zone_id: null,
  motive: null, actor_profile: 'cvr_client', via_delegation_id: null, decided_on: '2026-10-20', decided_time: '10:30', is_demo: true, ...over,
});
const del = (over: Partial<Delegation>): Delegation => ({
  id: U(200), absent_zone_id: U(2), substitute_zone_id: U(3), starts_on: '2026-10-20', ends_on: '2026-10-30', motive: null, created_by: 'agency_admin',
  created_on: '2026-10-19', stopped_on: null, stopped_by: null, is_demo: true, ...over,
});

describe('état de la validation managériale (dimension distincte)', () => {
  it('sans trace : à valider', () => expect(validationState([])).toBe('to_validate'));
  it('suit la dernière trace', () => {
    expect(validationState([rec({ seq: 1, outcome: 'validated' })])).toBe('validated');
    expect(validationState([rec({ seq: 1, outcome: 'refused', motive: 'x' })])).toBe('refused');
    expect(validationState([rec({ seq: 1, outcome: 'escalated', escalation_case: 'out_of_perimeter', motive: 'x' })])).toBe('escalated');
  });
  it('l\'ordre vient du numéro de séquence, pas de l\'ordre du tableau', () => {
    const a = rec({ seq: 2, outcome: 'validated' });
    const b = rec({ seq: 1, outcome: 'refused', motive: 'x' });
    expect(validationState([a, b])).toBe('validated');
  });
  it('un renvoi après refus rouvre un tour sans effacer l\'historique', () => {
    const rs = [rec({ seq: 1, outcome: 'refused', motive: 'x' }), rec({ seq: 2, outcome: 'resubmitted', level: 'cvr' })];
    expect(validationState(rs)).toBe('to_validate');
    expect(rs).toHaveLength(2);
  });
  it('depuis quand : soumission, dernier renvoi ou dernière escalade', () => {
    expect(validationSince([], '2026-10-01')).toBe('2026-10-01');
    expect(validationSince([rec({ seq: 1, outcome: 'refused', motive: 'x', decided_on: '2026-10-05' }), rec({ seq: 2, outcome: 'resubmitted', decided_on: '2026-10-08' })], '2026-10-01')).toBe('2026-10-08');
    expect(validationSince([rec({ seq: 1, outcome: 'escalated', escalation_case: 'out_of_envelope', motive: 'x', decided_on: '2026-10-09' })], '2026-10-01')).toBe('2026-10-09');
  });
});

describe('transitions autorisées', () => {
  const states = ['to_validate', 'escalated', 'validated', 'refused'] as const;
  const actions = ['cvr_validate', 'cvr_refuse', 'cvr_escalate', 'dr_validate', 'dr_refuse', 'resubmit'] as const;
  it('table complète : seule une transition prévue est acceptée', () => {
    const ok: Record<string, string[]> = {
      to_validate: ['cvr_validate', 'cvr_refuse', 'cvr_escalate'],
      escalated: ['dr_validate', 'dr_refuse'],
      validated: [],
      refused: ['resubmit'],
    };
    for (const s of states) for (const a of actions) {
      const r = validationTransition(s, a);
      expect(r.ok, `${s} + ${a}`).toBe(ok[s]!.includes(a));
    }
  });
  it('refus nommés', () => {
    expect(validationTransition('escalated', 'cvr_validate')).toEqual({ ok: false, reason: 'not_pending' });
    expect(validationTransition('to_validate', 'dr_validate')).toEqual({ ok: false, reason: 'not_escalated' });
    expect(validationTransition('validated', 'resubmit')).toEqual({ ok: false, reason: 'not_refused' });
  });
});

describe('qui doit agir pendant la validation (urgence et retard)', () => {
  const step = (state: Parameters<typeof nextValidationStep>[0], since: string, today = TODAY) =>
    nextValidationStep(state, since, today, DEFAULT_PIPELINE_PARAMS, CAL);
  it('à valider : le CVR, échéance en jours ouvrés depuis la soumission', () => {
    // Soumis jeudi 15/10/2026 : échéance lundi 19/10 (2 jours ouvrés), en retard le 23/10.
    const s = step('to_validate', '2026-10-15')!;
    expect(s).toMatchObject({ actor: 'cvr', action: 'validate_need', due: '2026-10-19', urgency: 'overdue' });
    expect(s.lateDays).toBeGreaterThan(0);
  });
  it('escaladé : le DR', () => expect(step('escalated', '2026-10-22')).toMatchObject({ actor: 'dr', action: 'arbitrate_need', due: '2026-10-26', urgency: 'urgent' }));
  it('refusé : le RS corrige, sans échéance', () => expect(step('refused', '2026-10-22')).toMatchObject({ actor: 'rs', action: 'resubmit_need', due: null, urgency: null }));
  it('validé : aucune étape de validation', () => expect(step('validated', '2026-10-22')).toBeNull());
});

describe('délégations (F-30.3)', () => {
  it('statut calculé : planifiée, en cours, terminée, arrêtée, annulée', () => {
    const d = del({});
    expect(delegationStatus(d, '2026-10-19')).toBe('planned');
    expect(delegationStatus(d, '2026-10-20')).toBe('active');
    expect(delegationStatus(d, '2026-10-30')).toBe('active');
    expect(delegationStatus(d, '2026-10-31')).toBe('ended');
    expect(delegationStatus({ ...d, stopped_on: '2026-10-25' }, '2026-10-26')).toBe('ended');
    expect(delegationStatus({ ...d, stopped_on: '2026-10-25' }, '2026-10-24')).toBe('active');
    expect(delegationStatus({ ...d, starts_on: '2026-11-02', ends_on: '2026-11-09', stopped_on: '2026-10-23' }, '2026-10-24')).toBe('cancelled');
  });
  it('seules les délégations en cours comptent', () => {
    const ds = [del({ id: U(1) }), del({ id: U(2), starts_on: '2026-11-02', ends_on: '2026-11-09' }), del({ id: U(3), stopped_on: '2026-10-21' })];
    expect(activeDelegations(ds, TODAY).map((d) => d.id)).toEqual([U(1)]);
  });
  it('le suppléant reçoit la zone du délégant et rien d\'autre', () => {
    const scope = effectiveScope({ kind: 'cvr', ids: [U(3)] }, [del({})], ZONES, TODAY);
    expect(scope).toEqual({ kind: 'cvr', ids: [U(3), U(2)] });
  });
  it('hors période, le périmètre revient au sien', () => {
    expect(effectiveScope({ kind: 'cvr', ids: [U(3)] }, [del({})], ZONES, '2026-10-31')).toEqual({ kind: 'cvr', ids: [U(3)] });
    expect(effectiveScope({ kind: 'cvr', ids: [U(3)] }, [del({})], ZONES, '2026-10-19')).toEqual({ kind: 'cvr', ids: [U(3)] });
    expect(effectiveScope({ kind: 'cvr', ids: [U(3)] }, [del({ stopped_on: TODAY })], ZONES, TODAY)).toEqual({ kind: 'cvr', ids: [U(3)] });
  });
  it('jamais plus large que celui du délégant : un autre niveau, un autre suppléant ou un périmètre global ne reçoivent rien', () => {
    const d = del({});
    expect(effectiveScope({ kind: 'dr', ids: [U(1)] }, [d], ZONES, TODAY)).toEqual({ kind: 'dr', ids: [U(1)] });
    expect(effectiveScope({ kind: 'cvr', ids: [U(7)] }, [d], ZONES, TODAY)).toEqual({ kind: 'cvr', ids: [U(7)] });
    expect(effectiveScope({ kind: 'rs', ids: [U(5)] }, [d], ZONES, TODAY)).toEqual({ kind: 'rs', ids: [U(5)] });
    expect(effectiveScope({ kind: 'all' }, [d], ZONES, TODAY)).toEqual({ kind: 'all' });
  });
  it('la suppléance ne se transmet pas : le suppléant d\'un suppléant ne reçoit rien', () => {
    // 3 couvre 2 ; 7 couvre 3 : 7 ne reçoit pas la zone 2 (pas de chaîne)
    const scope = effectiveScope({ kind: 'cvr', ids: [U(7)] }, [del({}), del({ id: U(201), absent_zone_id: U(3), substitute_zone_id: U(7) })], ZONES, TODAY);
    expect(scope).toEqual({ kind: 'cvr', ids: [U(7), U(3)] });
  });
  it('création : zones de même niveau (CVR ou DR), distinctes, dates cohérentes, jamais dans le passé', () => {
    const base = { absentZoneId: U(2), substituteZoneId: U(3), startsOn: '2026-10-26', endsOn: '2026-11-06' };
    expect(delegationIssue(base, [], ZONES, TODAY)).toBeNull();
    expect(delegationIssue({ ...base, substituteZoneId: U(2) }, [], ZONES, TODAY)).toBe('same_zone');
    expect(delegationIssue({ ...base, substituteZoneId: U(7) }, [], ZONES, TODAY)).toBeNull(); // un autre DR est admis, hypothèse
    expect(delegationIssue({ ...base, substituteZoneId: U(1) }, [], ZONES, TODAY)).toBe('invalid_zone'); // DR pour un CVR
    expect(delegationIssue({ ...base, absentZoneId: U(4), substituteZoneId: U(5) }, [], ZONES, TODAY)).toBe('invalid_zone'); // un secteur n'a pas de suppléant
    expect(delegationIssue({ ...base, startsOn: '2026-10-22' }, [], ZONES, TODAY)).toBe('invalid_dates');
    expect(delegationIssue({ ...base, endsOn: '2026-10-25' }, [], ZONES, TODAY)).toBe('invalid_dates');
    expect(delegationIssue({ ...base, endsOn: '2026-13-40' }, [], ZONES, TODAY)).toBe('invalid_dates');
    expect(delegationIssue({ ...base, endsOn: '2028-01-01' }, [], ZONES, TODAY)).toBe('invalid_dates');
  });
  it('un seul suppléant à la fois par absent', () => {
    const base = { absentZoneId: U(2), substituteZoneId: U(7), startsOn: '2026-10-28', endsOn: '2026-11-03' };
    expect(delegationIssue(base, [del({})], ZONES, TODAY)).toBe('overlap'); // 20/10 au 30/10
    expect(delegationIssue({ ...base, startsOn: '2026-10-31', endsOn: '2026-11-06' }, [del({})], ZONES, TODAY)).toBeNull();
    expect(delegationIssue(base, [del({ stopped_on: '2026-10-22' })], ZONES, TODAY)).toBeNull(); // arrêtée : ne compte plus
  });
  it('pas de chaîne : un suppléant déjà absent, ou un absent déjà suppléant, sur la même période', () => {
    const covers = del({ id: U(210), absent_zone_id: U(7), substitute_zone_id: U(3), starts_on: '2026-10-26', ends_on: '2026-11-06' });
    expect(delegationIssue({ absentZoneId: U(2), substituteZoneId: U(7), startsOn: '2026-10-27', endsOn: '2026-10-29' }, [covers], ZONES, TODAY)).toBe('chain'); // 7 est absent
    expect(delegationIssue({ absentZoneId: U(3), substituteZoneId: U(2), startsOn: '2026-10-27', endsOn: '2026-10-29' }, [covers], ZONES, TODAY)).toBe('chain'); // 3 est suppléant
    expect(delegationIssue({ absentZoneId: U(3), substituteZoneId: U(2), startsOn: '2026-11-09', endsOn: '2026-11-13' }, [covers], ZONES, TODAY)).toBeNull();
  });
});
