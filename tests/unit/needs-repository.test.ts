import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import { BusinessEventSchema, ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext, zoneInScope } from '@/domain/access';
import { PROFILE_IDS } from '@/domain/types';
import type { ProfileId } from '@/domain/types';
import type { RuleInput } from '@/domain/week-rules';
import { period } from './needs-util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const ctxOf = (id: ProfileId) => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr');
const rsZones = zones.filter((z) => z.kind === 'rs');
// Secteur du profil RS de démonstration, un autre secteur, et le secteur sans besoin ni magasin.
const OWN = (ctxOf('rs').scope as { ids: string[] }).ids[0]!;
const OTHER = rsZones.find((z) => z.id !== OWN)!.id;
const NO_NEED = rsZones[11]!.id;

async function storeCodes(id: ProfileId, sector: string, n = 1) {
  const all = await repo.getStores(ctxOf(id));
  return all.filter((s) => s.sector_id === sector).slice(0, n).map((s) => s.code);
}

async function complete(sector: string, over: Partial<RuleInput> = {}): Promise<RuleInput> {
  return {
    dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04', sector_id: sector, position_label: 'Poste 6',
    weekly_hours: 14, priority: 2, periods: [period(1, '2027-03-01', '2027-03-07')], days: [1, 2, 3], hours_slot: '08:00-12:00',
    store_codes: await storeCodes('agency_operator', sector), client_comment: null, ...over,
  };
}

beforeEach(() => resetDemoState());

describe('lecture : chaque profil ne reçoit que son périmètre (couche données, pas écran)', () => {
  for (const id of PROFILE_IDS) {
    it(`${id} : aucun besoin ni magasin hors périmètre`, async () => {
      const ctx = ctxOf(id);
      const needs = await repo.getNeeds(ctx);
      expect(needs.length).toBeGreaterThan(0);
      for (const n of needs) expect(zoneInScope(zones, n.sector_id, ctx.scope)).toBe(true);
      for (const s of await repo.getStores(ctx)) {
        if (s.sector_id !== null) expect(zoneInScope(zones, s.sector_id, ctx.scope)).toBe(true);
        else expect(ctx.side).not.toBe('client');
      }
    });
  }

  it('un RS ne lit pas le besoin d\'un autre secteur, même en connaissant son identifiant', async () => {
    const all = await repo.getNeeds(ctxOf('agency_operator'));
    const foreign = all.find((n) => n.sector_id !== OWN)!;
    expect(await repo.getNeed(ctxOf('rs'), foreign.id)).toBeNull();
    expect((await repo.getNeeds(ctxOf('rs'))).every((n) => n.sector_id === OWN)).toBe(true);
  });

  it('l\'agence voit tous les secteurs, le DR seulement les siens', async () => {
    const agency = new Set((await repo.getNeeds(ctxOf('agency_operator'))).map((n) => n.sector_id));
    const dr = new Set((await repo.getNeeds(ctxOf('dr_client'))).map((n) => n.sector_id));
    expect(dr.size).toBeLessThan(agency.size);
  });

  it('les totaux excluent les brouillons', async () => {
    const t = await repo.getNeedTotals(ctxOf('agency_operator'));
    const all = await repo.getNeeds(ctxOf('agency_operator'));
    const submitted = all.filter((n) => n.need_state === 'submitted');
    expect(t.submitted).toBe(submitted.length);
    expect(t.drafts).toBe(all.length - submitted.length);
    expect(t.drafts).toBeGreaterThanOrEqual(2);
    expect(t.weekly_hours).toBe(submitted.reduce((s, n) => s + (n.weekly_hours ?? 0), 0));
  });

  it('le secteur sans besoin existe dans le référentiel', async () => {
    const all = await repo.getNeeds(ctxOf('agency_operator'));
    expect(all.some((n) => n.sector_id === NO_NEED)).toBe(false);
  });
});

