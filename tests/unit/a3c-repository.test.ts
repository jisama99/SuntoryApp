import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState, setEnvelopeEvaluator, setTimeSource } from '@/data/memory-repository';
import type { Need } from '@/data/schemas';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { AUDIENCES } from '@/domain/types';
import type { ProfileId, Scope } from '@/domain/types';
import { period } from './needs-util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const zone = (code: string) => zones.find((z) => z.code === code)!;
const ZV = zone('CVR-ZV01').id;
const WY = zone('CVR-WY02').id;
const GP = zone('CVR-GP03').id;
const NM = zone('CVR-NM04').id;
const ALPHA = zone('DR-ALPHA').id;
const BETA = zone('DR-BETA').id;
const OWN = zones.find((z) => z.kind === 'rs' && z.parent_id === ZV)!.id;

/** Contexte d'un profil de démonstration, avec un périmètre propre quand on joue un autre CVR ou DR (comptes DemoCVR02, DemoDR02…). */
const ctxOf = (id: ProfileId, scope?: Scope) => buildAccessContext({ ...profiles.find((p) => p.id === id)!, ...(scope ? { scope } : {}) }, 'fr');
const AG = () => ctxOf('agency_operator');
const ADMIN = () => ctxOf('agency_admin');
const RS = () => ctxOf('rs');
const CVR1 = () => ctxOf('cvr_client');
const CVR2 = () => ctxOf('cvr_client', { kind: 'cvr', ids: [WY] });
const CVR3 = () => ctxOf('cvr_client', { kind: 'cvr', ids: [GP] });
const DR1 = () => ctxOf('dr_client');
const DR2 = () => ctxOf('dr_client', { kind: 'dr', ids: [BETA] });
const DIR = () => ctxOf('direction_client');
const TODAY = '2026-10-23';

beforeEach(() => { resetDemoState(); setTimeSource(); setEnvelopeEvaluator(); });

const row = async (code: string, ctx = AG()) => (await repo.getPipeline(ctx)).find((r) => r.need.need_code === code)!;
const idOf = async (code: string) => (await row(code)).need.id;
const events = async (ctx = ADMIN()) => repo.getEvents(ctx);
const eventsOf = async (code: string, ctx = ADMIN()) => (await events(ctx)).filter((e) => e.code === code);

async function submitNeed(): Promise<Need> {
  const stores = (await repo.getStores(AG())).filter((s) => s.sector_id === OWN).slice(0, 1).map((s) => s.code);
  const r = await repo.saveNeed(RS(), {
    dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: OWN, position_label: 'Poste 4', weekly_hours: 14, priority: 2,
    periods: [period(1, '2026-12-07', '2026-12-13')], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: stores, client_comment: null,
  });
  if (r.status !== 'saved' || r.decision !== 'submit') throw new Error(JSON.stringify(r));
  return r.need;
}

describe('jeu de démonstration A3c', () => {
  it('huit besoins du circuit : états de départ, besoins plus anciens réputés validés (D209)', async () => {
    const expected: Record<string, string> = {
      'BES-DEMO-030': 'to_validate', 'BES-DEMO-031': 'to_validate', 'BES-DEMO-032': 'to_validate', 'BES-DEMO-033': 'to_validate',
      'BES-DEMO-034': 'to_validate', 'BES-DEMO-035': 'escalated', 'BES-DEMO-036': 'refused', 'BES-DEMO-037': 'to_validate',
      'BES-DEMO-001': 'validated', 'BES-DEMO-011': 'validated', 'BES-DEMO-013': 'validated',
    };
    for (const [code, state] of Object.entries(expected)) expect((await row(code)).validation.state, code).toBe(state);
  });

  it('aucune délégation en cours au départ : les périmètres des lots précédents ne bougent pas', async () => {
    const d = await repo.getDelegations(ADMIN());
    expect(d.map((x) => x.status).sort()).toEqual(['ended', 'planned', 'revoked']);
    expect((await repo.getPipeline(CVR2())).every((r) => r.need.sector_id !== OWN)).toBe(true);
  });
});

