import { describe, expect, it } from 'vitest';
import {
  allocatedSum, allocationIssue, classifyNeeds, envelopeIssue, envelopeStatusOf, estimateNeedCost, figuresOf, fromCents, imputationMoves, isMoney,
  linesOf, meshKey, rateAt, snapshotOfNeeds, toCents, weeksOf,
} from '@/domain/budget';
import type { BudgetNeed, NeedCost } from '@/domain/budget';
import type { Rate } from '@/data/schemas';
import { isValidIsoDate } from '@/domain/week';
import { period } from './needs-util';

const rate = (dispositif: Rate['dispositif'], eur: number, valid_from = '2026-01-01'): Rate => ({
  id: crypto.randomUUID(), dispositif, hourly_rate_eur_ht: eur, currency: 'EUR', basis: 'HT', valid_from, is_fictional: true, is_demo: true,
});
const RATES = [rate('permanent', 20), rate('seasonal', 30)];

const cost = (cents: number | null): NeedCost => ({ cents, weeks: 1, hours: 10, rateCents: 2000, missing: cents === null ? 'rate' : null });
let seq = 0;
const need = (over: Partial<BudgetNeed> & { cents?: number | null }): BudgetNeed => {
  seq += 1;
  const { cents, ...rest } = over;
  return {
    id: `n${seq}`, code: `BES-DEMO-${String(seq).padStart(3, '0')}`, submittedOn: '2026-10-01', sectorId: 's', cvrId: 'cvr1', drId: 'dr1', campaign: 'CMP-DEMO-01',
    dispositif: 'permanent', cost: cost(cents === undefined ? 10_000 : cents), started: false, ...rest,
  };
};

describe('montants en centimes entiers', () => {
  it('convertit sans erreur d\'arrondi', () => {
    expect(toCents(23.4)).toBe(2340);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(fromCents(2340)).toBe(23.4);
  });
  it('refuse un montant négatif, infini, à trois décimales ou hors texte', () => {
    for (const v of [-1, Number.NaN, Infinity, 1.005, '12', null, undefined, 1_000_000_001]) expect(isMoney(v), String(v)).toBe(false);
    for (const v of [0, 0.01, 12.5, 100000]) expect(isMoney(v), String(v)).toBe(true);
  });
});

describe('coût estimé d\'un besoin : heures par semaine x semaines ISO x tarif daté', () => {
  it('compte les semaines ISO touchées, périodes cumulées', () => {
    expect(weeksOf([period(1, '2026-11-02', '2026-11-08')])).toBe(1);
    expect(weeksOf([period(1, '2026-11-04', '2026-11-10')])).toBe(2);
    expect(weeksOf([period(1, '2026-11-02', '2026-11-15'), period(2, '2026-11-23', '2026-11-29')])).toBe(3);
    expect(weeksOf([])).toBe(0);
  });
  it('calcule en centimes, au tarif du dispositif', () => {
    const c = estimateNeedCost({ dispositif: 'permanent', weekly_hours: 10, periods: [period(1, '2026-11-02', '2026-11-15')] }, RATES);
    expect(c).toMatchObject({ cents: 10 * 2 * 2000, weeks: 2, rateCents: 2000, missing: null });
    expect(estimateNeedCost({ dispositif: 'seasonal', weekly_hours: 7, periods: [period(1, '2026-11-02', '2026-11-08')] }, RATES).cents).toBe(7 * 3000);
  });
  it('un coût inconnu vaut null avec sa raison, jamais 0', () => {
    const p = [period(1, '2026-11-02', '2026-11-08')];
    expect(estimateNeedCost({ dispositif: null, weekly_hours: 10, periods: p }, RATES)).toMatchObject({ cents: null, missing: 'dispositif' });
    expect(estimateNeedCost({ dispositif: 'permanent', weekly_hours: null, periods: p }, RATES)).toMatchObject({ cents: null, missing: 'hours' });
    expect(estimateNeedCost({ dispositif: 'permanent', weekly_hours: 10, periods: [] }, RATES)).toMatchObject({ cents: null, missing: 'period' });
    expect(estimateNeedCost({ dispositif: 'hourly_merch', weekly_hours: 10, periods: p }, RATES)).toMatchObject({ cents: null, missing: 'rate' });
  });
  it('le tarif est daté : celui en vigueur au début du besoin, jamais un tarif futur ni de repli', () => {
    const dated = [rate('permanent', 20, '2026-01-01'), rate('permanent', 25, '2026-12-01')];
    expect(rateAt(dated, 'permanent', '2026-11-30')?.hourly_rate_eur_ht).toBe(20);
    expect(rateAt(dated, 'permanent', '2026-12-01')?.hourly_rate_eur_ht).toBe(25);
    expect(rateAt(dated, 'permanent', '2025-12-31')).toBeNull();
    expect(estimateNeedCost({ dispositif: 'permanent', weekly_hours: 10, periods: [period(1, '2025-11-03', '2025-11-09')] }, dated)).toMatchObject({ cents: null, missing: 'rate' });
  });
});

