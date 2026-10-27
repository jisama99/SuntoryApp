import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { PROFILE_IDS } from '@/domain/types';
import type { ProfileId, Scope } from '@/domain/types';
import type { RuleInput } from '@/domain/week-rules';
import { period } from './needs-util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const zone = (code: string) => zones.find((z) => z.code === code)!;
const ZV = zone('CVR-ZV01').id;
const WY = zone('CVR-WY02').id;
const BETA = zone('DR-BETA').id;
const sectorsOf = (cvr: string) => zones.filter((z) => z.kind === 'rs' && z.parent_id === cvr).map((z) => z.id);
const SECTOR_ZV = sectorsOf(ZV)[0]!;
const SECTOR_ZV2 = sectorsOf(ZV)[1]!;
const SECTOR_WY = sectorsOf(WY)[0]!;
const SECTOR_BETA = zones.find((z) => z.kind === 'rs' && zones.find((c) => c.id === z.parent_id)?.parent_id === BETA)!.id;
const ctxOf = (id: ProfileId, scope?: Scope) => buildAccessContext({ ...profiles.find((p) => p.id === id)!, ...(scope ? { scope } : {}) }, 'fr');
const TODAY = '2026-10-23';

beforeEach(() => resetDemoState());

async function input(sector: string, over: Partial<RuleInput> = {}): Promise<RuleInput> {
  const stores = (await repo.getStores(ctxOf('agency_operator'))).filter((s) => s.sector_id === sector).slice(0, 1).map((s) => s.code);
  return {
    dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: sector, position_label: 'Poste 3', weekly_hours: 14, priority: 2,
    periods: [period(1, '2027-03-01', '2027-03-07')], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: stores, client_comment: null, ...over,
  };
}
const save = async (ctx: ReturnType<typeof ctxOf>, sector: string, over: Partial<RuleInput> = {}) => repo.saveNeed(ctx, await input(sector, over));
const saved = (r: Awaited<ReturnType<typeof save>>) => {
  if (r.status !== 'saved') throw new Error(JSON.stringify(r));
  return r.need;
};
const events = async (code: string) => (await repo.getEvents(ctxOf('agency_admin'))).filter((e) => e.code === code);
const rowOf = async (ctx: ReturnType<typeof ctxOf>, id: string) => (await repo.getPipeline(ctx)).find((r) => r.need.id === id)!;

describe('matrice profil par périmètre par action (refus côté données)', () => {
  // [profil, périmètre, secteur visé, accepté ?]
  const cases: Array<[string, ProfileId, Scope | undefined, string, boolean]> = [
    ['RS sur son secteur', 'rs', undefined, SECTOR_ZV, true],
    ['RS sur un autre secteur', 'rs', undefined, SECTOR_ZV2, false],
    ['CVR sur un de ses secteurs', 'cvr_client', undefined, SECTOR_ZV2, true],
    ['CVR sur le secteur d\'un autre CVR', 'cvr_client', undefined, SECTOR_WY, false],
    ['CVR d\'une autre zone sur son secteur', 'cvr_client', { kind: 'cvr', ids: [WY] }, SECTOR_WY, true],
    ['DR sur un secteur de son périmètre', 'dr_client', undefined, SECTOR_WY, true],
    ['DR sur le secteur d\'un autre DR', 'dr_client', undefined, SECTOR_BETA, false],
    ['DR suppléant d\'une autre zone', 'dr_client', { kind: 'dr', ids: [BETA] }, SECTOR_BETA, true],
    ['direction sur tout secteur', 'direction_client', undefined, SECTOR_BETA, true],
    ['agence opération pour le compte d\'un RS', 'agency_operator', undefined, SECTOR_BETA, true],
    ['agence administration pour le compte d\'un RS', 'agency_admin', undefined, SECTOR_WY, true],
    ['prestataire (lecture seule)', 'provider_admin', undefined, SECTOR_ZV, false],
  ];
  it.each(cases)('%s', async (_name, profile, scope, sector, accepted) => {
    const ctx = ctxOf(profile, scope);
    const before = (await repo.getNeeds(ctxOf('agency_admin'))).length;
    const r = await save(ctx, sector);
    expect(r.status === 'saved', JSON.stringify(r)).toBe(accepted);
    expect((await repo.getNeeds(ctxOf('agency_admin'))).length).toBe(before + (accepted ? 1 : 0));
    if (!accepted) expect(r).toMatchObject({ status: 'refused', reason: profile === 'provider_admin' ? 'forbidden' : 'out_of_scope' });
  });

  it('canWriteNeeds suit la matrice, pour les sept profils', () => {
    const expected: Record<ProfileId, boolean> = {
      rs: true, cvr_client: true, dr_client: true, direction_client: true, agency_operator: true, agency_admin: true, provider_admin: false,
    };
    for (const id of PROFILE_IDS) expect(repo.canWriteNeeds(ctxOf(id)), id).toBe(expected[id]);
  });

  it('le secteur vient du périmètre : un CVR ne lit que les secteurs de son périmètre pour choisir', async () => {
    const own = await repo.getScopeZones(ctxOf('cvr_client'));
    const sectors = own.filter((z) => z.kind === 'rs').map((z) => z.id).sort();
    expect(sectors).toEqual(sectorsOf(ZV).sort());
    expect(own.some((z) => z.id === SECTOR_WY)).toBe(false);
  });

  it('saisie en lot et brouillon : mêmes droits que la saisie', async () => {
    expect(await repo.saveBatchDraft(ctxOf('cvr_client'), [])).toEqual({ status: 'ok' });
    expect(await repo.saveBatchDraft(ctxOf('provider_admin'), [])).toEqual({ status: 'refused', reason: 'forbidden' });
    const draft = await save(ctxOf('dr_client'), SECTOR_WY, { weekly_hours: null, periods: [] });
    expect(draft.status).toBe('saved');
    expect(saved(draft).need_state).toBe('draft');
  });
});