describe('écriture : périmètre et rôle', () => {
  it('un RS ne saisit pas hors de son secteur', async () => {
    const before = (await repo.getNeeds(ctxOf('agency_operator'))).length;
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OTHER, { store_codes: [] }));
    expect(r.status).toBe('refused');
    expect(r.status === 'refused' && r.reason).toBe('out_of_scope');
    expect((await repo.getNeeds(ctxOf('agency_operator'))).length).toBe(before);
  });

  it.each(['provider_admin'] as const)('%s ne saisit pas (lecture seule)', async (id) => {
    expect(repo.canWriteNeeds(ctxOf(id))).toBe(false);
    const r = await repo.saveNeed(ctxOf(id), await complete(OWN));
    expect(r.status === 'refused' && r.reason).toBe('forbidden');
  });

  it('un RS saisit sur son secteur, l\'agence saisit pour le compte d\'un RS', async () => {
    const own = await repo.saveNeed(ctxOf('rs'), await complete(OWN));
    expect(own.status === 'saved' && own.need.on_behalf).toBe(false);
    const agency = await repo.saveNeed(ctxOf('agency_operator'), await complete(OTHER, { periods: [period(1, '2027-03-08', '2027-03-14')] }));
    expect(agency.status === 'saved' && agency.need.on_behalf).toBe(true);
    expect(agency.status === 'saved' && agency.need.entered_by_profile).toBe('agency_operator');
  });

  it('un RS ne choisit que des magasins de son secteur', async () => {
    const foreignStores = await storeCodes('agency_operator', OTHER);
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN, { store_codes: foreignStores }));
    expect(r.status === 'refused' && r.reason).toBe('invalid_store');
  });

  it('un magasin sans rattachement n\'est pas offert à la cliente', async () => {
    const unattached = (await repo.getStores(ctxOf('agency_operator'))).filter((s) => s.sector_id === null);
    expect(unattached.length).toBe(3);
    expect((await repo.getStores(ctxOf('rs'))).some((s) => s.sector_id === null)).toBe(false);
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN, { store_codes: [unattached[0]!.code] }));
    expect(r.status === 'refused' && r.reason).toBe('invalid_store');
  });

  it('la campagne doit relever du dispositif choisi', async () => {
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN, { campaign_code: 'CMP-DEMO-02' }));
    expect(r.status === 'refused' && r.reason).toBe('campaign_mismatch');
  });
});