describe('situation d\'un besoin face au budget de sa maille (D156)', () => {
  const line = (campaign: string, cvrId: string, cents: number) => ({ campaign, cvrId, cents });
  it('dans le budget, puis au-delà dès que le cumul dépasse, sans jamais bloquer', () => {
    const a = need({ cents: 6000, submittedOn: '2026-10-01' });
    const b = need({ cents: 3000, submittedOn: '2026-10-02' });
    const c = need({ cents: 2000, submittedOn: '2026-10-03' });
    const s = classifyNeeds([c, a, b], [line('CMP-DEMO-01', 'cvr1', 10_000)]);
    expect([s.get(a.id), s.get(b.id), s.get(c.id)]).toEqual(['within', 'within', 'beyond']);
  });
  it('un cumul égal au montant alloué reste dans le budget', () => {
    const a = need({ cents: 10_000 });
    expect(classifyNeeds([a], [line('CMP-DEMO-01', 'cvr1', 10_000)]).get(a.id)).toBe('within');
  });
  it('sans ligne d\'allocation : « Budget non renseigné », jamais « dans le budget »', () => {
    const a = need({});
    expect(classifyNeeds([a], []).get(a.id)).toBe('no_budget');
    const noCampaign = need({ campaign: null });
    expect(classifyNeeds([noCampaign], [line('CMP-DEMO-01', 'cvr1', 1)]).get(noCampaign.id)).toBe('no_budget');
  });
  it('une allocation explicitement nulle est un vrai zéro : tout besoin chiffré la dépasse', () => {
    const a = need({ cents: 1 });
    expect(classifyNeeds([a], [line('CMP-DEMO-01', 'cvr1', 0)]).get(a.id)).toBe('beyond');
  });
  it('un coût inconnu est « non chiffré », ni dans ni au-delà', () => {
    const a = need({ cents: null });
    expect(classifyNeeds([a], [line('CMP-DEMO-01', 'cvr1', 5)]).get(a.id)).toBe('unpriced');
  });
  it('chaque maille compte à part (campagne et CVR)', () => {
    const a = need({ cents: 9000 });
    const b = need({ cents: 9000, cvrId: 'cvr2' });
    const s = classifyNeeds([a, b], [line('CMP-DEMO-01', 'cvr1', 10_000), line('CMP-DEMO-01', 'cvr2', 10_000)]);
    expect([s.get(a.id), s.get(b.id)]).toEqual(['within', 'within']);
  });
  it('alimente le point d\'entrée « hors enveloppe » : seul le dépassement est « excedé », l\'inconnu n\'est pas évalué', () => {
    expect(envelopeStatusOf('beyond')).toBe('exceeded');
    expect(envelopeStatusOf('within')).toBe('within');
    for (const s of ['no_budget', 'unpriced', undefined] as const) expect(envelopeStatusOf(s)).toBe('not_evaluated');
  });
});

describe('quatre mesures et couverture (F-50.6)', () => {
  it('consommé, prévisionnel, atterrissage et disponible', () => {
    const needs = [need({ cents: 4000, started: true }), need({ cents: 3000 }), need({ cents: 1000 })];
    const f = figuresOf(10_000, needs, classifyNeeds(needs, [{ campaign: 'CMP-DEMO-01', cvrId: 'cvr1', cents: 10_000 }]));
    expect(f).toMatchObject({ allocated: 10_000, consumed: 4000, forecast: 4000, landing: 8000, available: 2000, priced: 3, total: 3, beyond: 0 });
  });
  it('un disponible négatif est un dépassement, pas un zéro', () => {
    const needs = [need({ cents: 7000 })];
    expect(figuresOf(5000, needs, new Map()).available).toBe(-2000);
  });
  it('un vrai zéro seulement sans besoin ; des besoins tous non chiffrés donnent « non chiffré »', () => {
    expect(figuresOf(1000, [], new Map())).toMatchObject({ consumed: 0, forecast: 0, landing: 0, available: 1000, total: 0 });
    const unpriced = [need({ cents: null }), need({ cents: null, started: true })];
    const f = figuresOf(1000, unpriced, new Map());
    expect(f).toMatchObject({ consumed: null, forecast: null, landing: null, available: null, priced: 0, total: 2 });
  });
  it('un chiffrage partiel somme les besoins chiffrés et le dit par la couverture', () => {
    const f = figuresOf(10_000, [need({ cents: 4000 }), need({ cents: null })], new Map());
    expect(f).toMatchObject({ forecast: 4000, landing: 4000, priced: 1, total: 2 });
  });
  it('budget non renseigné : affecté et disponible restent nuls, jamais 0', () => {
    const f = figuresOf(null, [need({ cents: 100 })], new Map());
    expect(f.allocated).toBeNull();
    expect(f.available).toBeNull();
    expect(allocatedSum([])).toBeNull();
    expect(allocatedSum(linesOf([{ campaign_code: 'CMP-DEMO-01', cvr_id: 'c', amount_eur_ht: 12.5 }]))).toBe(1250);
  });
});

