import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState, setEnvelopeEvaluator } from '@/data/memory-repository';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { BUDGET_EVENT_CODES, PROFILE_IDS } from '@/domain/types';
import type { ProfileId, Scope } from '@/domain/types';
import type { RuleInput } from '@/domain/week-rules';
import { period } from './needs-util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const zone = (code: string) => zones.find((z) => z.code === code)!;
const cvrId = (code: string) => zone(code).id;
const ctxOf = (id: ProfileId, scope?: Scope) => buildAccessContext({ ...profiles.find((p) => p.id === id)!, ...(scope ? { scope } : {}) }, 'fr');
const AGENCY = () => ctxOf('agency_admin');
const DIRECTION = () => ctxOf('direction_client');
const TODAY = '2026-10-23';
const sectorsOf = (cvr: string) => zones.filter((z) => z.kind === 'rs' && z.parent_id === cvrId(cvr)).map((z) => z.id);

beforeEach(() => { resetDemoState(); setEnvelopeEvaluator(); });

/** Accès direct à l'état de démonstration, pour simuler une évolution de données qu'aucun écran n'offre encore (secteur, campagne). */
const rawState = () => (globalThis as unknown as { __suntoryDemoState: { needs: Array<Record<string, unknown> & { need_code: string }> } }).__suntoryDemoState;

const budgetEvents = async (code?: string) => (await repo.getBudgetEvents(AGENCY())).filter((e) => !code || e.code === code);
const needRow = async (code: string) => (await repo.getBudgetNeeds(AGENCY())).find((r) => r.needCode === code)!;
const line = async (campaign: string, cvr: string) => (await repo.getBudget(AGENCY())).lines.find((l) => l.campaign_code === campaign && l.cvr.id === cvrId(cvr))!;

async function newNeed(over: Partial<RuleInput> = {}, sector = sectorsOf('CVR-ZV01')[0]!) {
  const stores = (await repo.getStores(AGENCY())).filter((s) => s.sector_id === sector).slice(0, 1).map((s) => s.code);
  const r = await repo.saveNeed(AGENCY(), {
    dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: sector, position_label: 'Poste 3', weekly_hours: 14, priority: 2,
    periods: [period(1, '2027-03-01', '2027-03-07')], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: stores, client_comment: null, ...over,
  });
  if (r.status !== 'saved') throw new Error(JSON.stringify(r));
  return r.need;
}

describe('départ : fixtures cohérentes (montants fictifs, jamais 0 inventé)', () => {
  it('l\'enveloppe v1 couvre le total alloué, le reste non réparti est calculé', async () => {
    const b = await repo.getBudget(AGENCY());
    expect(b.envelope).toMatchObject({ version: 1, currency: 'EUR', basis: 'HT', entered_by_profile: 'direction_client' });
    expect(b.allocated_cents).toBe(3_860_000);
    expect(b.unallocated_cents).toBe(10_000_000 - 3_860_000);
    expect(b.lines).toHaveLength(18);
  });
  it('la maille sans ligne d\'allocation est « Budget non renseigné », la maille serrée porte un dépassement', async () => {
    expect((await needRow('BES-DEMO-028')).status).toBe('no_budget');
    expect((await needRow('BES-DEMO-011')).status).toBe('beyond');
    expect((await line('CMP-DEMO-03', 'CVR-WY02')).figures).toMatchObject({ available: expect.any(Number) });
    expect((await line('CMP-DEMO-03', 'CVR-WY02')).figures!.available!).toBeLessThan(0);
    expect((await line('CMP-DEMO-04', 'CVR-GP03')).figures).toMatchObject({ consumed: 0, forecast: 0, landing: 0, total: 0, available: 100_000 });
  });
  it('les quatre mesures se recomposent : atterrissage = consommé + prévisionnel, disponible = affecté - atterrissage', async () => {
    const f = (await repo.getBudget(AGENCY())).figures!;
    expect(f.landing).toBe(f.consumed! + f.forecast!);
    expect(f.available).toBe(f.allocated! - f.landing!);
    expect(f).toMatchObject({ priced: f.total, beyond: 1 });
  });
  it('les fixtures portent déjà le dépassement au journal (EV-28), sans montant', async () => {
    const ev = await budgetEvents('EV-28');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ audience: 'both', data: { need_code: 'BES-DEMO-011' } });
    expect(Object.keys(ev[0]!.data).filter((k) => /eur|cents|cost/.test(k))).toEqual([]);
  });
});