describe('écriture : règles de semaine et de doublon appliquées par la couche données', () => {
  it('besoin complet : soumis, avec EV-01 et EV-02 d\'audience both', async () => {
    const before = (await repo.getEvents(ctxOf('agency_operator'))).length;
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN));
    expect(r.status === 'saved' && r.decision).toBe('submit');
    const events = (await repo.getEvents(ctxOf('agency_operator'))).slice(0, (await repo.getEvents(ctxOf('agency_operator'))).length - before);
    expect(events.map((e) => e.code).sort()).toEqual(['EV-01', 'EV-02']);
    expect(events.every((e) => e.audience === 'both')).toBe(true);
  });

  it('besoin incomplet : brouillon exclu des totaux, jamais soumis', async () => {
    const totals0 = await repo.getNeedTotals(ctxOf('rs'));
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN, { periods: [], weekly_hours: null }));
    expect(r.status === 'saved' && r.decision).toBe('draft');
    expect(r.status === 'saved' && r.need.need_state).toBe('draft');
    const totals1 = await repo.getNeedTotals(ctxOf('rs'));
    expect(totals1.weekly_hours).toBe(totals0.weekly_hours);
    expect(totals1.submitted).toBe(totals0.submitted);
    expect(totals1.drafts).toBe(totals0.drafts + 1);
  });

  it('un brouillon se complète puis devient soumis (EV-02 émis une seule fois)', async () => {
    const d = await repo.saveNeed(ctxOf('rs'), await complete(OWN, { periods: [] }));
    if (d.status !== 'saved') throw new Error('brouillon attendu');
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN), { needId: d.need.id });
    expect(r.status === 'saved' && r.decision).toBe('submit');
    expect(r.status === 'saved' && r.need.id).toBe(d.need.id);
    expect(r.status === 'saved' && r.need.record_version).toBe(2);
    const ev2 = (await repo.getEvents(ctxOf('agency_operator'))).filter((e) => e.need_id === d.need.id && e.code === 'EV-02');
    expect(ev2).toHaveLength(1);
  });

  it('un besoin soumis ne se réécrit pas par la voie du brouillon', async () => {
    const submitted = (await repo.getNeeds(ctxOf('rs'))).find((n) => n.need_state === 'submitted')!;
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN), { needId: submitted.id });
    expect(r.status === 'refused' && r.reason).toBe('not_draft');
  });

  it('semaine clôturée : refus, rien n\'est écrit (W12)', async () => {
    const before = (await repo.getNeeds(ctxOf('agency_operator'))).length;
    const r = await repo.saveNeed(ctxOf('rs'), await complete(OWN, { periods: [period(1, '2026-10-05', '2026-10-11')] }));
    expect(r.status === 'refused' && r.reason).toBe('blocked');
    expect(r.findings.some((f) => f.rule === 'W12' && f.gravity === 'blocking')).toBe(true);
    expect((await repo.getNeeds(ctxOf('agency_operator'))).length).toBe(before);
  });

  it('doublon exact : refus avec renvoi vers le besoin existant visible du RS (D1)', async () => {
    const first = await repo.saveNeed(ctxOf('rs'), await complete(OWN));
    if (first.status !== 'saved') throw new Error('premier besoin attendu');
    const again = await repo.saveNeed(ctxOf('rs'), await complete(OWN));
    expect(again.status === 'refused' && again.reason).toBe('blocked');
    const d1 = again.findings.find((f) => f.rule === 'D1')!;
    expect(d1.relatedNeedId).toBe(first.need.id);
    expect(d1.relatedVisible).toBe(true);
  });

  it('alerte : confirmation demandée sans écriture, puis écriture une fois confirmée', async () => {
    const dominical = await complete(OWN, { periods: [period(1, '2027-03-07', '2027-03-13')] });
    const before = (await repo.getNeeds(ctxOf('agency_operator'))).length;
    const first = await repo.saveNeed(ctxOf('rs'), dominical);
    expect(first.status).toBe('needs_confirmation');
    expect((await repo.getNeeds(ctxOf('agency_operator'))).length).toBe(before);
    const second = await repo.saveNeed(ctxOf('rs'), dominical, { confirm: true });
    expect(second.status).toBe('saved');
    expect((await repo.getNeeds(ctxOf('agency_operator'))).length).toBe(before + 1);
  });

  it('2026-S53 puis 2027-S01 : la saisie à cheval sur deux années est enregistrée avec les deux semaines ISO', async () => {
    const r = await repo.saveNeed(ctxOf('agency_operator'), await complete(NO_NEED, { dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', store_codes: [], periods: [{ period_no: 1, start_date: '2026-12-28', end_date: '2027-01-10', start_week: null, end_week: null }] }));
    expect(r.status).toBe('saved');
    if (r.status !== 'saved') return;
    expect(r.need.periods[0]).toMatchObject({ start_week: '2026-S53', end_week: '2027-S01' });
  });

  it('un besoin saisi par semaine seule reçoit ses dates', async () => {
    const r = await repo.saveNeed(ctxOf('agency_operator'), await complete(NO_NEED, { dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', store_codes: [], periods: [{ period_no: 1, start_date: null, end_date: null, start_week: '2027-S10', end_week: null }] }));
    if (r.status !== 'saved') throw new Error(JSON.stringify(r));
    expect(r.need.periods[0]).toMatchObject({ start_date: '2027-03-08', end_date: '2027-03-14', end_week: '2027-S10' });
  });
});

describe('duplication et fusion', () => {
  it('duplique avec décalage : durée conservée, semaines recalculées', async () => {
    const src = (await repo.getNeeds(ctxOf('rs'))).find((n) => n.need_state === 'submitted' && n.periods.length === 1)!;
    const r = await repo.duplicateNeed(ctxOf('rs'), src.id, '2027-04-05', { confirm: true });
    if (r.status !== 'saved') throw new Error(JSON.stringify(r));
    expect(r.need.id).not.toBe(src.id);
    expect(r.need.periods[0]!.start_date).toBe('2027-04-05');
    expect(r.need.weekly_hours).toBe(src.weekly_hours);
    expect(r.need.periods[0]!.start_week).toBe('2027-S14');
  });

  it('duplication sans décalage : doublon exact bloquant (D1)', async () => {
    const src = (await repo.getNeeds(ctxOf('rs'))).find((n) => n.need_state === 'submitted' && n.periods.length === 1)!;
    const r = await repo.duplicateNeed(ctxOf('rs'), src.id, src.periods[0]!.start_date!, { confirm: true });
    expect(r.status === 'refused' && r.findings.some((f) => f.rule === 'D1')).toBe(true);
  });

  it('un RS ne duplique pas le besoin d\'un autre secteur', async () => {
    const foreign = (await repo.getNeeds(ctxOf('agency_operator'))).find((n) => n.sector_id !== OWN)!;
    const r = await repo.duplicateNeed(ctxOf('rs'), foreign.id, '2027-04-05');
    expect(r.status === 'refused' && r.reason).toBe('not_found');
  });

  it('on ne duplique pas un brouillon sans période', async () => {
    const draft = (await repo.getNeeds(ctxOf('agency_operator'))).find((n) => n.periods.length === 0)!;
    const r = await repo.duplicateNeed(ctxOf('agency_operator'), draft.id, '2027-04-05');
    expect(r.status === 'refused' && r.reason).toBe('no_period');
  });

  it('fusion : la période du besoin existant est étendue, aucun besoin créé', async () => {
    const first = await repo.saveNeed(ctxOf('rs'), await complete(OWN));
    if (first.status !== 'saved') throw new Error('besoin attendu');
    const before = (await repo.getNeeds(ctxOf('agency_operator'))).length;
    const overlap = await complete(OWN, { periods: [period(1, '2027-03-05', '2027-03-15')], weekly_hours: 21 });
    const r = await repo.saveNeed(ctxOf('rs'), overlap, { mergeInto: first.need.id });
    if (r.status !== 'saved') throw new Error(JSON.stringify(r));
    expect(r.decision).toBe('merge');
    expect(r.need.id).toBe(first.need.id);
    expect(r.need.periods[0]).toMatchObject({ start_date: '2027-03-01', end_date: '2027-03-15' });
    expect(r.need.record_version).toBe(2);
    expect((await repo.getNeeds(ctxOf('agency_operator'))).length).toBe(before);
  });
});

describe('journal d\'événements (D91) : audience obligatoire et filtrage', () => {
  it('toute entrée du journal a une audience, et une entrée sans audience est invalide', async () => {
    const events = await repo.getEvents(ctxOf('agency_admin'));
    expect(events.length).toBeGreaterThan(50);
    for (const e of events) expect(['agency', 'client', 'both']).toContain(e.audience);
    const without: Record<string, unknown> = { ...events[0]! };
    delete without.audience;
    expect(BusinessEventSchema.safeParse(without).success).toBe(false);
  });

  it('une anomalie (EV-05) est réservée à l\'agence, aucun profil cliente ne la reçoit', async () => {
    await repo.saveNeed(ctxOf('rs'), await complete(OWN, { periods: [period(1, '2026-10-05', '2026-10-11')] }));
    const agency = await repo.getEvents(ctxOf('agency_operator'));
    expect(agency.some((e) => e.code === 'EV-05' && e.audience === 'agency')).toBe(true);
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs'] as const) {
      const got = await repo.getEvents(ctxOf(id));
      expect(got.every((e) => e.audience !== 'agency')).toBe(true);
      expect(got.some((e) => e.code === 'EV-05')).toBe(false);
    }
  });

  it('un RS ne reçoit que les événements de son secteur', async () => {
    for (const e of await repo.getEvents(ctxOf('rs'))) expect(e.zone_id).toBe(OWN);
  });

  it('les numéros de séquence sont uniques et croissants', async () => {
    await repo.saveNeed(ctxOf('rs'), await complete(OWN));
    const seqs = (await repo.getEvents(ctxOf('agency_admin'))).map((e) => e.seq).sort((a, b) => a - b);
    expect(new Set(seqs).size).toBe(seqs.length);
  });
});