describe('contrôle de l\'enveloppe (saisie de la cliente)', () => {
  const ok = { amountEur: 1000, periodStart: '2026-10-01', periodEnd: '2027-06-30' };
  it('accepte une première version sans motif', () => {
    expect(envelopeIssue(ok, null, 0, isValidIsoDate)).toBeNull();
  });
  it('exige un motif dès la deuxième version', () => {
    expect(envelopeIssue(ok, { version: 1 }, 0, isValidIsoDate)).toBe('motive_required');
    expect(envelopeIssue({ ...ok, motive: 'Rallonge de la direction.' }, { version: 1 }, 0, isValidIsoDate)).toBeNull();
  });
  it('refuse un montant nul, négatif ou à trois décimales, une période inversée ou invalide', () => {
    for (const amountEur of [0, -5, 10.001, '10']) expect(envelopeIssue({ ...ok, amountEur }, null, 0, isValidIsoDate), String(amountEur)).toBe('invalid');
    expect(envelopeIssue({ ...ok, periodEnd: '2026-09-30' }, null, 0, isValidIsoDate)).toBe('invalid_period');
    expect(envelopeIssue({ ...ok, periodStart: '2026-02-30' }, null, 0, isValidIsoDate)).toBe('invalid_period');
  });
  it('refuse une version inférieure au total déjà alloué', () => {
    expect(envelopeIssue({ ...ok, motive: 'x' }, { version: 1 }, 100_001, isValidIsoDate)).toBe('below_allocated');
    expect(envelopeIssue({ ...ok, motive: 'x' }, { version: 1 }, 100_000, isValidIsoDate)).toBeNull();
  });
});

describe('contrôle de l\'allocation (total borné par l\'enveloppe)', () => {
  const known = { campaign: (c: string) => c.startsWith('CMP-DEMO'), cvr: (id: string) => id.startsWith('cvr') };
  const lines = [{ campaign: 'CMP-DEMO-01', cvrId: 'cvr1', cents: 4000 }, { campaign: 'CMP-DEMO-02', cvrId: 'cvr1', cents: 3000 }];
  const ask = (over: Partial<Parameters<typeof allocationIssue>[0]> = {}, envelope: number | null = 10_000) =>
    allocationIssue({ campaign: 'CMP-DEMO-03', cvrId: 'cvr1', amountEur: 30, ...over }, envelope, lines, known);
  it('accepte jusqu\'à l\'enveloppe exactement, refuse au centime au-delà', () => {
    expect(ask({ amountEur: 30 })).toBeNull();
    expect(ask({ amountEur: 30.01 })).toBe('exceeds_envelope');
  });
  it('sans enveloppe, rien ne se répartit', () => {
    expect(ask({}, null)).toBe('no_envelope');
  });
  it('modifier une ligne remplace son montant dans le total et exige un motif', () => {
    expect(ask({ campaign: 'CMP-DEMO-01', amountEur: 70 })).toBe('motive_required');
    expect(ask({ campaign: 'CMP-DEMO-01', amountEur: 70, motive: 'Réajustement.' })).toBeNull();
    expect(ask({ campaign: 'CMP-DEMO-01', amountEur: 70.01, motive: 'Réajustement.' })).toBe('exceeds_envelope');
    expect(ask({ campaign: 'CMP-DEMO-01', amountEur: 40, motive: 'Rien ne change.' })).toBe('unchanged');
  });
  it('refuse un montant invalide, une campagne ou un CVR inconnus', () => {
    expect(ask({ amountEur: -1 })).toBe('invalid');
    expect(ask({ amountEur: 1.234 })).toBe('invalid');
    expect(ask({ campaign: 'X' })).toBe('unknown_campaign');
    expect(ask({ cvrId: 'zone' })).toBe('unknown_cvr');
  });
  it('un allocation nulle explicite est permise', () => {
    expect(ask({ amountEur: 0 })).toBeNull();
  });
});

describe('déplacements d\'imputation (mutations datées)', () => {
  it('détecte un changement de campagne, de CVR ou de coût, pas un nouveau besoin', () => {
    const a = need({ cents: 100 });
    const b = need({ cents: 100 });
    const before = snapshotOfNeeds([a, b]);
    expect(imputationMoves(before, [a, b])).toEqual([]);
    const moved = { ...a, campaign: 'CMP-DEMO-02' };
    const recosted = { ...b, cost: cost(250) };
    const fresh = need({ cents: 5 });
    const moves = imputationMoves(before, [moved, recosted, fresh]);
    expect(moves.map((m) => [m.needId, m.kind])).toEqual([[a.id, 'moved'], [b.id, 'recosted']]);
    expect(moves[0]!.to).toMatchObject({ campaign: 'CMP-DEMO-02', cvrId: 'cvr1' });
    expect(imputationMoves(before, [{ ...a, cvrId: 'cvr9' }])[0]).toMatchObject({ kind: 'moved', to: { cvrId: 'cvr9' } });
  });
  it('la clé de maille associe campagne et CVR', () => {
    expect(meshKey('CMP-DEMO-01', 'cvr1')).toBe('CMP-DEMO-01|cvr1');
  });
});