describe('enveloppe cliente : la cliente saisit, l\'agence lit sans modifier', () => {
  const next = { amountEur: 120_000, periodStart: '2026-10-01', periodEnd: '2027-06-30', motive: 'Rallonge validée en comité.' };
  it('seule la direction cliente saisit', async () => {
    const attempts = PROFILE_IDS.filter((p) => p !== 'direction_client');
    for (const p of attempts) {
      expect(repo.canSetEnvelope(ctxOf(p)), p).toBe(false);
      expect(await repo.setEnvelope(ctxOf(p), next), p).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect((await repo.getEnvelopeVersions(AGENCY())).map((e) => e.version)).toEqual([1]);
  });
  it('une nouvelle version est datée, versionnée, la précédente reste lisible, l\'agence la voit', async () => {
    expect(repo.canSetEnvelope(DIRECTION())).toBe(true);
    expect(await repo.setEnvelope(DIRECTION(), next)).toEqual({ status: 'ok' });
    const versions = await repo.getEnvelopeVersions(AGENCY());
    expect(versions.map((e) => [e.version, e.amount_eur_ht])).toEqual([[2, 120_000], [1, 100_000]]);
    expect(versions[0]).toMatchObject({ entered_on: TODAY, entered_by_profile: 'direction_client', motive: 'Rallonge validée en comité.' });
    expect((await repo.getBudget(AGENCY())).envelope?.version).toBe(2);
    expect((await repo.getBudget(AGENCY())).unallocated_cents).toBe(12_000_000 - 3_860_000);
    expect((await repo.getBudget(DIRECTION())).envelope?.version).toBe(2);
  });
  it('le motif est exigé dès la deuxième version, le montant et la période sont contrôlés', async () => {
    expect(await repo.setEnvelope(DIRECTION(), { ...next, motive: '  ' })).toEqual({ status: 'refused', reason: 'motive_required' });
    expect(await repo.setEnvelope(DIRECTION(), { ...next, amountEur: 0 })).toEqual({ status: 'refused', reason: 'invalid' });
    expect(await repo.setEnvelope(DIRECTION(), { ...next, amountEur: 12.345 })).toEqual({ status: 'refused', reason: 'invalid' });
    expect(await repo.setEnvelope(DIRECTION(), { ...next, periodEnd: '2026-01-01' })).toEqual({ status: 'refused', reason: 'invalid_period' });
    expect((await repo.getEnvelopeVersions(AGENCY())).length).toBe(1);
  });
  it('une version inférieure au total déjà alloué est refusée', async () => {
    expect(await repo.setEnvelope(DIRECTION(), { ...next, amountEur: 38_599.99 })).toEqual({ status: 'refused', reason: 'below_allocated' });
    expect(await repo.setEnvelope(DIRECTION(), { ...next, amountEur: 38_600 })).toEqual({ status: 'ok' });
  });
  it('la saisie est tracée (EV-50, agence), motif compris, ancien montant compris', async () => {
    await repo.setEnvelope(DIRECTION(), next);
    const ev = (await budgetEvents('EV-50'))[0]!;
    expect(ev).toMatchObject({ audience: 'agency', actor_profile: 'direction_client', effect_date: TODAY });
    expect(ev.data).toMatchObject({ version: 2, amount_eur: 120_000, previous_eur: 100_000, motive: 'Rallonge validée en comité.' });
  });
});

describe('allocation de l\'agence : total borné par l\'enveloppe', () => {
  const alloc = (over: Partial<Parameters<typeof repo.saveAllocation>[1]> = {}) =>
    repo.saveAllocation(AGENCY(), { campaign: 'CMP-DEMO-02', cvrId: cvrId('CVR-UH06'), amountEur: 500, ...over });
  it('seule l\'agence administration alloue', async () => {
    for (const p of PROFILE_IDS.filter((x) => x !== 'agency_admin')) {
      expect(repo.canAllocate(ctxOf(p)), p).toBe(false);
      expect(await repo.saveAllocation(ctxOf(p), { campaign: 'CMP-DEMO-02', cvrId: cvrId('CVR-UH06'), amountEur: 1 }), p).toEqual({ status: 'refused', reason: 'forbidden' });
      expect(await repo.removeAllocation(ctxOf(p), (await line('CMP-DEMO-01', 'CVR-ZV01')).id, 'x'), p).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect((await repo.getBudget(AGENCY())).lines).toHaveLength(18);
  });
  it('accepte jusqu\'au dernier centime de l\'enveloppe et refuse au centime au-delà', async () => {
    const left = 100_000 - 38_600;
    expect(await alloc({ amountEur: left + 0.01 })).toEqual({ status: 'refused', reason: 'exceeds_envelope' });
    expect((await repo.getBudget(AGENCY())).lines).toHaveLength(18);
    expect(await alloc({ amountEur: left })).toEqual({ status: 'ok' });
    const b = await repo.getBudget(AGENCY());
    expect(b.unallocated_cents).toBe(0);
    expect(b.allocated_cents).toBe(10_000_000);
  });
  it('modifier une ligne remplace son montant et exige un motif ; une même valeur est refusée', async () => {
    const l = await line('CMP-DEMO-01', 'CVR-ZV01');
    expect(await repo.saveAllocation(AGENCY(), { campaign: l.campaign_code, cvrId: l.cvr.id, amountEur: 4100 })).toEqual({ status: 'refused', reason: 'motive_required' });
    expect(await repo.saveAllocation(AGENCY(), { campaign: l.campaign_code, cvrId: l.cvr.id, amountEur: 4000, motive: 'Rien.' })).toEqual({ status: 'refused', reason: 'unchanged' });
    expect(await repo.saveAllocation(AGENCY(), { campaign: l.campaign_code, cvrId: l.cvr.id, amountEur: 4100, motive: 'Besoin supplémentaire.' })).toEqual({ status: 'ok' });
    expect(await line('CMP-DEMO-01', 'CVR-ZV01')).toMatchObject({ allocated_cents: 410_000, revision: 2 });
    expect((await repo.getBudget(AGENCY())).lines).toHaveLength(18);
  });
  it('refuse campagne ou CVR inconnus et zone qui n\'est pas un CVR', async () => {
    expect(await alloc({ campaign: 'CMP-DEMO-99' })).toEqual({ status: 'refused', reason: 'unknown_campaign' });
    expect(await alloc({ cvrId: crypto.randomUUID() })).toEqual({ status: 'refused', reason: 'unknown_cvr' });
    expect(await alloc({ cvrId: cvrId('DR-ALPHA') })).toEqual({ status: 'refused', reason: 'unknown_cvr' });
  });
  it('retirer une ligne exige un motif, la maille retombe en « Budget non renseigné »', async () => {
    const l = await line('CMP-DEMO-01', 'CVR-UH06');
    expect(await repo.removeAllocation(AGENCY(), l.id, ' ')).toEqual({ status: 'refused', reason: 'motive_required' });
    expect(await repo.removeAllocation(AGENCY(), crypto.randomUUID(), 'x')).toEqual({ status: 'refused', reason: 'not_found' });
    expect(await repo.removeAllocation(AGENCY(), l.id, 'Campagne annulée sur ce CVR.')).toEqual({ status: 'ok' });
    expect((await needRow('BES-DEMO-013')).campaign).toBe('CMP-DEMO-01');
    const removed = (await budgetEvents('EV-51'))[0]!;
    expect(removed.data).toMatchObject({ action: 'removed', campaign: 'CMP-DEMO-01', previous_eur: 2500, motive: 'Campagne annulée sur ce CVR.' });
  });
  it('sans enveloppe, rien ne se répartit', async () => {
    await repo.getBudget(AGENCY());
    const st = (globalThis as unknown as { __suntoryDemoState: { envelopes: unknown[] } }).__suntoryDemoState;
    st.envelopes.length = 0;
    expect(await alloc()).toEqual({ status: 'refused', reason: 'no_envelope' });
    const b = await repo.getBudget(AGENCY());
    expect(b.envelope).toBeNull();
    expect(b.unallocated_cents).toBeNull();
    expect((await repo.getBudgetAlerts(AGENCY())).map((a) => a.message_key)).toContain('envelopeMissing');
  });
  it('chaque modification est tracée : EV-51, audience des deux côtés, motif, ancien et nouveau montant', async () => {
    const l = await line('CMP-DEMO-01', 'CVR-ZV01');
    await repo.saveAllocation(AGENCY(), { campaign: l.campaign_code, cvrId: l.cvr.id, amountEur: 4100, motive: 'Besoin supplémentaire.' });
    await alloc();
    const [created, updated] = await budgetEvents('EV-51');
    expect(created).toMatchObject({ audience: 'both', zone_id: cvrId('CVR-UH06'), data: { action: 'created', campaign: 'CMP-DEMO-02', amount_eur: 500 } });
    expect(updated).toMatchObject({ audience: 'both', data: { action: 'updated', previous_eur: 4000, amount_eur: 4100, motive: 'Besoin supplémentaire.', revision: 2 } });
  });
});

describe('besoin au-delà du disponible : autorisé, alerté, tracé (D156)', () => {
  it('un besoin qui dépasse la maille est enregistré sans blocage, avec alerte et événement', async () => {
    const before = (await budgetEvents('EV-28')).length;
    // CMP-DEMO-04 x CVR-ZV01 : 2000 € alloués, 1556,10 € déjà comptés. Un besoin de 35 h x 4 semaines dépasse largement.
    const n = await newNeed({ dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04', weekly_hours: 35, periods: [period(1, '2027-03-01', '2027-03-28')] });
    const row = await needRow(n.need_code);
    expect(row.status).toBe('beyond');
    expect(row.cost.cents).toBe(35 * 4 * 2470);
    const ev = await budgetEvents('EV-28');
    expect(ev.length).toBe(before + 1);
    expect(ev[0]).toMatchObject({ audience: 'both', need_id: n.id, data: { need_code: n.need_code, campaign: 'CMP-DEMO-04', trigger: 'need' } });
    // Alerte à la cliente (sans montant) et à l'agence.
    for (const ctx of [DIRECTION(), AGENCY()]) {
      const alert = (await repo.getBudgetAlerts(ctx)).find((a) => a.message_key === 'needsBeyond')!;
      expect(alert).toMatchObject({ audience: 'both', params: { n: 2 } });
      expect(JSON.stringify(alert)).not.toMatch(/eur|cents|cost/);
    }
  });
  it('la dépasser deux fois ne trace pas deux fois le même besoin', async () => {
    const n = await newNeed({ dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04', weekly_hours: 35, periods: [period(1, '2027-03-01', '2027-03-28')] });
    const count = async () => (await budgetEvents('EV-28')).filter((e) => e.need_id === n.id).length;
    expect(await count()).toBe(1);
    await repo.saveAllocation(AGENCY(), { campaign: 'CMP-DEMO-01', cvrId: cvrId('CVR-UH06'), amountEur: 2600, motive: 'Test.' });
    expect(await count()).toBe(1);
  });
  it('augmenter l\'allocation lève le dépassement ; le réduire en crée un (événement tracé, déclencheur « allocation »)', async () => {
    const l = await line('CMP-DEMO-03', 'CVR-WY02');
    expect((await needRow('BES-DEMO-011')).status).toBe('beyond');
    await repo.saveAllocation(AGENCY(), { campaign: l.campaign_code, cvrId: l.cvr.id, amountEur: 6000, motive: 'Arbitrage.' });
    expect((await needRow('BES-DEMO-011')).status).toBe('within');
    const events = (await budgetEvents('EV-28')).length;
    await repo.saveAllocation(AGENCY(), { campaign: l.campaign_code, cvrId: l.cvr.id, amountEur: 3000, motive: 'Retour.' });
    expect((await needRow('BES-DEMO-011')).status).toBe('beyond');
    const after = await budgetEvents('EV-28');
    expect(after.length).toBe(events + 1);
    expect(after[0]!.data.trigger).toBe('allocation');
  });
  it('le point d\'entrée « hors enveloppe » du CVR suit ce calcul : hors enveloppe pour le besoin qui dépasse', async () => {
    const rowOf = async (code: string) => (await repo.getPipeline(AGENCY())).find((r) => r.need.need_code === code)!;
    expect((await rowOf('BES-DEMO-011')).validation.envelope).toBe('exceeded');
    expect((await rowOf('BES-DEMO-028')).validation.envelope).toBe('not_evaluated');
    expect((await rowOf('BES-DEMO-032')).validation.envelope).toBe('within');
  });
});

describe('prévisionnel devenu consommé au pourvoi du poste', () => {
  it('la prise de poste d\'un recrutement finalisé fait passer son coût du prévisionnel au consommé', async () => {
    const before = (await repo.getBudget(AGENCY())).figures!;
    const row = await needRow('BES-DEMO-021');
    expect(row).toMatchObject({ kind: 'forecast', cost: { cents: 32_760 } });
    const need = (await repo.getNeeds(AGENCY())).find((n) => n.need_code === 'BES-DEMO-021')!;
    expect(await repo.recordStep(AGENCY(), need.id, 'start_work', { date: TODAY })).toEqual({ status: 'ok' });
    expect(await needRow('BES-DEMO-021')).toMatchObject({ kind: 'consumed', status: 'within' });
    const after = (await repo.getBudget(AGENCY())).figures!;
    expect(after.consumed).toBe(before.consumed! + 32_760);
    expect(after.forecast).toBe(before.forecast! - 32_760);
    expect(after.landing).toBe(before.landing);
    expect(after.available).toBe(before.available);
  });
  it('une prise de poste planifiée après aujourd\'hui reste au prévisionnel', async () => {
    expect(await needRow('BES-DEMO-024')).toMatchObject({ kind: 'forecast' });
  });
  it('un besoin refusé par le CVR, écarté par l\'agence ou stoppé ne pèse plus ; un brouillon n\'y entre pas', async () => {
    const codes = async () => (await repo.getBudgetNeeds(AGENCY())).map((r) => r.needCode);
    expect(await codes()).not.toContain('BES-DEMO-036');
    expect((await codes()).length).toBe(32);
    const all = await repo.getNeeds(AGENCY());
    const target = all.find((n) => n.need_code === 'BES-DEMO-034')!;
    expect(await repo.validateNeed(ctxOf('cvr_client'), target.id, { outcome: 'refuse', motive: 'Trop d\'heures.' })).toEqual({ status: 'ok' });
    expect(await codes()).not.toContain('BES-DEMO-034');
    expect(all.filter((n) => n.need_state === 'draft').every((n) => !n.need_code || true)).toBe(true);
    for (const d of all.filter((n) => n.need_state === 'draft')) expect(await codes()).not.toContain(d.need_code);
  });
});

describe('imputation : un changement de périmètre déplace le budget (mutations datées)', () => {
  it('le changement de campagne ou de secteur d\'un besoin déplace son coût vers la nouvelle maille et laisse un événement daté', async () => {
    await repo.getBudget(AGENCY());
    const st = rawState();
    const before = await needRow('BES-DEMO-009');
    expect(before.campaign).toBe('CMP-DEMO-01');
    const fromCvr = zones.find((z) => z.id === before.cvrId)!;
    const target = fromCvr.code === 'CVR-WY02' ? 'CVR-ZV01' : 'CVR-WY02';
    const lineBefore = (await line('CMP-DEMO-01', fromCvr.code)).figures!;
    // Simule une évolution de données qu'aucun écran n'offre encore : la campagne puis le secteur du besoin changent.
    const raw = st.needs.find((n) => n.need_code === 'BES-DEMO-009')!;
    raw.campaign_code = 'CMP-DEMO-02';
    raw.dispositif = 'seasonal';
    raw.sector_id = sectorsOf(target)[0]!;
    await repo.saveAllocation(AGENCY(), { campaign: 'CMP-DEMO-02', cvrId: cvrId('CVR-UH06'), amountEur: 1 });
    const moved = await needRow('BES-DEMO-009');
    expect(moved).toMatchObject({ campaign: 'CMP-DEMO-02', cvrId: cvrId(target) });
    const lineAfter = (await line('CMP-DEMO-01', fromCvr.code)).figures!;
    expect(lineAfter.landing!).toBe(lineBefore.landing! - before.cost.cents!);
    expect(lineAfter.total).toBe(lineBefore.total - 1);
    const [ev] = await budgetEvents('EV-52');
    expect(ev).toMatchObject({ audience: 'agency', need_id: raw.id, effect_date: TODAY, data: { need_code: 'BES-DEMO-009', kind: 'moved', from_campaign: 'CMP-DEMO-01', to_campaign: 'CMP-DEMO-02', to_cvr: cvrId(target) } });
    expect(ev!.data.from_cvr).toBe(fromCvr.id);
  });
  it('une modification de période recalcule le coût de la même maille (EV-52 « recosted »)', async () => {
    const stores = (await repo.getStores(AGENCY())).filter((s) => s.sector_id === sectorsOf('CVR-ZV01')[0]!).slice(0, 1).map((s) => s.code);
    const created = await newNeed({ weekly_hours: 10, periods: [period(1, '2027-05-03', '2027-05-09')], store_codes: stores });
    const events0 = (await budgetEvents('EV-52')).length;
    await repo.saveNeed(AGENCY(), {
      dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: created.sector_id, position_label: 'Poste 3', weekly_hours: 10, priority: 2,
      periods: [period(1, '2027-05-10', '2027-05-16')], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: stores, client_comment: null,
    }, { mergeInto: created.id });
    const ev = await budgetEvents('EV-52');
    expect(ev.length).toBe(events0 + 1);
    expect(ev[0]!.data).toMatchObject({ kind: 'recosted', need_code: created.need_code, from_eur: 10 * 1 * 23.4, to_eur: 10 * 2 * 23.4 });
  });
});

describe('chiffrage incomplet : jamais transformé en zéro', () => {
  it('un besoin sans heures chiffrées est « non chiffré », compté dans la couverture, absent des sommes', async () => {
    await repo.getBudget(AGENCY());
    const raw = rawState().needs.find((n) => n.need_code === 'BES-DEMO-009')!;
    const before = (await repo.getBudget(AGENCY())).figures!;
    const cost = (await needRow('BES-DEMO-009')).cost.cents!;
    raw.weekly_hours = null;
    const row = await needRow('BES-DEMO-009');
    expect(row).toMatchObject({ status: 'unpriced', cost: { cents: null, missing: 'hours' } });
    const after = (await repo.getBudget(AGENCY())).figures!;
    expect(after.total).toBe(before.total);
    expect(after.priced).toBe(before.priced - 1);
    expect(after.landing).toBe(before.landing! - cost);
    expect((await repo.getBudget(AGENCY())).unpricedCount).toBe(1);
    expect((await repo.getBudgetAlerts(AGENCY())).find((a) => a.message_key === 'unpriced')).toMatchObject({ audience: 'agency', params: { n: 1 } });
  });
  it('la maille sans allocation est signalée à l\'agence seule', async () => {
    expect((await repo.getBudget(AGENCY())).noBudgetCount).toBe(1);
    expect((await repo.getBudgetAlerts(AGENCY())).find((a) => a.message_key === 'noBudget')).toMatchObject({ audience: 'agency', params: { n: 1 } });
  });
});

describe('audience : aucun coût ni alerte d\'agence dans un profil cliente, CVR, DR ou RS sans droit', () => {
  const COST_KEYS = ['consumed', 'forecast', 'landing', 'available'];
  it('la direction cliente lit l\'enveloppe et les allocations, jamais un coût', async () => {
    const b = await repo.getBudget(DIRECTION());
    expect(b.envelopeVisible).toBe(true);
    expect(b.envelope?.version).toBe(1);
    expect(b.costsVisible).toBe(false);
    expect(b.figures).toBeNull();
    expect(b.lines).toHaveLength(18);
    expect(b.lines.every((l) => l.figures === null)).toBe(true);
    for (const g of Object.values(b.groups).flat()) expect(g.figures).toBeNull();
    expect(b.noBudgetCount).toBeNull();
    expect(b.unpricedCount).toBeNull();
    expect(await repo.getBudgetNeeds(DIRECTION())).toEqual([]);
    expect(await repo.getBudgetRates(DIRECTION())).toEqual([]);
    const text = JSON.stringify(b);
    for (const k of COST_KEYS) expect(text).not.toContain(`"${k}"`);
  });
  it('le DR ne lit que les allocations de ses CVR, ni l\'enveloppe nationale ni le reste non réparti', async () => {
    const b = await repo.getBudget(ctxOf('dr_client'));
    expect(b.envelopeVisible).toBe(false);
    expect(b.envelope).toBeNull();
    expect(b.unallocated_cents).toBeNull();
    expect(await repo.getEnvelopeVersions(ctxOf('dr_client'))).toEqual([]);
    const alpha = new Set(zones.filter((z) => z.kind === 'cvr' && z.parent_id === cvrId('DR-ALPHA')).map((z) => z.id));
    expect(b.lines.length).toBeGreaterThan(0);
    expect(b.lines.every((l) => alpha.has(l.cvr.id))).toBe(true);
    expect(b.allocated_cents).toBe(b.lines.reduce((s, l) => s + l.allocated_cents, 0));
    expect(b.figures).toBeNull();
  });
  it('le CVR et le RS ne lisent rien du budget : ni détail, ni alertes, ni journal budgétaire', async () => {
    for (const p of ['cvr_client', 'rs'] as const) {
      const ctx = ctxOf(p);
      expect(repo.canReadBudget(ctx), p).toBe(false);
      expect(await repo.getBudget(ctx), p).toMatchObject({ lines: [], envelope: null, figures: null, allocated_cents: null });
      expect(await repo.getBudgetAlerts(ctx), p).toEqual([]);
      expect(await repo.getBudgetEvents(ctx), p).toEqual([]);
      expect(await repo.getBudgetNeeds(ctx), p).toEqual([]);
      const seen = (await repo.getEvents(ctx)).filter((e) => (BUDGET_EVENT_CODES as readonly string[]).includes(e.code));
      expect(seen, p).toEqual([]);
    }
  });
  it('le dossier d\'un besoin au-delà du disponible ne montre l\'événement budgétaire qu\'à ceux qui lisent le budget', async () => {
    const need = (await repo.getNeeds(AGENCY())).find((n) => n.need_code === 'BES-DEMO-011')!;
    const codes = async (ctx: ReturnType<typeof ctxOf>) => ((await repo.getNeedThread(ctx, need.id))?.events ?? []).map((e) => e.code);
    expect(await codes(AGENCY())).toContain('EV-28');
    expect(await codes(DIRECTION())).toContain('EV-28');
    const sector = zones.find((z) => z.id === need.sector_id)!;
    expect(await codes(ctxOf('cvr_client', { kind: 'cvr', ids: [sector.parent_id!] }))).not.toContain('EV-28');
    expect(await codes(ctxOf('rs', { kind: 'rs', ids: [sector.id] }))).not.toContain('EV-28');
  });
  it('les alertes de l\'agence (non renseigné, non chiffré) n\'atteignent aucun profil cliente', async () => {
    for (const p of ['direction_client', 'dr_client'] as const) {
      const keys = (await repo.getBudgetAlerts(ctxOf(p))).map((a) => a.message_key);
      expect(keys, p).not.toContain('noBudget');
      expect(keys, p).not.toContain('unpriced');
    }
    const agency = (await repo.getBudgetAlerts(AGENCY())).map((a) => a.message_key);
    expect(agency).toEqual(expect.arrayContaining(['needsBeyond', 'noBudget']));
  });
  it('le journal budgétaire de la cliente exclut l\'enveloppe et les déplacements d\'imputation (agence)', async () => {
    await repo.setEnvelope(DIRECTION(), { amountEur: 110_000, periodStart: '2026-10-01', periodEnd: '2027-06-30', motive: 'Rallonge.' });
    const dir = (await repo.getBudgetEvents(DIRECTION())).map((e) => e.code);
    expect(dir).not.toContain('EV-50');
    expect(dir).not.toContain('EV-52');
    expect(dir).toEqual(expect.arrayContaining(['EV-51', 'EV-28']));
    expect((await budgetEvents()).map((e) => e.code)).toContain('EV-50');
    for (const e of await repo.getBudgetEvents(DIRECTION())) expect(['both', 'client']).toContain(e.audience);
  });
  it('le prestataire lit comme l\'agence mais n\'écrit pas', async () => {
    const ctx = ctxOf('provider_admin');
    expect(repo.canReadBudget(ctx)).toBe(true);
    expect((await repo.getBudget(ctx)).figures).not.toBeNull();
    expect(repo.canAllocate(ctx)).toBe(false);
    expect(repo.canSetEnvelope(ctx)).toBe(false);
  });
  it('le suppléant d\'un DR lit les allocations de la zone déléguée, pas davantage', async () => {
    const beta = await repo.getBudget(ctxOf('dr_client', { kind: 'dr', ids: [cvrId('DR-BETA')] }));
    expect(beta.lines.length).toBeGreaterThan(0);
    expect(beta.lines.every((l) => l.dr?.id === cvrId('DR-BETA'))).toBe(true);
  });
});

describe('annulation (D159) : l\'état budgétaire revient en entier', () => {
  it('annuler une allocation restaure les lignes et les repères', async () => {
    const before = (await repo.getBudget(AGENCY())).allocated_cents;
    const { result, undoToken } = await repo.withUndo(AGENCY(), () => repo.saveAllocation(AGENCY(), { campaign: 'CMP-DEMO-02', cvrId: cvrId('CVR-UH06'), amountEur: 700 }), (r) => r.status === 'ok');
    expect(result.status).toBe('ok');
    expect(undoToken).not.toBeNull();
    expect((await repo.getBudget(AGENCY())).allocated_cents).toBe(before! + 70_000);
    expect(await repo.undoWrite(AGENCY(), undoToken!)).toEqual({ status: 'ok' });
    expect((await repo.getBudget(AGENCY())).allocated_cents).toBe(before);
    expect((await needRow('BES-DEMO-028')).status).toBe('no_budget');
  });
});

describe('textes : chaque valeur affichée du budget existe en français et en anglais', () => {
  it('statuts, raisons de coût manquant, filtres, refus, alertes et événements', async () => {
    const { flatten } = await import('./util');
    const { BUDGET_STATUSES, COST_MISSING_REASONS } = await import('@/domain/types');
    const files = { fr: (await import('../../messages/fr.json')).default, en: (await import('../../messages/en.json')).default };
    const need: string[] = [
      ...BUDGET_STATUSES.flatMap((x) => [`budget.status.${x}`, `budget.needs.filters.${x}`]),
      ...COST_MISSING_REASONS.map((x) => `budget.missing.${x}`),
      ...['all', 'consumed', 'forecast'].map((x) => `budget.needs.filters.${x}`),
      ...['forbidden', 'invalid', 'invalid_period', 'motive_required', 'below_allocated', 'incomplete'].map((x) => `budget.envelope.refused.${x}`),
      ...['forbidden', 'invalid', 'no_envelope', 'exceeds_envelope', 'motive_required', 'unknown_campaign', 'unknown_cvr', 'unchanged', 'not_found', 'incomplete'].map((x) => `budget.allocation.refused.${x}`),
      ...['needsBeyond', 'noBudget', 'unpriced', 'envelopeMissing', 'open'].map((x) => `alerts.budget.${x}`),
      ...['EV-28', 'EV-50', 'EV-51', 'EV-52'].map((x) => `pipeline.event.${x}`),
      ...['EV-28', 'EV-50', 'EV-50Previous', 'EV-51created', 'EV-51updated', 'EV-51removed', 'EV-52moved', 'EV-52recosted', 'motive'].map((x) => `budget.journal.detail.${x}`),
    ];
    for (const [lang, m] of Object.entries(files)) {
      const flat = flatten(m as Record<string, unknown>);
      for (const k of need) expect(flat[k], `${lang} ${k}`).toBeTruthy();
    }
  });
});