describe('scénario 1 : le CVR valide dans son périmètre', () => {
  it('le besoin passe à « validé », l\'agence peut alors le qualifier, pas avant', async () => {
    const id = await idOf('BES-DEMO-030');
    expect(await repo.qualifyNeed(AG(), id, { outcome: 'take' })).toMatchObject({ status: 'refused', reason: 'not_validated' });
    expect((await row('BES-DEMO-030')).next).toMatchObject({ actor: 'validator', action: 'validate_need' });
    expect((await row('BES-DEMO-030', CVR1())).validation.canAct).toMatchObject({ level: 'cvr', zoneId: ZV, byZoneId: null });
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'validate' })).toEqual({ status: 'ok' });
    const after = await row('BES-DEMO-030');
    expect(after.validation).toMatchObject({ state: 'validated', round: 1 });
    expect(after.validation.log).toHaveLength(1);
    expect(after.validation.log[0]).toMatchObject({ action: 'validate', level: 'cvr', by_profile: 'cvr_client', zone_id: ZV, by_zone_id: null, delegation_id: null });
    expect(after.next).toMatchObject({ actor: 'agency', action: 'qualify' });
    expect(await repo.qualifyNeed(AG(), id, { outcome: 'take' })).toEqual({ status: 'ok' });
    const ev = await eventsOf('EV-06');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ audience: 'both', need_id: id, actor_profile: 'cvr_client' });
  });

  it('un nouveau besoin soumis par le RS entre « à valider » avec son échéance, un brouillon n\'y entre pas', async () => {
    const n = await submitNeed();
    const r = await row(n.need_code);
    expect(r.validation).toMatchObject({ state: 'to_validate', round: 1, since: TODAY });
    expect(r.next).toMatchObject({ actor: 'validator', action: 'validate_need', due: '2026-10-27' });
    expect(await repo.validateNeed(CVR1(), n.id, { outcome: 'validate' })).toEqual({ status: 'ok' });
  });

  it('une seule validation : un besoin déjà traité n\'attend plus rien', async () => {
    const id = await idOf('BES-DEMO-030');
    await repo.validateNeed(CVR1(), id, { outcome: 'validate' });
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'validate' })).toMatchObject({ reason: 'not_pending' });
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'refuse', motive: 'Trop tard' })).toMatchObject({ reason: 'not_pending' });
    expect(await eventsOf('EV-06')).toHaveLength(1);
  });
});

describe('scénario 2 : le CVR refuse avec motif, puis nouvelle soumission', () => {
  it('motif obligatoire, refus tracé, le RS soumet de nouveau, un nouveau tour s\'ouvre et se valide', async () => {
    const id = await idOf('BES-DEMO-031');
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'refuse' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'refuse', motive: '  ' })).toMatchObject({ reason: 'motive_required' });
    expect((await row('BES-DEMO-031')).validation.state).toBe('to_validate');
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'refuse', motive: 'Heures supérieures au besoin du secteur.' })).toEqual({ status: 'ok' });
    const refused = await row('BES-DEMO-031');
    expect(refused.validation.state).toBe('refused');
    expect(refused.next).toMatchObject({ actor: 'rs', action: 'resubmit_need', due: null });
    // L'agence ne peut pas qualifier un besoin refusé ; seul le RS ou l'agence le soumet de nouveau.
    expect(await repo.qualifyNeed(AG(), id, { outcome: 'take' })).toMatchObject({ reason: 'not_validated' });
    expect((await row('BES-DEMO-031', CVR1())).validation.canResubmit).toBe(false);
    expect(await repo.resubmitNeed(CVR1(), id)).toMatchObject({ reason: 'forbidden' });
    expect((await row('BES-DEMO-031', RS())).validation.canResubmit).toBe(true);
    expect(await repo.resubmitNeed(RS(), id)).toEqual({ status: 'ok' });
    const again = await row('BES-DEMO-031');
    expect(again.validation).toMatchObject({ state: 'to_validate', round: 2, since: TODAY });
    expect(again.validation.log.map((e) => `${e.round}:${e.action}`)).toEqual(['1:refuse', '2:resubmit']);
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'validate' })).toEqual({ status: 'ok' });
    expect((await row('BES-DEMO-031')).validation.log.map((e) => `${e.round}:${e.action}`)).toEqual(['1:refuse', '2:resubmit', '2:validate']);
    const mine = async (code: string) => (await eventsOf(code as 'EV-08')).filter((e) => e.need_id === id);
    expect(await mine('EV-08')).toHaveLength(1);
    expect(await mine('EV-47')).toHaveLength(1);
    expect(await mine('EV-06')).toHaveLength(1);
  });

  it('la nouvelle soumission n\'existe que pour un besoin refusé', async () => {
    expect(await repo.resubmitNeed(RS(), await idOf('BES-DEMO-031'))).toMatchObject({ reason: 'not_refused' });
    expect(await repo.resubmitNeed(RS(), await idOf('BES-DEMO-030'))).toMatchObject({ reason: 'not_found' }); // secteur d'un autre RS
    expect(await repo.resubmitNeed(RS(), crypto.randomUUID())).toMatchObject({ reason: 'not_found' });
    expect(await repo.resubmitNeed(AG(), await idOf('BES-DEMO-036'))).toEqual({ status: 'ok' });
  });
});

