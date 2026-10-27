import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import zonesJson from '@/data/fixtures/zones.json';
import type { Delegation } from '@/data/schemas';
import { ZoneSchema } from '@/data/schemas';
import { blankRecruitment, nextStep, DEFAULT_PIPELINE_PARAMS } from '@/domain/pipeline';
import type { Scope } from '@/domain/types';
import {
  authorityFor, canResubmit, cvrZoneOf, delegationIssue, delegationStatus, drZoneOf, effectiveScope, NO_ENVELOPE_RULE, validationIssue,
} from '@/domain/validation';
import { calendarOf } from '@/domain/deadlines';
import settingsJson from '@/data/fixtures/deadline-settings.json';
import { DeadlineSettingsSchema } from '@/data/schemas';

const zones = z.array(ZoneSchema).parse(zonesJson);
const byCode = (code: string) => zones.find((z) => z.code === code)!;
const zv = byCode('CVR-ZV01');
const wy = byCode('CVR-WY02');
const gp = byCode('CVR-GP03');
const nm = byCode('CVR-NM04');
const alpha = byCode('DR-ALPHA');
const beta = byCode('DR-BETA');
const sectorOfZv = zones.find((z) => z.kind === 'rs' && z.parent_id === zv.id)!;
const TODAY = '2026-10-23';

const deleg = (over: Partial<Delegation> = {}): Delegation => ({
  id: crypto.randomUUID(), delegator_zone_id: zv.id, substitute_zone_id: wy.id, start_date: '2026-10-23', end_date: '2026-10-30',
  created_by: 'agency_admin', created_on: TODAY, revoked_on: null, revoked_by: null, is_demo: true, ...over,
});
const cvrScope = (...ids: string[]): Scope => ({ kind: 'cvr', ids });

describe('chaîne : CVR et DR d\'un secteur (D45)', () => {
  it('le secteur remonte à son CVR puis à son DR, par la sectorisation', () => {
    expect(cvrZoneOf(zones, sectorOfZv.id)?.id).toBe(zv.id);
    expect(drZoneOf(zones, sectorOfZv.id)?.id).toBe(alpha.id);
  });
});

describe('état d\'une délégation : dates incluses, révocation prioritaire', () => {
  it.each([
    ['2026-10-22', 'planned'], ['2026-10-23', 'active'], ['2026-10-30', 'active'], ['2026-10-31', 'ended'],
  ] as const)('le %s : %s', (today, status) => {
    expect(delegationStatus({ start_date: '2026-10-23', end_date: '2026-10-30', revoked_on: null }, today)).toBe(status);
  });
  it('une délégation révoquée ne redevient jamais active, même sur ses dates', () => {
    expect(delegationStatus({ start_date: '2026-10-23', end_date: '2026-10-30', revoked_on: '2026-10-24' }, '2026-10-25')).toBe('revoked');
  });
});

describe('périmètre effectif d\'un suppléant : jamais au delà du délégant', () => {
  const d = deleg();
  it('en cours : son périmètre plus celui du délégant, rien d\'autre', () => {
    expect(effectiveScope(cvrScope(wy.id), [d], '2026-10-25')).toEqual(cvrScope(wy.id, zv.id));
  });
  it('avant le début, après la fin ou révoquée : périmètre inchangé', () => {
    const own = cvrScope(wy.id);
    expect(effectiveScope(own, [d], '2026-10-22')).toBe(own);
    expect(effectiveScope(own, [d], '2026-10-31')).toBe(own);
    expect(effectiveScope(own, [{ ...d, revoked_on: '2026-10-24' }], '2026-10-25')).toBe(own);
  });
  it('pas de transmission en chaîne : la délégation reçue ne se redélègue pas', () => {
    // WY02 est suppléant de ZV01 ; GP03 est suppléant de WY02. GP03 ne gagne pas ZV01.
    const chain = [d, deleg({ delegator_zone_id: wy.id, substitute_zone_id: gp.id })];
    expect(effectiveScope(cvrScope(gp.id), chain, '2026-10-25')).toEqual(cvrScope(gp.id, wy.id));
  });
  it('un profil sans zone de CVR ou de DR n\'est jamais élargi', () => {
    expect(effectiveScope({ kind: 'all' }, [d], '2026-10-25')).toEqual({ kind: 'all' });
    expect(effectiveScope({ kind: 'rs', ids: [sectorOfZv.id] }, [d], '2026-10-25')).toEqual({ kind: 'rs', ids: [sectorOfZv.id] });
  });
});