describe('saisie par le CVR, le DR et la direction : avis donné à la saisie', () => {
  it.each([['cvr_client', 'cvr'], ['dr_client', 'dr'], ['direction_client', 'dr']] as const)('%s : avis réputé donné, sans passage par un supérieur', async (profile, level) => {
    const n = saved(await save(ctxOf(profile), profile === 'cvr_client' ? SECTOR_ZV : SECTOR_WY));
    expect(n).toMatchObject({ on_behalf: false, entered_by_profile: profile, need_state: 'submitted' });
    const row = await rowOf(ctxOf('agency_admin'), n.id);
    expect(row.validation.state).toBe('validated');
    expect(row.validation.log).toHaveLength(1);
    expect(row.validation.log[0]).toMatchObject({ action: 'validate', level, by_profile: profile, at_entry: true, round: 1 });
    expect(row.validation.canAct).toBeNull();
    // Le besoin remonte à l'agence aussitôt.
    expect(row.next).toMatchObject({ actor: 'agency', action: 'qualify' });
    const ev = (await events('EV-49')).filter((e) => e.need_id === n.id);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ audience: 'both', actor_profile: profile });
    expect(ev[0]?.data).toMatchObject({ level, round: 1 });
    expect(await events('EV-48')).toHaveLength(0);
  });

  it('un brouillon du CVR ne porte aucun avis tant qu\'il n\'est pas soumis', async () => {
    const d = saved(await save(ctxOf('cvr_client'), SECTOR_ZV, { weekly_hours: null, periods: [] }));
    expect(d.need_state).toBe('draft');
    expect((await events('EV-49')).filter((e) => e.need_id === d.id)).toHaveLength(0);
    const done = await repo.saveNeed(ctxOf('cvr_client'), await input(SECTOR_ZV), { needId: d.id });
    expect(saved(done).need_state).toBe('submitted');
    expect((await rowOf(ctxOf('agency_admin'), d.id)).validation.state).toBe('validated');
  });

  it('un besoin saisi par un RS reste « à valider » : avis facultatif, jamais bloquant', async () => {
    const n = saved(await save(ctxOf('rs'), SECTOR_ZV));
    const row = await rowOf(ctxOf('agency_admin'), n.id);
    expect(row.validation).toMatchObject({ state: 'to_validate', log: [] });
    expect(row.next).toMatchObject({ actor: 'agency', action: 'qualify' });
    expect(await events('EV-49')).toHaveLength(0);
    expect(await repo.qualifyNeed(ctxOf('agency_operator'), n.id, { outcome: 'take' })).toEqual({ status: 'ok' });
  });

  it('la cliente suit le statut : le CVR et le RS voient l\'avis donné à la saisie, jamais de coût ni de note interne', async () => {
    const n = saved(await save(ctxOf('cvr_client'), SECTOR_ZV));
    for (const ctx of [ctxOf('cvr_client'), ctxOf('dr_client'), ctxOf('rs')]) {
      const t = await repo.getNeedThread(ctx, n.id);
      expect(t?.row.validation.log[0]?.at_entry).toBe(true);
      expect(t?.notes).toEqual([]);
      expect(JSON.stringify(t)).not.toMatch(/cost_status":"(complete|partial|not_priced)/);
    }
    for (const e of await repo.getEvents(ctxOf('rs'))) expect(e.audience).not.toBe('agency');
  });

  it('un CVR qui saisit ne peut pas ensuite valider ni escalader son propre besoin : rien à faire', async () => {
    const n = saved(await save(ctxOf('cvr_client'), SECTOR_ZV));
    expect(await repo.validateNeed(ctxOf('cvr_client'), n.id, { outcome: 'validate' })).toMatchObject({ reason: 'not_pending' });
  });
});

