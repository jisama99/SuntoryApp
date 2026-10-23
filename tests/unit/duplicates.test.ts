import { describe, expect, it } from 'vitest';
import type { Period } from '@/data/schemas';
import { findDuplicates } from '@/domain/duplicates';
import type { DupCandidate } from '@/domain/duplicates';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import { resolvePeriod } from '@/domain/week-rules';
import { need, period, SECTOR_A, SECTOR_B } from './needs-util';

const existing = (over = {}) => need({ periods: [period(1, '2026-11-02', '2026-11-08')], ...over });

function candidate(over: Partial<Omit<DupCandidate, 'periods'>> & { periods?: Period[] } = {}): DupCandidate {
  const { periods, ...rest } = over;
  return {
    id: null, need_code: null, source_record_id: null,
    sector_id: SECTOR_A, dispositif: 'permanent', position_label: 'Poste 1', weekly_hours: 20, hours_slot: '09:00-17:00',
    store_codes: [], periods: (periods ?? [period(1, '2026-11-02', '2026-11-08')]).map(resolvePeriod),
    ...rest,
  };
}
const rulesOf = (c: DupCandidate, e = [existing()]) => findDuplicates(c, e).map((f) => f.rule);

describe('règles de doublon, table par table (V0.4, C.DUPS, position D22 / Q7)', () => {
  it('D1 : mêmes secteur, type, dates et heures', () => {
    expect(rulesOf(candidate())).toContain('D1');
  });
  it('D1 ne se déclenche pas si les heures diffèrent : c\'est une inclusion (D3)', () => {
    const r = rulesOf(candidate({ weekly_hours: 14 }));
    expect(r).not.toContain('D1');
    expect(r).toContain('D3');
  });
  it('D1 ne se déclenche pas pour un autre secteur ou un autre type', () => {
    expect(rulesOf(candidate({ sector_id: SECTOR_B }))).not.toContain('D1');
    expect(rulesOf(candidate({ dispositif: 'seasonal' }))).not.toContain('D1');
  });

  it('D2 : chevauchement partiel', () => {
    const r = rulesOf(candidate({ periods: [period(1, '2026-11-05', '2026-11-15')] }));
    expect(r).toContain('D2');
    expect(r).not.toContain('D3');
  });
  it('D2 ne se déclenche pas sans chevauchement', () => {
    expect(rulesOf(candidate({ periods: [period(1, '2026-11-20', '2026-11-26')] }))).not.toContain('D2');
  });

  it('D3 : période entièrement contenue, dans un sens comme dans l\'autre', () => {
    expect(rulesOf(candidate({ periods: [period(1, '2026-11-03', '2026-11-05')] }))).toContain('D3');
    expect(rulesOf(candidate({ periods: [period(1, '2026-10-26', '2026-11-15')] }))).toContain('D3');
  });
  it('D3 ne se déclenche pas pour un simple chevauchement', () => {
    expect(rulesOf(candidate({ periods: [period(1, '2026-11-05', '2026-11-15')] }))).not.toContain('D3');
  });

  it('D4 : périodes contiguës, avant comme après', () => {
    expect(rulesOf(candidate({ periods: [period(1, '2026-11-09', '2026-11-15')] }))).toContain('D4');
    expect(rulesOf(candidate({ periods: [period(1, '2026-10-26', '2026-11-01')] }))).toContain('D4');
  });
  it('D4 ne se déclenche pas avec un jour d\'écart', () => {
    expect(rulesOf(candidate({ periods: [period(1, '2026-11-10', '2026-11-15')] }))).not.toContain('D4');
  });

  it('D5 : même magasin dans deux secteurs sur la même période', () => {
    const e = existing({ store_codes: ['MAG-DEMO-014'], sector_id: SECTOR_B });
    expect(rulesOf(candidate({ store_codes: ['MAG-DEMO-014'] }), [e])).toContain('D5');
  });
  it('D5 ne se déclenche pas sans chevauchement, sans magasin commun ou dans le même secteur', () => {
    const other = existing({ store_codes: ['MAG-DEMO-014'], sector_id: SECTOR_B });
    expect(rulesOf(candidate({ store_codes: ['MAG-DEMO-014'], periods: [period(1, '2026-12-07', '2026-12-13')] }), [other])).not.toContain('D5');
    expect(rulesOf(candidate({ store_codes: ['MAG-DEMO-015'] }), [other])).not.toContain('D5');
    expect(rulesOf(candidate({ store_codes: ['MAG-DEMO-014'] }), [existing({ store_codes: ['MAG-DEMO-014'] })])).not.toContain('D5');
  });

  it('D6 : même intitulé sur des périodes disjointes', () => {
    expect(rulesOf(candidate({ periods: [period(1, '2026-12-07', '2026-12-13')] }))).toContain('D6');
  });
  it('D6 ne se déclenche pas si l\'intitulé diffère, si les périodes se touchent ou se recouvrent', () => {
    expect(rulesOf(candidate({ position_label: 'Poste 2', periods: [period(1, '2026-12-07', '2026-12-13')] }))).not.toContain('D6');
    expect(rulesOf(candidate({ periods: [period(1, '2026-11-09', '2026-11-15')] }))).not.toContain('D6');
    expect(rulesOf(candidate({ periods: [period(1, '2026-11-05', '2026-11-15')] }))).not.toContain('D6');
  });

  it('D7 : ligne déjà présente, par code de besoin ou par identifiant de source', () => {
    expect(rulesOf(candidate({ need_code: 'BES-DEMO-900', sector_id: SECTOR_B }))).toContain('D7');
    const withSource = existing({ source_record_id: 'SRC-1' });
    expect(rulesOf(candidate({ source_record_id: 'SRC-1' }), [withSource])).toContain('D7');
  });
  it('D7 ne se déclenche pas pour un autre code ou pour le besoin lui-même', () => {
    expect(rulesOf(candidate({ need_code: 'BES-DEMO-901' }))).not.toContain('D7');
    const e = existing();
    expect(findDuplicates(candidate({ id: e.id, need_code: e.need_code }), [e])).toEqual([]);
  });

  it('W22 : même secteur, même type, même semaine sans chevauchement de jours', () => {
    const mon = existing({ periods: [period(1, '2026-11-02', '2026-11-03')], position_label: 'Poste 9' });
    const r = rulesOf(candidate({ position_label: 'Poste 1', periods: [period(1, '2026-11-05', '2026-11-06')] }), [mon]);
    expect(r).toContain('W22');
  });
  it('W22 se tait devant D1, D2 et D3 et pour un autre secteur', () => {
    expect(rulesOf(candidate())).not.toContain('W22');
    expect(rulesOf(candidate({ sector_id: SECTOR_B }))).not.toContain('W22');
  });
});

