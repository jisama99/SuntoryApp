import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import type { ProfileId, Scope } from '@/domain/types';
import { period } from './needs-util';
import { read, rel, ROOT, walk } from './util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const ctxOf = (id: ProfileId, scope?: Scope) => buildAccessContext({ ...profiles.find((p) => p.id === id)!, ...(scope ? { scope } : {}) }, 'fr');
const AGENCY = () => ctxOf('agency_admin');
const cvr = (code: string) => zones.find((z) => z.code === code)!;
const sectors = (code: string) => zones.filter((z) => z.kind === 'rs' && z.parent_id === cvr(code).id).map((z) => z.id);

beforeEach(() => resetDemoState());

/** Toutes les clés (récursivement) d'une valeur sérialisable. */
function keysOf(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) v.forEach((x) => keysOf(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.add(k); keysOf(x, out); }
  return out;
}
const COST_KEY = /cost|rate|consumed|forecast|landing|available|from_eur|to_eur|weeks|figures_|hours_cost/i;
// Montants d'allocation et d'enveloppe : données de la cliente, pas des coûts. unallocated = enveloppe moins allocations.
const ALLOWED_KEYS = new Set(['allocated_cents', 'unallocated_cents', 'costsVisible']);

async function newNeed(sector: string, hours: number, start: string, end: string) {
  const stores = (await repo.getStores(AGENCY())).filter((s) => s.sector_id === sector).slice(0, 1).map((s) => s.code);
  return repo.saveNeed(AGENCY(), {
    dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04', sector_id: sector, position_label: 'Poste 3', weekly_hours: hours, priority: 2,
    periods: [period(1, start, end)], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: stores, client_comment: null,
  });
}

describe('revue A4b1 : audience des coûts, profil par profil, côté données', () => {
  const CLIENT: Array<[string, ProfileId]> = [['direction', 'direction_client'], ['DR', 'dr_client'], ['CVR', 'cvr_client'], ['RS', 'rs']];
  it.each(CLIENT)('%s : aucune clé ni valeur de coût dans aucune lecture', async (_n, p) => {
    // Un besoin au-delà du disponible existe, pour que le journal et les alertes aient du contenu.
    await newNeed(sectors('CVR-ZV01')[0]!, 10, '2027-03-01', '2027-03-28');
    const ctx = ctxOf(p);
    const need = (await repo.getNeeds(AGENCY())).find((n) => n.need_code === 'BES-DEMO-011')!;
    const reads: Record<string, unknown> = {
      budget: await repo.getBudget(ctx), needs: await repo.getBudgetNeeds(ctx), rates: await repo.getBudgetRates(ctx),
      alerts: await repo.getBudgetAlerts(ctx), budgetEvents: await repo.getBudgetEvents(ctx), envelopes: await repo.getEnvelopeVersions(ctx),
      events: await repo.getEvents(ctx), pipeline: await repo.getPipeline(ctx), thread: await repo.getNeedThread(ctx, need.id),
    };
    for (const [name, value] of Object.entries(reads)) {
      const bad = [...keysOf(value)].filter((k) => COST_KEY.test(k) && !ALLOWED_KEYS.has(k));
      // `cost_status` de la proposition est nul pour la cliente (vérifié ci-dessous) ; `rateCents`, `cost`, etc. n'existent pas.
      expect(bad.filter((k) => k !== 'cost_status'), `${p} ${name}`).toEqual([]);
    }
    const text = JSON.stringify(reads);
    // Tarifs fictifs : aucune de leurs valeurs ne sort (23.4, 25.1, 27.8, 24.7 euros de l'heure, 2340 centimes, etc.).
    for (const rate of ['"hourly_rate_eur_ht"', '2340', '2510', '2780', '2470']) expect(text, `${p} ${rate}`).not.toContain(rate);
    const proposals = JSON.stringify((reads.thread as { proposals?: unknown[] } | null)?.proposals ?? []);
    expect(proposals).not.toMatch(/"cost_status":"(complete|partial|not_priced)"/);
  });
  it('contrôle négatif : le détecteur de clés de coût voit bien les coûts côté agence', async () => {
    const bad = [...keysOf({ b: await repo.getBudget(AGENCY()), n: await repo.getBudgetNeeds(AGENCY()) })].filter((k) => COST_KEY.test(k) && !ALLOWED_KEYS.has(k));
    expect(bad).toEqual(expect.arrayContaining(['consumed', 'forecast', 'landing', 'available', 'cost', 'rateCents']));
  });
  it('le journal budgétaire de la cliente ne contient que EV-28 (sans montant) et EV-51 (allocation) ; jamais EV-50 ni EV-52', async () => {
    await newNeed(sectors('CVR-ZV01')[0]!, 10, '2027-03-01', '2027-03-28');
    await repo.saveAllocation(AGENCY(), { campaign: 'CMP-DEMO-01', cvrId: cvr('CVR-ZV01').id, amountEur: 4100, motive: 'Test.' });
    for (const p of ['direction_client', 'dr_client'] as const) {
      const events = await repo.getBudgetEvents(ctxOf(p));
      expect(new Set(events.map((e) => e.code)).size).toBeGreaterThan(0);
      for (const e of events) {
        expect(['EV-28', 'EV-51'], `${p} ${e.code}`).toContain(e.code);
        if (e.code === 'EV-28') expect(Object.keys(e.data).filter((k) => /eur|cent|cost/i.test(k))).toEqual([]);
      }
    }
  });
  it('CVR et RS : le budget est vide partout, y compris pour un CVR suppléant', async () => {
    for (const p of ['cvr_client', 'rs'] as const) {
      const ctx = ctxOf(p);
      const b = await repo.getBudget(ctx);
      expect([b.lines.length, b.envelope, b.figures, b.allocated_cents]).toEqual([0, null, null, null]);
    }
    const delegate = ctxOf('cvr_client', { kind: 'cvr', ids: [cvr('CVR-WY02').id, cvr('CVR-ZV01').id] });
    expect((await repo.getBudget(delegate)).lines).toEqual([]);
  });
});