describe('scénario 3 : escalade au DR hors périmètre', () => {
  it('le CVR escalade avec un motif ; lui n\'agit plus, le DR arbitre', async () => {
    const id = await idOf('BES-DEMO-032');
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'escalate', reason: 'out_of_perimeter' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'escalate', motive: 'Secteur hors de mon périmètre.' })).toMatchObject({ reason: 'invalid_reason' });
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'escalate', reason: 'out_of_perimeter', motive: 'Secteur hors de mon périmètre.' })).toEqual({ status: 'ok' });
    const r = await row('BES-DEMO-032');
    expect(r.validation).toMatchObject({ state: 'escalated', escalation: { reason: 'out_of_perimeter', trigger: 'manual', other_zone_id: null } });
    expect(r.next).toMatchObject({ actor: 'arbiter', action: 'arbitrate_need' });
    expect((await row('BES-DEMO-032', CVR1())).validation.canAct).toBeNull();
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'validate' })).toMatchObject({ reason: 'forbidden' });
    expect((await row('BES-DEMO-032', DR1())).validation.canAct).toMatchObject({ level: 'dr', zoneId: ALPHA });
    expect(await repo.validateNeed(DR1(), id, { outcome: 'validate' })).toEqual({ status: 'ok' });
    expect((await row('BES-DEMO-032')).validation.state).toBe('validated');
    const ev = (await events()).filter((e) => e.need_id === id).map((e) => `${e.code}:${e.data.action ?? ''}`);
    expect(ev).toEqual(expect.arrayContaining(['EV-07:arbitrated', 'EV-07:escalated']));
    expect(ev.filter((e) => e.startsWith('EV-07'))).toHaveLength(2);
  });

  it('le DR ne valide pas avant l\'escalade ; le DR d\'une autre zone ne voit pas le besoin', async () => {
    const id = await idOf('BES-DEMO-032');
    expect(await repo.validateNeed(DR1(), id, { outcome: 'validate' })).toMatchObject({ reason: 'forbidden' });
    await repo.validateNeed(CVR1(), id, { outcome: 'escalate', reason: 'out_of_perimeter', motive: 'Hors périmètre.' });
    expect(await repo.validateNeed(DR2(), id, { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.getNeedThread(DR2(), id)).toBeNull();
    expect((await row('BES-DEMO-032')).validation.state).toBe('escalated');
  });

  it('le DR peut aussi refuser, avec un motif obligatoire, et le besoin revient au RS', async () => {
    const id = await idOf('BES-DEMO-035'); // escaladé au départ
    expect(await repo.validateNeed(DR1(), id, { outcome: 'refuse' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.validateNeed(DR1(), id, { outcome: 'escalate', motive: 'x', reason: 'out_of_perimeter' })).toMatchObject({ reason: 'invalid' });
    expect(await repo.validateNeed(DR1(), id, { outcome: 'refuse', motive: 'Poste déjà couvert.' })).toEqual({ status: 'ok' });
    const r = await row('BES-DEMO-035');
    expect(r.validation.state).toBe('refused');
    expect(r.validation.log.at(-1)).toMatchObject({ action: 'refuse', level: 'dr' });
    expect(r.next.actor).toBe('rs');
  });

  it('la direction cliente arbitre aussi un besoin escaladé', async () => {
    expect(await repo.validateNeed(DIR(), await idOf('BES-DEMO-035'), { outcome: 'validate' })).toEqual({ status: 'ok' });
  });
});

describe('scénario 4 : arbitrage entre deux CVR', () => {
  it('l\'autre CVR est désigné, sous le même DR et distinct ; le DR tranche', async () => {
    const id = await idOf('BES-DEMO-033');
    const base = { outcome: 'escalate', reason: 'arbitration', motive: 'Deux CVR revendiquent ce poste.' } as const;
    expect(await repo.validateNeed(CVR1(), id, base)).toMatchObject({ reason: 'invalid_other_zone' });
    expect(await repo.validateNeed(CVR1(), id, { ...base, otherZoneId: ZV })).toMatchObject({ reason: 'invalid_other_zone' });
    expect(await repo.validateNeed(CVR1(), id, { ...base, otherZoneId: NM })).toMatchObject({ reason: 'invalid_other_zone' });
    expect(await repo.validateNeed(CVR1(), id, { ...base, otherZoneId: ALPHA })).toMatchObject({ reason: 'invalid_other_zone' });
    expect((await row('BES-DEMO-033', CVR1())).validation.siblingCvrs.map((z) => z.id).sort()).toEqual([GP, WY].sort());
    expect(await repo.validateNeed(CVR1(), id, { ...base, otherZoneId: WY })).toEqual({ status: 'ok' });
    const r = await row('BES-DEMO-033');
    expect(r.validation.escalation).toMatchObject({ reason: 'arbitration', other_zone_id: WY });
    expect(r.validation.zones[WY]?.code).toBe('CVR-WY02');
    // L'autre CVR n'a pas accès au besoin par ce biais ; seul le DR commun arbitre.
    expect(await repo.validateNeed(CVR2(), id, { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.validateNeed(DR1(), id, { outcome: 'validate' })).toEqual({ status: 'ok' });
    expect((await row('BES-DEMO-033')).validation.log.map((e) => `${e.action}:${e.level}`)).toEqual(['escalate:cvr', 'validate:dr']);
  });

  it('seul le cas « arbitrage » désigne un autre CVR', async () => {
    const id = await idOf('BES-DEMO-032');
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'escalate', reason: 'out_of_envelope', motive: 'x', otherZoneId: WY })).toMatchObject({ reason: 'invalid_other_zone' });
  });
});

describe('« hors enveloppe » : point d\'entrée sans règle (D43 ouverte, A4b1)', () => {
  it('par défaut non évalué ; l\'escalade reste déclenchée à la main avec motif', async () => {
    const id = await idOf('BES-DEMO-032');
    expect((await row('BES-DEMO-032', CVR1())).validation.envelope).toBe('not_evaluated');
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'escalate', reason: 'out_of_envelope' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.validateNeed(CVR1(), id, { outcome: 'escalate', reason: 'out_of_envelope', motive: 'Budget du CVR à vérifier.' })).toEqual({ status: 'ok' });
    expect((await row('BES-DEMO-032')).validation.escalation).toMatchObject({ reason: 'out_of_envelope', trigger: 'manual' });
  });
  it('A4b1 branche son évaluateur par ce point d\'entrée', async () => {
    setEnvelopeEvaluator(() => 'exceeded');
    expect((await row('BES-DEMO-032', CVR1())).validation.envelope).toBe('exceeded');
    setEnvelopeEvaluator();
    expect((await row('BES-DEMO-032', CVR1())).validation.envelope).toBe('not_evaluated');
  });
});