describe('création d\'une délégation : contrôles', () => {
  const base = { delegator_zone_id: zv.id, substitute_zone_id: wy.id, start_date: '2026-10-23', end_date: '2026-10-30' };
  it('cas valide', () => expect(delegationIssue(base, zones, [], TODAY)).toBeNull());
  it('même zone, niveaux différents, zone inconnue', () => {
    expect(delegationIssue({ ...base, substitute_zone_id: zv.id }, zones, [], TODAY)).toBe('same_zone');
    expect(delegationIssue({ ...base, substitute_zone_id: alpha.id }, zones, [], TODAY)).toBe('kind_mismatch');
    expect(delegationIssue({ ...base, substitute_zone_id: sectorOfZv.id }, zones, [], TODAY)).toBe('kind_mismatch');
    expect(delegationIssue({ ...base, substitute_zone_id: crypto.randomUUID() }, zones, [], TODAY)).toBe('invalid');
  });
  it('un DR peut avoir un DR suppléant', () => {
    expect(delegationIssue({ ...base, delegator_zone_id: alpha.id, substitute_zone_id: beta.id }, zones, [], TODAY)).toBeNull();
  });
  it('période : fin avant début, début dans le passé (pas de délégation rétroactive)', () => {
    expect(delegationIssue({ ...base, end_date: '2026-10-22' }, zones, [], TODAY)).toBe('period');
    expect(delegationIssue({ ...base, start_date: '2026-10-22', end_date: '2026-10-30' }, zones, [], TODAY)).toBe('period');
  });
  it('un seul suppléant à la fois par délégant', () => {
    expect(delegationIssue({ ...base, substitute_zone_id: gp.id, start_date: '2026-10-28', end_date: '2026-11-05' }, zones, [deleg()], TODAY)).toBe('overlap');
    expect(delegationIssue({ ...base, substitute_zone_id: gp.id, start_date: '2026-10-31', end_date: '2026-11-05' }, zones, [deleg()], TODAY)).toBeNull();
  });
  it('une délégation révoquée ou terminée ne bloque pas', () => {
    expect(delegationIssue(base, zones, [deleg({ revoked_on: '2026-10-23' })], TODAY)).toBeNull();
    expect(delegationIssue({ ...base, start_date: '2026-11-10', end_date: '2026-11-12' }, zones, [deleg({ end_date: '2026-10-25' })], '2026-10-26')).toBeNull();
  });
  it('pas de chaîne : un délégant n\'est pas suppléant, ni un suppléant délégant, sur une période qui se recoupe', () => {
    // WY02 est déjà suppléant de ZV01 : il ne peut pas déléguer à GP03.
    expect(delegationIssue({ delegator_zone_id: wy.id, substitute_zone_id: gp.id, start_date: '2026-10-24', end_date: '2026-10-29' }, zones, [deleg()], TODAY)).toBe('chain');
    // ZV01 est déjà délégant : il ne peut pas être suppléant de NM04... niveau CVR, même DR ou non, la règle reste.
    expect(delegationIssue({ delegator_zone_id: nm.id, substitute_zone_id: zv.id, start_date: '2026-10-24', end_date: '2026-10-29' }, zones, [deleg()], TODAY)).toBe('chain');
  });
});

describe('autorité de validation', () => {
  const ds: Delegation[] = [];
  const as = (profile: Parameters<typeof authorityFor>[0], scope: Scope, state: Parameters<typeof authorityFor>[3], delegations = ds, today = '2026-10-25') =>
    authorityFor(profile, scope, sectorOfZv.id, state, zones, delegations, today);

  it('« à valider » : le CVR du besoin, personne d\'autre', () => {
    expect(as('cvr_client', cvrScope(zv.id), 'to_validate')).toEqual({ level: 'cvr', zoneId: zv.id, byZoneId: null, delegationId: null });
    expect(as('cvr_client', cvrScope(wy.id), 'to_validate')).toBeNull();
    expect(as('dr_client', { kind: 'dr', ids: [alpha.id] }, 'to_validate')).toBeNull();
    expect(as('agency_admin', { kind: 'all' }, 'to_validate')).toBeNull();
    expect(as('rs', { kind: 'rs', ids: [sectorOfZv.id] }, 'to_validate')).toBeNull();
  });
  it('« escaladé » : le DR du besoin et la direction, pas son CVR', () => {
    expect(as('dr_client', { kind: 'dr', ids: [alpha.id] }, 'escalated')?.level).toBe('dr');
    expect(as('dr_client', { kind: 'dr', ids: [beta.id] }, 'escalated')).toBeNull();
    expect(as('direction_client', { kind: 'all' }, 'escalated')?.level).toBe('dr');
    expect(as('cvr_client', cvrScope(zv.id), 'escalated')).toBeNull();
  });
  it('« validé » et « refusé » n\'ouvrent aucune action', () => {
    expect(as('cvr_client', cvrScope(zv.id), 'validated')).toBeNull();
    expect(as('cvr_client', cvrScope(zv.id), 'refused')).toBeNull();
  });
  it('le suppléant exerce l\'autorité du délégant, tracée, pendant la délégation seulement', () => {
    const d = deleg();
    expect(as('cvr_client', cvrScope(wy.id), 'to_validate', [d])).toEqual({ level: 'cvr', zoneId: zv.id, byZoneId: wy.id, delegationId: d.id });
    expect(as('cvr_client', cvrScope(wy.id), 'to_validate', [d], '2026-10-31')).toBeNull();
    expect(as('cvr_client', cvrScope(gp.id), 'to_validate', [d])).toBeNull();
  });
});