describe('constats de doublon', () => {
  it('renvoient vers le besoin existant', () => {
    const e = existing();
    const f = findDuplicates(candidate(), [e]);
    expect(f.every((x) => x.relatedNeedId === e.id)).toBe(true);
  });
  it('gravités par défaut : D1 et D7 bloquants, D2, D3, D5 alerte, D4 et D6 information', () => {
    const g = DEFAULT_RULE_CONFIG.gravities;
    expect([g.D1, g.D7]).toEqual(['blocking', 'blocking']);
    expect([g.D2, g.D3, g.D5]).toEqual(['alert', 'alert', 'alert']);
    expect([g.D4, g.D6]).toEqual(['info', 'info']);
  });
  it('un brouillon sans période ne produit aucun constat de période', () => {
    const draft = need({ periods: [], need_state: 'draft' });
    expect(rulesOf(candidate(), [draft])).toEqual([]);
  });
  it('2026-S53 puis 2027-S01 : deux besoins contigus ne sont ni un doublon exact ni un chevauchement', () => {
    const s53 = existing({ periods: [period(1, '2026-12-28', '2027-01-03')] });
    const r = rulesOf(candidate({ periods: [period(1, '2027-01-04', '2027-01-10')] }), [s53]);
    expect(r).toContain('D4');
    expect(r).not.toContain('D1');
    expect(r).not.toContain('D2');
    expect(r).not.toContain('W22');
  });
});
