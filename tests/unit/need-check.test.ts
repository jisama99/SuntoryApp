import { describe, expect, it } from 'vitest';
import { checkNeed, decideSave, missingFields } from '@/domain/need-check';
import { env, input, need, period, rawPeriod } from './needs-util';

const ID = { id: null, need_code: null, source_record_id: null };

describe('besoin incomplet = brouillon (W9)', () => {
  it('liste les champs obligatoires manquants', () => {
    expect(missingFields(input())).toEqual([]);
    const empty = input({ dispositif: null, campaign_code: null, position_label: null, weekly_hours: null, priority: null, periods: [], days: [], hours_slot: null });
    expect(missingFields(empty)).toEqual(['dispositif', 'campaign_code', 'position_label', 'weekly_hours', 'priority', 'period', 'days', 'hours_slot']);
  });
  it('une date de début sans fin reste incomplète', () => {
    expect(missingFields(input({ periods: [rawPeriod(1, { start_date: '2026-11-02' })] }))).toEqual(['period']);
  });
  it('une semaine seule suffit à définir la période', () => {
    expect(missingFields(input({ periods: [rawPeriod(1, { start_week: '2026-S45' })] }))).toEqual([]);
  });
  it('un besoin sans période devient un brouillon avec W9 et n\'est pas complet', () => {
    const c = checkNeed(input({ periods: [] }), env(), [], ID);
    expect(c.complete).toBe(false);
    expect(c.findings.some((f) => f.rule === 'W9' && f.gravity === 'blocking')).toBe(true);
    expect(decideSave(c, false)).toBe('draft');
  });
  it('un besoin sans heures est un brouillon même avec des dates', () => {
    const c = checkNeed(input({ weekly_hours: null }), env(), [], ID);
    expect(c.complete).toBe(false);
    expect(decideSave(c, false)).toBe('draft');
  });
});

describe('politique d\'enregistrement', () => {
  it('besoin complet sans constat : soumis', () => {
    expect(decideSave(checkNeed(input(), env(), [], ID), false)).toBe('submit');
  });
  it('constat bloquant autre que W9 : refus, même confirmé', () => {
    const c = checkNeed(input({ periods: [rawPeriod(1, { start_date: '2026-11-10', end_date: '2026-11-03' })] }), env(), [], ID);
    expect(decideSave(c, false)).toBe('refuse');
    expect(decideSave(c, true)).toBe('refuse');
  });
  it('alerte : confirmation demandée, puis soumission', () => {
    const c = checkNeed(input({ periods: [period(1, '2026-11-08', '2026-11-14')] }), env(), [], ID);
    expect(c.findings.some((f) => f.rule === 'W16')).toBe(true);
    expect(decideSave(c, false)).toBe('confirm');
    expect(decideSave(c, true)).toBe('submit');
  });
  it('information seule : aucune confirmation', () => {
    const c = checkNeed(input({ periods: [period(1, '2026-11-02', '2026-11-08')] }), env(), [need({ periods: [period(1, '2026-11-09', '2026-11-15')], weekly_hours: 20 })], ID);
    expect(c.findings.map((f) => f.rule)).toEqual(['D4']);
    expect(decideSave(c, false)).toBe('submit');
  });
  it('doublon exact : refus avec renvoi vers le besoin existant', () => {
    const e = need();
    const c = checkNeed(input(), env(), [e], ID);
    expect(decideSave(c, true)).toBe('refuse');
    expect(c.findings.find((f) => f.rule === 'D1')?.relatedNeedId).toBe(e.id);
  });
  it('une règle désactivée ne bloque plus', () => {
    const e = need();
    const lenient = env({ config: { gravities: { ...env().config.gravities, D1: 'off' } } });
    expect(checkNeed(input(), lenient, [e], ID).findings.some((f) => f.rule === 'D1')).toBe(false);
  });
});