describe('contrôle d\'une demande de validation', () => {
  const need = { sector_id: sectorOfZv.id };
  it('valider n\'exige rien ; refuser et escalader exigent un motif', () => {
    expect(validationIssue({ outcome: 'validate' }, 'cvr', need, zones)).toBeNull();
    expect(validationIssue({ outcome: 'refuse' }, 'cvr', need, zones)).toBe('motive_required');
    expect(validationIssue({ outcome: 'refuse', motive: '   ' }, 'cvr', need, zones)).toBe('motive_required');
    expect(validationIssue({ outcome: 'refuse', motive: 'Trop d\'heures' }, 'dr', need, zones)).toBeNull();
    expect(validationIssue({ outcome: 'escalate', reason: 'out_of_perimeter' }, 'cvr', need, zones)).toBe('motive_required');
  });
  it('l\'escalade n\'existe qu\'au niveau du CVR, avec un cas connu', () => {
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'out_of_perimeter' }, 'dr', need, zones)).toBe('invalid');
    expect(validationIssue({ outcome: 'escalate', motive: 'x' }, 'cvr', need, zones)).toBe('invalid_reason');
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'unknown' as never }, 'cvr', need, zones)).toBe('invalid_reason');
  });
  it('un arbitrage désigne un autre CVR sous le même DR ; les autres cas n\'en désignent pas', () => {
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'arbitration', otherZoneId: wy.id }, 'cvr', need, zones)).toBeNull();
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'arbitration' }, 'cvr', need, zones)).toBe('invalid_other_zone');
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'arbitration', otherZoneId: zv.id }, 'cvr', need, zones)).toBe('invalid_other_zone');
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'arbitration', otherZoneId: nm.id }, 'cvr', need, zones)).toBe('invalid_other_zone');
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'arbitration', otherZoneId: alpha.id }, 'cvr', need, zones)).toBe('invalid_other_zone');
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'out_of_envelope', otherZoneId: wy.id }, 'cvr', need, zones)).toBe('invalid_other_zone');
    expect(validationIssue({ outcome: 'escalate', motive: 'x', reason: 'out_of_envelope' }, 'cvr', need, zones)).toBeNull();
  });
  it('un motif de plus de 280 caractères est refusé', () => {
    expect(validationIssue({ outcome: 'validate', motive: 'x'.repeat(281) }, 'cvr', need, zones)).toBe('invalid');
  });
});

describe('nouvelle soumission', () => {
  it('seul un besoin refusé se soumet de nouveau', () => {
    for (const v of ['to_validate', 'validated', 'escalated'] as const) expect(canResubmit({ validation: v })).toBe(false);
    expect(canResubmit({ validation: 'refused' })).toBe(true);
  });
});

describe('point d\'entrée « hors enveloppe » (D43 ouverte)', () => {
  it('sans règle branchée, le résultat est « non évalué », jamais « dans » ni « hors » l\'enveloppe', () => {
    expect(NO_ENVELOPE_RULE({ id: crypto.randomUUID(), sector_id: sectorOfZv.id, weekly_hours: 99 })).toBe('not_evaluated');
  });
});

describe('qui doit agir : chaîne managériale avant la qualification', () => {
  const cal = calendarOf(DeadlineSettingsSchema.parse(settingsJson));
  const step = (validation: 'to_validate' | 'validated' | 'refused' | 'escalated', over: Partial<ReturnType<typeof blankRecruitment>> = {}, today = '2026-10-23') =>
    nextStep(
      { recruitment: { ...blankRecruitment('n'), validation, validation_on: '2026-10-21', ...over }, proposals: [], decisions: [], needState: 'submitted', submittedOn: '2026-10-21', requestedStart: null },
      today, DEFAULT_PIPELINE_PARAMS, cal,
    );
  it('à valider : le CVR, échéance en jours ouvrés depuis l\'entrée dans l\'état, urgence et retard', () => {
    expect(step('to_validate', {}, '2026-10-22')).toMatchObject({ actor: 'validator', action: 'validate_need', due: '2026-10-23', urgency: 'urgent', lateDays: 0 });
    expect(step('to_validate', {}, '2026-10-27')).toMatchObject({ actor: 'validator', action: 'validate_need', urgency: 'overdue', lateDays: 2 });
  });
  it('escaladé : le DR, avec son propre délai', () => {
    expect(step('escalated', { validation_on: '2026-10-22' })).toMatchObject({ actor: 'arbiter', action: 'arbitrate_need', due: '2026-10-27' });
  });
  it('refusé : le RS soumet de nouveau, sans échéance', () => {
    expect(step('refused')).toMatchObject({ actor: 'rs', action: 'resubmit_need', due: null, urgency: null });
  });
  it('validé : la qualification de l\'agence reprend', () => {
    expect(step('validated')).toMatchObject({ actor: 'agency', action: 'qualify' });
  });
  it('un besoin rejeté ou stoppé sort du circuit, quel que soit l\'état de validation', () => {
    expect(step('to_validate', { intake: 'rejected' })).toMatchObject({ actor: 'none', action: 'none' });
  });
});
