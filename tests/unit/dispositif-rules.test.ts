import { describe, expect, it } from 'vitest';
import { slotMinutes, applyDispositifParams } from '@/domain/dispositif-params';
import { checkNeed, decideSave } from '@/domain/need-check';
import { evaluateDispositifRules } from '@/domain/dispositif-rules';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import type { RuleId } from '@/domain/rules';
import type { RuleInput } from '@/domain/week-rules';
import { a2b, params, paramsMap, reopening, SECOND, settings } from './a2b-util';
import { env as baseEnv, input, period } from './needs-util';

const ID = { id: null, need_code: null, source_record_id: null };

function envWith(over: Parameters<typeof a2b>[0] = {}, today = '2026-10-23') {
  return { ...baseEnv({ today }), a2b: a2b(over) };
}
const rules = (i: RuleInput, e = envWith()): RuleId[] => [...new Set(evaluateDispositifRules(i, e).map((f) => f.rule))];
const second = (over: Partial<RuleInput> = {}): RuleInput =>
  input({ dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04', periods: [period(1, '2027-03-01', '2027-03-07')], ...over });

describe('créneaux horaires', () => {
  it('durée en minutes ou null si illisible', () => {
    expect(slotMinutes('09:00-09:30')).toBe(30);
    expect(slotMinutes('08:00-12:00')).toBe(240);
    expect(slotMinutes('9:15 - 10:00')).toBe(45);
    expect(slotMinutes('matin')).toBeNull();
    expect(slotMinutes('12:00-08:00')).toBeNull();
    expect(slotMinutes('25:00-26:00')).toBeNull();
    expect(slotMinutes(null)).toBeNull();
  });
});

describe('P1 à P6, une fois chacune (F-30.11, doc 28 §2.3)', () => {
  it('P1 : durée inférieure à la durée minimale du dispositif', () => {
    expect(rules(second({ hours_slot: '09:00-09:30' }))).toContain('P1');
    const f = evaluateDispositifRules(second({ hours_slot: '09:00-09:30' }), envWith()).find((x) => x.rule === 'P1')!;
    expect(f.params).toEqual({ min: 45, actual: 30 });
    expect(rules(second({ hours_slot: '09:00-09:45' }))).not.toContain('P1'); // égale au minimum
    expect(rules(second({ hours_slot: '08:00-12:00' }))).not.toContain('P1');
    expect(rules(second({ hours_slot: 'matin' }))).not.toContain('P1'); // créneau illisible : la règle se tait
    expect(rules(input({ hours_slot: '09:00-09:10' }))).not.toContain('P1'); // dispositif sans durée minimale
  });

  it('P1 : la valeur vient du paramètre, jamais du code', () => {
    const e = envWith({ params: paramsMap(params('second_placement', { ...SECOND, min_minutes: 20 })) });
    expect(rules(second({ hours_slot: '09:00-09:30' }), e)).not.toContain('P1');
    const e2 = envWith({ params: paramsMap(params('second_placement', { ...SECOND, min_minutes: 90 })) });
    expect(rules(second({ hours_slot: '09:00-10:00' }), e2)).toContain('P1');
  });

  it('P2 : campagne rattachée à plus d\'un dispositif', () => {
    const e = envWith({ campaignDispositifs: { 'CMP-DEMO-04': ['second_placement', 'hourly_merch'] } });
    expect(rules(second(), e)).toContain('P2');
    expect(rules(second(), envWith())).not.toContain('P2');
    expect(rules(second({ campaign_code: null }), e)).not.toContain('P2');
  });

  it('P3 : saisie hors de la fenêtre du dispositif, après son échéance', () => {
    // Fenêtre de novembre 2026 : avant-dernière semaine d'octobre (12 au 18/10), clôture le vendredi 16/10.
    const nov = second({ periods: [period(1, '2026-11-09', '2026-11-15')] });
    const got = evaluateDispositifRules(nov, envWith()).find((x) => x.rule === 'P3')!;
    expect(got.params).toMatchObject({ month: '2026-11', deadline: '2026-10-16' });
    expect(rules(second({ periods: [period(1, '2026-12-07', '2026-12-13')] }))).not.toContain('P3'); // décembre : clôture le 20/11
  });

  it('P3 : avant l\'ouverture de la fenêtre, la saisie anticipée reste permise', () => {
    expect(rules(second({ periods: [period(1, '2027-03-01', '2027-03-07')] }))).toEqual([]);
  });

  it('P4 : modification déposée après le délai du dispositif, effet le mois suivant', () => {
    // Décembre 2026 : délai de 10 jours calendaires, 21/11 recule au 20/11. Au 23/11, la modification est tardive.
    const dec = second({ periods: [period(1, '2026-12-07', '2026-12-13')] });
    const late = envWith({ writeKind: 'change' }, '2026-11-23');
    const f = evaluateDispositifRules(dec, late).find((x) => x.rule === 'P4')!;
    expect(f.params).toMatchObject({ month: '2026-12', deadline: '2026-11-20', effect: 'next_month' });
    expect(f.defer).toEqual({ toMonth: '2027-01' });
    expect(rules(dec, envWith({ writeKind: 'change' }, '2026-11-20'))).not.toContain('P4');
  });

  it('P5 : forfait kilométrique applicable mais non renseigné, non bloquante', () => {
    const e = envWith({ params: paramsMap(params('second_placement', { ...SECOND, km_flat_rate: { applicable: true, amount_eur_ht: null } })) });
    expect(rules(second(), e)).toContain('P5');
    const check = checkNeed(second(), e, [], ID);
    expect(check.findings.find((f) => f.rule === 'P5')?.gravity).toBe('info');
    expect(decideSave(check, false)).not.toBe('refuse');
    expect(rules(second(), envWith())).not.toContain('P5'); // valeur renseignée
    expect(rules(input(), e)).not.toContain('P5'); // forfait non applicable hors second placement
  });

  it('P6 : saisie par un rôle absent de entry_roles', () => {
    const only = envWith({ params: paramsMap(params('second_placement', { ...SECOND, entry_roles: ['agency_admin'] })) });
    expect(rules(second(), only)).toContain('P6');
    expect(rules(second(), { ...only, a2b: { ...only.a2b, actor: 'agency_admin' } })).not.toContain('P6');
    expect(rules(second(), envWith())).not.toContain('P6'); // null : tous les rôles de saisie
  });

  it('chaque règle P est bloquante sauf P5, et refuse l\'enregistrement', () => {
    expect(DEFAULT_RULE_CONFIG.gravities).toMatchObject({ P1: 'blocking', P2: 'blocking', P3: 'blocking', P4: 'blocking', P5: 'info', P6: 'blocking', E1: 'blocking', E2: 'blocking' });
    const check = checkNeed(second({ hours_slot: '09:00-09:30' }), envWith(), [], ID);
    expect(decideSave(check, true)).toBe('refuse');
  });
});

describe('E1 et E2 : échéance du calendrier global dépassée (D78)', () => {
  it('E1 : novembre est clos pour la saisie des besoins au 23/10 (échéance 19/10)', () => {
    const nov = input({ periods: [period(1, '2026-11-09', '2026-11-15')] });
    const f = evaluateDispositifRules(nov, envWith()).find((x) => x.rule === 'E1')!;
    expect(f.params).toMatchObject({ month: '2026-11', deadline: '2026-10-19', next: '2026-12' });
    expect(f.defer).toEqual({ toMonth: '2026-12' });
  });

  it('E1 : décembre est ouvert jusqu\'au 17/11', () => {
    const dec = input({ periods: [period(1, '2026-12-07', '2026-12-13')] });
    expect(rules(dec, envWith({}, '2026-11-17'))).not.toContain('E1');
    expect(rules(dec, envWith({}, '2026-11-18'))).toContain('E1');
  });

  it('E2 : un changement de novembre reste possible jusqu\'à la date fixe du 30/10', () => {
    const fixed = settings({
      entries: [{ month: '2026-11', type: 'change_request', preset: null, fixed_date: '2026-10-30', author_profile: 'agency_admin', effective_from: '2026-10-23', is_demo: true }],
    });
    const nov = input({ periods: [period(1, '2026-11-09', '2026-11-15')] });
    const change = (today: string) => envWith({ writeKind: 'change', settings: fixed }, today);
    expect(rules(nov, change('2026-10-30'))).not.toContain('E2');
    expect(rules(nov, change('2026-10-31'))).toContain('E2');
  });

  it('une réouverture active lève le blocage, sa date de fin le rétablit', () => {
    const nov = input({ periods: [period(1, '2026-11-09', '2026-11-15')] });
    const r = [reopening({ expires_on: '2026-11-06' })];
    expect(rules(nov, envWith({ reopenings: r }))).not.toContain('E1');
    expect(rules(nov, envWith({ reopenings: r }, '2026-11-09'))).toContain('E1');
  });

  it('le report est jugé sur le mois suivant : accepté s\'il est ouvert, refusé sinon', () => {
    const nov = input({ periods: [period(1, '2026-11-09', '2026-11-15')] });
    expect(rules(nov, envWith({ deferredFrom: '2026-11' }))).toEqual([]);
    const f = evaluateDispositifRules(nov, envWith({ deferredFrom: '2026-11' }, '2026-11-18')).find((x) => x.rule === 'E1')!;
    expect(f.params).toMatchObject({ month: '2026-12' });
    expect(f.defer).toBeUndefined();
  });

  it('aucun mois cible sans date : un brouillon sans période n\'est pas bloqué par l\'échéance', () => {
    expect(rules(input({ periods: [] }))).toEqual([]);
  });

  it('sans contexte A2b, le moteur se comporte comme en A2a', () => {
    expect(evaluateDispositifRules(input({ periods: [period(1, '2026-11-09', '2026-11-15')] }), baseEnv())).toEqual([]);
  });
});

describe('paramètres de dispositif appliqués aux règles W11, W16 et J3 (D145)', () => {
  it('une valeur nulle laisse la valeur globale', () => {
    expect(applyDispositifParams(DEFAULT_RULE_CONFIG, params('permanent'))).toEqual(DEFAULT_RULE_CONFIG);
    expect(applyDispositifParams(DEFAULT_RULE_CONFIG, undefined)).toBe(DEFAULT_RULE_CONFIG);
  });
  it('le paramètre du dispositif l\'emporte', () => {
    const cfg = applyDispositifParams(DEFAULT_RULE_CONFIG, params('permanent', {
      horizon_weeks: 26, non_working_days: { weekdays: [6, 7], holidays: false }, days_allowed: [1, 2, 3, 4, 5, 6, 7],
    }));
    expect(cfg.horizonWeeks).toBe(26);
    expect(cfg.excludedWeekdays).toEqual([6, 7]);
    expect(cfg.excludeHolidays).toBe(false);
    expect(cfg.daysAllowed).toContain(7);
  });
});