describe('revue A4b1 : l\'agence ne dépasse jamais l\'enveloppe (propriété sur 300 écritures)', () => {
  it('le total réparti reste borné, quelle que soit la suite d\'allocations et de versions', async () => {
    let seed = 20261028;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const campaigns = ['CMP-DEMO-01', 'CMP-DEMO-02', 'CMP-DEMO-03', 'CMP-DEMO-04'];
    const cvrs = zones.filter((z) => z.kind === 'cvr');
    for (let i = 0; i < 300; i++) {
      const r = rand();
      if (r < 0.1) {
        const env = (await repo.getBudget(AGENCY())).envelope!;
        await repo.setEnvelope(ctxOf('direction_client'), { amountEur: Math.round(rand() * 120_000 * 100) / 100 + 1, periodStart: env.period_start, periodEnd: env.period_end, motive: 'Fuzz.' });
      } else {
        await repo.saveAllocation(AGENCY(), {
          campaign: campaigns[Math.floor(rand() * 4)]!, cvrId: cvrs[Math.floor(rand() * cvrs.length)]!.id,
          amountEur: Math.round(rand() * 30_000 * 100) / 100, motive: 'Fuzz.',
        });
      }
      const b = await repo.getBudget(AGENCY());
      expect(b.allocated_cents).toBeLessThanOrEqual(Math.round(b.envelope!.amount_eur_ht * 100));
      expect(b.unallocated_cents).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('revue A4b1 : concurrence sur une même maille (S4)', () => {
  it('deux soumissions simultanées : aucun coût perdu ni compté deux fois, un seul besoin au-delà, une seule trace chacun', async () => {
    // Maille CMP-DEMO-04 x CVR-ZV01 : 2 000 euros alloués, 1 556,10 déjà comptés. Chaque besoin coûte 247 euros (10 h x 1 semaine x 24,70).
    const [s1, s2] = sectors('CVR-ZV01');
    const before = (await repo.getBudgetNeeds(AGENCY())).filter((r) => r.campaign === 'CMP-DEMO-04' && r.cvrId === cvr('CVR-ZV01').id);
    const sumBefore = before.reduce((s, r) => s + (r.cost.cents ?? 0), 0);
    const [a, b] = await Promise.all([newNeed(s1!, 10, '2027-03-01', '2027-03-07'), newNeed(s2!, 10, '2027-03-08', '2027-03-14')]);
    expect([a.status, b.status]).toEqual(['saved', 'saved']);
    const after = (await repo.getBudgetNeeds(AGENCY())).filter((r) => r.campaign === 'CMP-DEMO-04' && r.cvrId === cvr('CVR-ZV01').id);
    expect(after.length).toBe(before.length + 2);
    expect(after.reduce((s, r) => s + (r.cost.cents ?? 0), 0)).toBe(sumBefore + 2 * 24_700);
    const beyond = after.filter((r) => r.status === 'beyond');
    expect(beyond).toHaveLength(1);
    const codes = [a, b].map((r) => (r.status === 'saved' ? r.need.need_code : '')).sort();
    expect(beyond[0]!.needCode).toBe(codes[1]);
    const ev = (await repo.getBudgetEvents(AGENCY())).filter((e) => e.code === 'EV-28' && codes.includes(String(e.data.need_code)));
    expect(ev.map((e) => e.data.need_code)).toEqual([codes[1]]);
    const figures = (await repo.getBudget(AGENCY())).lines.find((l) => l.campaign_code === 'CMP-DEMO-04' && l.cvr.id === cvr('CVR-ZV01').id)!.figures!;
    expect(figures.landing).toBe(sumBefore + 2 * 24_700);
  });
  it('deux soumissions qui dépassent toutes les deux : deux traces, une par besoin', async () => {
    const [s1, s2] = sectors('CVR-ZV01');
    const [a, b] = await Promise.all([newNeed(s1!, 35, '2027-03-01', '2027-03-07'), newNeed(s2!, 35, '2027-03-08', '2027-03-14')]);
    expect([a.status, b.status]).toEqual(['saved', 'saved']);
    const codes = [a, b].map((r) => (r.status === 'saved' ? r.need.need_code : ''));
    const ev = (await repo.getBudgetEvents(AGENCY())).filter((e) => e.code === 'EV-28' && codes.includes(String(e.data.need_code)));
    expect(ev.map((e) => String(e.data.need_code)).sort()).toEqual([...codes].sort());
  });
  it('allocation et saisie simultanées : le total reste borné et la maille cohérente', async () => {
    const [s1] = sectors('CVR-ZV01');
    await Promise.all([
      newNeed(s1!, 35, '2027-03-01', '2027-03-28'),
      repo.saveAllocation(AGENCY(), { campaign: 'CMP-DEMO-04', cvrId: cvr('CVR-ZV01').id, amountEur: 9000, motive: 'Simultané.' }),
    ]);
    const b = await repo.getBudget(AGENCY());
    expect(b.allocated_cents).toBeLessThanOrEqual(10_000_000);
    const needs = await repo.getBudgetNeeds(AGENCY());
    expect(needs.filter((r) => r.status === 'beyond').length).toBeLessThanOrEqual(1);
  });
});

describe('revue A4b1 : séries 3 et 4 du jeu B (sous 3:1) absentes de tout le code applicatif', () => {
  it('aucun fichier de src, hors la définition des jetons, ne les emploie', () => {
    const files = walk(path.join(ROOT, 'src'), (f) => /\.(tsx|ts|css)$/.test(f) && !f.endsWith('chart-tokens.css'));
    const bad = files.filter((f) => /chart-[34]\b/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });
});