describe('scénario 5 : délégation pendant une absence', () => {
  const create = (over: Partial<Parameters<typeof repo.createDelegation>[1]> = {}) =>
    repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-10-30', ...over });

  it('avant la délégation, le suppléant ne voit pas le besoin du délégant', async () => {
    const id = await idOf('BES-DEMO-034');
    expect(await repo.validateNeed(CVR2(), id, { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.getNeedThread(CVR2(), id)).toBeNull();
  });

  it('pendant la délégation, le suppléant valide pour le délégant ; la décision est tracée comme telle', async () => {
    const id = await idOf('BES-DEMO-034');
    expect(await create()).toEqual({ status: 'ok' });
    const view = await row('BES-DEMO-034', CVR2());
    expect(view.validation.canAct).toMatchObject({ level: 'cvr', zoneId: ZV, byZoneId: WY });
    const thread = await repo.getNeedThread(CVR2(), id);
    expect(thread?.row.need.need_code).toBe('BES-DEMO-034');
    expect((await repo.getScopeZones(CVR2())).some((z) => z.id === ZV)).toBe(true);
    expect(await repo.validateNeed(CVR2(), id, { outcome: 'validate' })).toEqual({ status: 'ok' });
    const log = (await row('BES-DEMO-034')).validation.log[0]!;
    expect(log).toMatchObject({ action: 'validate', level: 'cvr', zone_id: ZV, by_zone_id: WY, by_profile: 'cvr_client' });
    expect(log.delegation_id).toBeTruthy();
    expect((await eventsOf('EV-06'))[0]?.data).toMatchObject({ delegated: true, level: 'cvr' });
    // Le délégant garde son propre périmètre : il peut encore agir sur ses besoins.
    expect((await row('BES-DEMO-031', CVR1())).validation.canAct?.byZoneId).toBeNull();
  });

  it('un suppléant n\'élargit jamais le périmètre au delà de celui du délégant', async () => {
    await create();
    const ids = new Set((await repo.getPipeline(CVR2())).map((r) => r.need.need_code));
    const own = new Set((await repo.getPipeline(CVR1())).map((r) => r.need.need_code));
    const wyOnly = new Set((await repo.getPipeline(ctxOf('cvr_client', { kind: 'cvr', ids: [WY] }))).map((r) => r.need.need_code));
    // Périmètre effectif = périmètre propre + celui du délégant, rien d'autre.
    for (const code of ids) expect(own.has(code) || wyOnly.has(code), code).toBe(true);
    const gp = await idOf('BES-DEMO-013'); // CVR-GP03, hors des deux périmètres
    expect(await repo.validateNeed(CVR2(), gp, { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.getNeedThread(CVR2(), gp)).toBeNull();
    expect([...ids].includes('BES-DEMO-013')).toBe(false);
    // Les autres besoins du CVR3 ne changent pas.
    expect((await repo.getPipeline(CVR3())).every((r) => r.need.sector_id !== OWN)).toBe(true);
  });

  it('le suppléant d\'un CVR n\'arbitre pas au niveau du DR', async () => {
    await create();
    expect(await repo.validateNeed(CVR2(), await idOf('BES-DEMO-035'), { outcome: 'validate' })).toMatchObject({ reason: 'forbidden' });
  });

  it('un DR suppléant arbitre dans la zone de son délégant, pas ailleurs', async () => {
    expect(await create({ delegatorZoneId: ALPHA, substituteZoneId: BETA })).toEqual({ status: 'ok' });
    expect(await repo.validateNeed(DR2(), await idOf('BES-DEMO-035'), { outcome: 'validate' })).toEqual({ status: 'ok' });
    expect((await row('BES-DEMO-035')).validation.log.at(-1)).toMatchObject({ level: 'dr', zone_id: ALPHA, by_zone_id: BETA });
    const gamma = zones.find((z) => z.kind === 'rs' && z.parent_id === zone('CVR-UH06').id)!.id;
    const fromGamma = (await repo.getPipeline(DR2())).filter((r) => r.need.sector_id === gamma);
    expect(fromGamma).toHaveLength(0);
  });

  it('droits : l\'agence administration seule désigne un suppléant', async () => {
    for (const ctx of [AG(), CVR1(), DR1(), RS(), DIR(), ctxOf('provider_admin')]) {
      expect(repo.canManageDelegations(ctx)).toBe(false);
      expect(await repo.createDelegation(ctx, { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-10-30' })).toMatchObject({ reason: 'forbidden' });
    }
    expect(repo.canManageDelegations(ADMIN())).toBe(true);
    expect(await repo.getDelegations(ADMIN())).toHaveLength(3);
  });

  it('contrôles de création : même zone, niveaux, période passée, chevauchement, chaîne, dates invalides', async () => {
    expect(await create({ substituteZoneId: ZV })).toMatchObject({ reason: 'same_zone' });
    expect(await create({ substituteZoneId: ALPHA })).toMatchObject({ reason: 'kind_mismatch' });
    expect(await create({ startDate: '2026-10-22' })).toMatchObject({ reason: 'period' });
    expect(await create({ endDate: '2026-10-20' })).toMatchObject({ reason: 'period' });
    expect(await create({ startDate: '2026-13-45' })).toMatchObject({ reason: 'invalid' });
    expect(await create({ delegatorZoneId: crypto.randomUUID() })).toMatchObject({ reason: 'invalid' });
    expect(await create()).toEqual({ status: 'ok' });
    expect(await create({ substituteZoneId: GP, startDate: '2026-10-28', endDate: '2026-10-29' })).toMatchObject({ reason: 'overlap' });
    expect(await create({ delegatorZoneId: WY, substituteZoneId: GP, startDate: '2026-10-24', endDate: '2026-10-25' })).toMatchObject({ reason: 'chain' });
    expect((await repo.getDelegations(ADMIN())).filter((d) => d.status === 'active')).toHaveLength(1);
  });

  it('un seul suppléant à la fois : la délégation prévue au départ interdit un second suppléant sur sa période', async () => {
    expect(await create({ substituteZoneId: GP, startDate: '2026-11-05', endDate: '2026-11-06' })).toMatchObject({ reason: 'overlap' });
  });
});

describe('scénario 6 : fin de délégation', () => {
  it('la révocation rend immédiatement le périmètre au suppléant ; la délégation reste au dossier avec sa trace', async () => {
    const id = await idOf('BES-DEMO-034');
    await repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-10-30' });
    const d = (await repo.getDelegations(ADMIN())).find((x) => x.status === 'active')!;
    expect((await repo.getNeedThread(CVR2(), id))?.row.need.id).toBe(id);
    expect(await repo.revokeDelegation(CVR2(), d.id)).toMatchObject({ reason: 'forbidden' });
    expect(await repo.revokeDelegation(ADMIN(), crypto.randomUUID())).toMatchObject({ reason: 'not_found' });
    expect(await repo.revokeDelegation(ADMIN(), d.id)).toEqual({ status: 'ok' });
    expect(await repo.validateNeed(CVR2(), id, { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.getNeedThread(CVR2(), id)).toBeNull();
    expect((await repo.getScopeZones(CVR2())).some((z) => z.id === ZV)).toBe(false);
    const after = (await repo.getDelegations(ADMIN())).find((x) => x.id === d.id)!;
    expect(after).toMatchObject({ status: 'revoked', revoked_on: TODAY, revoked_by: 'agency_admin' });
    expect(await repo.revokeDelegation(ADMIN(), d.id)).toMatchObject({ reason: 'not_revocable' });
    expect((await eventsOf('EV-46')).filter((e) => e.data.delegation === d.id).map((e) => e.data.action).sort()).toEqual(['created', 'revoked']);
  });

  it('une délégation terminée par ses dates ne donne aucun périmètre (jeu de départ)', async () => {
    const ended = (await repo.getDelegations(ADMIN())).find((x) => x.status === 'ended')!;
    expect(ended.delegator_zone_id).toBe(GP);
    // CVR-WY02 était suppléant de CVR-GP03 jusqu'au 16/10 : plus aucun accès au 23/10.
    expect(await repo.validateNeed(CVR2(), await idOf('BES-DEMO-013'), { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.revokeDelegation(ADMIN(), ended.id)).toMatchObject({ reason: 'not_revocable' });
  });

  it('une délégation révoquée au départ, ou prévue, ne donne aucun périmètre', async () => {
    const [revoked, planned] = ['revoked', 'planned'].map((s) => async () => (await repo.getDelegations(ADMIN())).find((d) => d.status === s)!);
    expect((await revoked!()).revoked_on).toBe('2026-10-21');
    expect((await planned!()).start_date).toBe('2026-11-02');
    expect(await repo.validateNeed(CVR2(), await idOf('BES-DEMO-034'), { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    // Une délégation prévue peut être révoquée avant son début.
    expect(await repo.revokeDelegation(ADMIN(), (await planned!()).id)).toEqual({ status: 'ok' });
  });
});

describe('scénario 7 : tentative hors périmètre refusée côté données', () => {
  it('un CVR n\'agit que sur son périmètre : un besoin d\'un autre CVR est inconnu', async () => {
    for (const [ctx, code] of [[CVR2(), 'BES-DEMO-030'], [CVR3(), 'BES-DEMO-030'], [CVR1(), 'BES-DEMO-037']] as const) {
      expect(await repo.validateNeed(ctx, await idOf(code), { outcome: 'validate' }), code).toMatchObject({ status: 'refused', reason: 'not_found' });
    }
    expect((await row('BES-DEMO-030')).validation.state).toBe('to_validate');
    expect((await repo.getPipeline(CVR1())).some((r) => r.need.need_code === 'BES-DEMO-037')).toBe(false);
  });

  it('l\'agence, le RS et le prestataire ne valident pas ; un besoin inconnu ou brouillon est introuvable', async () => {
    const id = await idOf('BES-DEMO-030');
    for (const ctx of [AG(), ADMIN(), RS(), ctxOf('provider_admin')]) expect(await repo.validateNeed(ctx, id, { outcome: 'validate' })).toMatchObject({ reason: 'forbidden' });
    expect(await repo.validateNeed(CVR1(), crypto.randomUUID(), { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.validateNeed(CVR1(), await idOf('BES-DEMO-026'), { outcome: 'validate' })).toMatchObject({ reason: 'not_found' });
  });

  it('un besoin déjà validé (réputé), refusé ou qualifié n\'attend plus de validation', async () => {
    for (const code of ['BES-DEMO-001', 'BES-DEMO-036', 'BES-DEMO-011']) {
      const r = await repo.validateNeed(CVR1(), await idOf(code), { outcome: 'validate' });
      expect(r, code).toMatchObject({ status: 'refused' });
    }
  });

  it('une issue inconnue est refusée', async () => {
    expect(await repo.validateNeed(CVR1(), await idOf('BES-DEMO-030'), { outcome: 'approve' as never })).toMatchObject({ reason: 'invalid' });
  });
});

describe('validation en lot avec motif commun (F-30.6)', () => {
  it('chaque besoin est contrôlé seul : un refus d\'accès n\'arrête pas les autres', async () => {
    const ids = [await idOf('BES-DEMO-030'), await idOf('BES-DEMO-031'), await idOf('BES-DEMO-037'), await idOf('BES-DEMO-001')];
    const r = await repo.validateBatch(CVR1(), ids, { outcome: 'validate' });
    expect(r.decided).toBe(2);
    expect(r.refused).toBe(2);
    expect(r.items.filter((i) => i.status === 'refused').map((i) => i.reason).sort()).toEqual(['not_found', 'not_pending']);
    expect((await row('BES-DEMO-030')).validation.state).toBe('validated');
    expect((await row('BES-DEMO-037')).validation.state).toBe('to_validate');
  });

  it('un refus en lot exige un motif commun, qui figure au dossier de chaque besoin', async () => {
    const ids = [await idOf('BES-DEMO-030'), await idOf('BES-DEMO-031')];
    expect((await repo.validateBatch(CVR1(), ids, { outcome: 'refuse' })).decided).toBe(0);
    const ok = await repo.validateBatch(CVR1(), ids, { outcome: 'refuse', motive: 'Calendrier à revoir.' });
    expect(ok.decided).toBe(2);
    for (const code of ['BES-DEMO-030', 'BES-DEMO-031']) expect((await row(code)).validation.log[0]).toMatchObject({ action: 'refuse', motive: 'Calendrier à revoir.' });
  });

  it('l\'escalade ne se fait pas en lot ; un doublon d\'identifiant n\'est traité qu\'une fois', async () => {
    const id = await idOf('BES-DEMO-030');
    expect((await repo.validateBatch(CVR1(), [id], { outcome: 'escalate', reason: 'out_of_perimeter', motive: 'x' })).decided).toBe(0);
    expect((await repo.validateBatch(CVR1(), [id, id], { outcome: 'validate' })).items).toHaveLength(1);
  });

  it('un suppléant valide en lot dans le périmètre du délégant seulement', async () => {
    await repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-10-30' });
    const r = await repo.validateBatch(CVR2(), [await idOf('BES-DEMO-030'), await idOf('BES-DEMO-037'), await idOf('BES-DEMO-013')], { outcome: 'validate' });
    expect(r.decided).toBe(2);
    expect(r.items.find((i) => i.status === 'refused')?.reason).toBe('not_found'); // BES-013 : CVR-GP03, hors du périmètre du délégant et du suppléant
  });
});

describe('audience : événements et alertes de la chaîne managériale (D91, D108)', () => {
  async function runEverything() {
    const id = (c: string) => idOf(c);
    await repo.validateNeed(CVR1(), await id('BES-DEMO-030'), { outcome: 'validate' });
    await repo.validateNeed(CVR1(), await id('BES-DEMO-031'), { outcome: 'refuse', motive: 'Motif.' });
    await repo.resubmitNeed(RS(), await id('BES-DEMO-031'));
    await repo.validateNeed(CVR1(), await id('BES-DEMO-032'), { outcome: 'escalate', reason: 'out_of_envelope', motive: 'Motif.' });
    await repo.validateNeed(DR1(), await id('BES-DEMO-032'), { outcome: 'validate' });
    await repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: TODAY });
    await repo.qualifyNeed(AG(), await id('BES-DEMO-030'), { outcome: 'clarify', motive: 'Quels magasins ?' });
  }

  it('chaque événement porte une audience valide ; EV-06 à EV-08 et EV-47 sont communs, EV-46 réservé à l\'agence', async () => {
    await runEverything();
    for (const code of ['EV-06', 'EV-07', 'EV-08', 'EV-47'] as const) {
      const ev = await eventsOf(code);
      expect(ev.length, code).toBeGreaterThan(0);
      for (const e of ev) expect(e.audience, code).toBe('both');
    }
    const del = await eventsOf('EV-46');
    expect(del.length).toBeGreaterThan(0);
    for (const e of del) expect(e.audience).toBe('agency');
    for (const e of await events()) expect(AUDIENCES).toContain(e.audience);
  });

  it('absence côté cliente des événements agence : aucune délégation, aucune clé interne, quel que soit le profil client', async () => {
    await runEverything();
    for (const ctx of [CVR1(), CVR2(), DR1(), DR2(), DIR(), RS()]) {
      const ev = await repo.getEvents(ctx);
      expect(ev.filter((e) => e.code === 'EV-46'), ctx.profileId).toHaveLength(0);
      expect(ev.every((e) => e.audience !== 'agency'), ctx.profileId).toBe(true);
    }
  });

  it('aucun motif ni texte libre ne voyage dans les données d\'un événement', async () => {
    await runEverything();
    const forbidden = ['Motif.', 'Quels magasins'];
    for (const e of await events()) for (const v of Object.values(e.data)) if (typeof v === 'string') for (const f of forbidden) expect(v).not.toContain(f);
  });

  it('chaque alerte porte une audience ; la fin de délégation est réservée à l\'agence, les attentes de validation sont communes', async () => {
    await repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-10-26' });
    const agency = await repo.getPipelineAlerts(ADMIN());
    const keys = (a: typeof agency) => a.map((x) => x.message_key);
    expect(keys(agency)).toEqual(expect.arrayContaining(['validationPending', 'validationLate', 'escalationPending', 'resubmitPending', 'delegationEnding']));
    for (const a of agency) expect(AUDIENCES).toContain(a.audience);
    expect(agency.find((a) => a.message_key === 'delegationEnding')?.audience).toBe('agency');
    for (const k of ['validationPending', 'validationLate', 'escalationPending', 'resubmitPending']) expect(agency.find((a) => a.message_key === k)?.audience).toBe('both');
    for (const ctx of [CVR1(), DR1(), DIR(), RS()]) {
      const mine = await repo.getPipelineAlerts(ctx);
      expect(keys(mine), ctx.profileId).not.toContain('delegationEnding');
      expect(keys(mine), ctx.profileId).not.toContain('proposalLate');
    }
    expect(keys(await repo.getPipelineAlerts(CVR1()))).toEqual(expect.arrayContaining(['validationPending', 'validationLate']));
  });

  it('les alertes comptent le périmètre du profil : le CVR d\'une autre zone n\'en voit pas', async () => {
    const own = (await repo.getPipelineAlerts(CVR1())).find((a) => a.message_key === 'validationPending')!;
    const other = (await repo.getPipelineAlerts(CVR3())).find((a) => a.message_key === 'validationPending');
    expect(own.params.n).toBeGreaterThan(0);
    expect(other).toBeUndefined();
  });

  it('une délégation qui se termine plus tard n\'alerte pas encore', async () => {
    await repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-11-20' });
    expect((await repo.getPipelineAlerts(ADMIN())).map((a) => a.message_key)).not.toContain('delegationEnding');
  });
});

describe('visibilité des délégations et de la chaîne', () => {
  it('la cliente ne lit que les délégations où son périmètre est délégant ou suppléant', async () => {
    await repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-10-30' });
    const involving = (zone: string) => (d: { delegator_zone_id: string; substitute_zone_id: string }) => d.delegator_zone_id === zone || d.substitute_zone_id === zone;
    const mine1 = await repo.getDelegations(CVR1());
    expect(mine1.length).toBeGreaterThan(1);
    expect(mine1.every(involving(ZV))).toBe(true);
    expect(mine1.some((d) => d.status === 'active')).toBe(true);
    expect((await repo.getDelegations(CVR2())).every(involving(WY))).toBe(true);
    expect((await repo.getDelegations(CVR2())).some((d) => d.status === 'active')).toBe(true);
    expect((await repo.getDelegations(CVR3())).every(involving(GP))).toBe(true);
    expect((await repo.getDelegations(CVR3())).some((d) => d.status === 'active')).toBe(false);
    expect(await repo.getDelegations(RS())).toHaveLength(0);
    expect(await repo.getDelegations(DR1())).toHaveLength(0);
  });

  it('le dossier de validation reste lisible par le RS et l\'agence ; les zones citées sont résolues par la couche de données', async () => {
    const r = await row('BES-DEMO-035', RS());
    expect(r.validation.state).toBe('escalated');
    expect(r.validation.log).toHaveLength(1);
    expect(r.validation.zones[ZV]?.kind).toBe('cvr');
    expect(r.validation.zones[WY]?.kind).toBe('cvr');
    expect(r.validation.canAct).toBeNull();
    expect(r.validation.siblingCvrs).toHaveLength(0);
  });

  it('la qualification de l\'agence reste cohérente : précision demandée puis reprise, rejet motivé', async () => {
    const id = await idOf('BES-DEMO-030');
    await repo.validateNeed(CVR1(), id, { outcome: 'validate' });
    expect(await repo.qualifyNeed(AG(), id, { outcome: 'reject' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.qualifyNeed(AG(), id, { outcome: 'clarify', motive: 'Quels magasins ?' })).toEqual({ status: 'ok' });
    expect((await row('BES-DEMO-030')).next).toMatchObject({ actor: 'rs', action: 'clarify' });
    expect((await row('BES-DEMO-030')).validation.state).toBe('validated');
  });
});

describe('annulation (D159) et besoins stoppés', () => {
  it('une validation est annulable ; le journal conserve l\'événement', async () => {
    const id = await idOf('BES-DEMO-030');
    const { result, undoToken } = await repo.withUndo(CVR1(), () => repo.validateNeed(CVR1(), id, { outcome: 'validate' }), (r) => r.status === 'ok');
    expect(result.status).toBe('ok');
    expect(undoToken).toBeTruthy();
    expect(await repo.undoWrite(CVR1(), undoToken!)).toEqual({ status: 'ok' });
    expect((await row('BES-DEMO-030')).validation.state).toBe('to_validate');
    expect((await row('BES-DEMO-030')).validation.log).toHaveLength(0);
    expect(await eventsOf('EV-06')).toHaveLength(1);
  });

  it('une délégation créée est annulable', async () => {
    const { undoToken } = await repo.withUndo(ADMIN(), () => repo.createDelegation(ADMIN(), { delegatorZoneId: ZV, substituteZoneId: WY, startDate: TODAY, endDate: '2026-10-30' }), (r) => r.status === 'ok');
    expect((await repo.getDelegations(ADMIN())).filter((d) => d.status === 'active')).toHaveLength(1);
    await repo.undoWrite(ADMIN(), undoToken!);
    expect((await repo.getDelegations(ADMIN())).filter((d) => d.status === 'active')).toHaveLength(0);
  });

  it('un besoin stoppé ou rejeté ne se valide plus', async () => {
    expect(await repo.validateNeed(CVR1(), await idOf('BES-DEMO-014'), { outcome: 'validate' })).toMatchObject({ status: 'refused' });
  });
});

describe('l\'entonnoir compte la chaîne managériale à part', () => {
  it('à valider, escaladés et refusés sortent des taux et des états', async () => {
    const f = await repo.getFunnelReport(AG());
    expect(f.summary.toValidate).toBe(7); // 030 à 034 et 037 à valider, 035 escaladé ; 036 est refusé, compté à part
    expect(f.summary.validationRefused).toBe(1);
  });
});