describe('saisie pour le compte d\'un RS par l\'agence : tracée', () => {
  it.each(['agency_operator', 'agency_admin'] as const)('%s : indicateur, événement distinct (qui, pour quel secteur, quand)', async (profile) => {
    const n = saved(await save(ctxOf(profile), SECTOR_WY));
    expect(n).toMatchObject({ on_behalf: true, entered_by_profile: profile, sector_id: SECTOR_WY });
    const ev = (await events('EV-48')).filter((e) => e.need_id === n.id);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ audience: 'both', actor_profile: profile, zone_id: SECTOR_WY, effect_date: TODAY, recorded_at: TODAY });
    // La cliente le lit, le RS du secteur comprend qui a saisi pour lui.
    expect((await repo.getEvents(ctxOf('cvr_client', { kind: 'cvr', ids: [WY] }))).some((e) => e.code === 'EV-48' && e.need_id === n.id)).toBe(true);
    // Le besoin saisi par l'agence reste « à valider » (avis facultatif), sans avis donné à la saisie.
    expect((await rowOf(ctxOf('agency_admin'), n.id)).validation).toMatchObject({ state: 'to_validate', log: [] });
  });

  it('aucun autre profil ne saisit pour le compte d\'un autre', async () => {
    const starts = ['2027-05-03', '2027-06-07', '2027-07-05', '2027-08-02'];
    for (const [i, profile] of (['rs', 'cvr_client', 'dr_client', 'direction_client'] as const).entries()) {
      const start = starts[i]!;
      const n = saved(await save(ctxOf(profile), profile === 'rs' || profile === 'cvr_client' ? SECTOR_ZV : SECTOR_WY, { periods: [period(1, start, start.replace(/-\d\d$/, (d) => `-${String(Number(d.slice(1)) + 6).padStart(2, '0')}`))] }));
      expect(n.on_behalf, profile).toBe(false);
    }
    expect(await events('EV-48')).toHaveLength(0);
  });

  it('le secteur est obligatoire : un secteur inconnu ou absent est refusé', async () => {
    const r = await repo.saveNeed(ctxOf('agency_operator'), { ...(await input(SECTOR_WY)), sector_id: crypto.randomUUID() });
    expect(r).toMatchObject({ status: 'refused', reason: 'out_of_scope' });
  });
});

describe('mêmes règles quel que soit le saisissant (doublons, échéances, paramètres de dispositif)', () => {
  it('doublon exact : même issue pour un RS et pour un CVR', async () => {
    const first = await save(ctxOf('rs'), SECTOR_ZV);
    expect(first.status).toBe('saved');
    const byRs = await save(ctxOf('rs'), SECTOR_ZV);
    const byCvr = await save(ctxOf('cvr_client'), SECTOR_ZV);
    expect(byCvr.status).toBe(byRs.status);
    expect(byRs.status).not.toBe('saved');
    expect(byCvr.status === 'refused' ? byCvr.findings.map((f) => f.rule) : []).toEqual(byRs.status === 'refused' ? byRs.findings.map((f) => f.rule) : []);
  });

  it('échéance dépassée : même blocage pour tous les profils qui saisissent', async () => {
    const late = { periods: [period(1, '2026-11-02', '2026-11-08')] };
    const results = [];
    for (const profile of ['rs', 'cvr_client', 'dr_client', 'direction_client', 'agency_operator'] as const) {
      const r = await save(ctxOf(profile), SECTOR_ZV, late);
      results.push(r.status === 'refused' ? `${r.reason}:${r.findings.map((f) => f.rule).sort().join(',')}` : r.status);
    }
    expect(new Set(results).size).toBe(1);
  });

  it('P6 : un rôle de saisie propre au dispositif s\'applique au CVR comme aux autres', async () => {
    const slot = { dispositif: 'second_placement' as const, campaign_code: 'CMP-DEMO-04' };
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'entry_roles', ['rs', 'agency_admin']);
    const refused = await save(ctxOf('cvr_client'), SECTOR_ZV, slot);
    expect(refused.status === 'refused' && refused.findings.some((f) => f.rule === 'P6')).toBe(true);
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'entry_roles', ['rs', 'cvr_client', 'agency_admin']);
    expect((await save(ctxOf('cvr_client'), SECTOR_ZV, slot)).status).toBe('saved');
  });

  it('nouvelle soumission d\'un besoin refusé : réservée au RS et à l\'agence, pas au CVR qui saisit', async () => {
    const n = saved(await save(ctxOf('rs'), SECTOR_ZV));
    await repo.validateNeed(ctxOf('cvr_client'), n.id, { outcome: 'refuse', motive: 'Heures trop élevées.' });
    expect(await repo.resubmitNeed(ctxOf('cvr_client'), n.id)).toMatchObject({ reason: 'forbidden' });
    expect(await repo.resubmitNeed(ctxOf('rs'), n.id)).toEqual({ status: 'ok' });
  });

  it('la saisie est annulable (D159) pour un CVR comme pour un RS', async () => {
    const ctx = ctxOf('cvr_client');
    const before = (await repo.getNeeds(ctx)).length;
    const { undoToken } = await repo.withUndo(ctx, async () => save(ctx, SECTOR_ZV), (r) => r.status === 'saved');
    expect((await repo.getNeeds(ctx)).length).toBe(before + 1);
    expect(await repo.undoWrite(ctx, undoToken!)).toEqual({ status: 'ok' });
    expect((await repo.getNeeds(ctx)).length).toBe(before);
  });
});
