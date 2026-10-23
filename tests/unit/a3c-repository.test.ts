import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import type { Need } from '@/data/schemas';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import type { AccessContext } from '@/domain/access';
import { buildAccessContext } from '@/domain/access';
import { AUDIENCES } from '@/domain/types';
import { addDays } from '@/domain/week';
import type { ProfileId } from '@/domain/types';
import { period } from './needs-util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const zoneId = (code: string) => zones.find((z) => z.code === code)!.id;
const ctxOf = (id: ProfileId): AccessContext => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr');
const AG = () => ctxOf('agency_operator');
const ADMIN = () => ctxOf('agency_admin');
const CVR = () => ctxOf('cvr_client'); // CVR-ZV01
const DR = () => ctxOf('dr_client'); // DR-ALPHA
const cvrOf = (code: string): AccessContext => ({ ...CVR(), scope: { kind: 'cvr', ids: [zoneId(code)] } });
const drOf = (code: string): AccessContext => ({ ...DR(), scope: { kind: 'dr', ids: [zoneId(code)] } });
const rsOf = (sectorCode: string): AccessContext => ({ ...ctxOf('rs'), scope: { kind: 'rs', ids: [zoneId(sectorCode)] } });
const OWN = (ctxOf('rs').scope as { ids: string[] }).ids[0]!; // RS-HRF1, sous CVR-ZV01
const TODAY = '2026-10-23';

beforeEach(() => resetDemoState());

async function submitIn(sectorCode: string, start = '2026-12-07'): Promise<Need> {
  const sector = zoneId(sectorCode);
  const stores = (await repo.getStores(AG())).filter((s) => s.sector_id === sector).slice(0, 1).map((s) => s.code);
  const r = await repo.saveNeed(rsOf(sectorCode), {
    dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: sector, position_label: 'Poste 4', weekly_hours: 14, priority: 2,
    periods: [period(1, start, addDays(start, 6))], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: stores, client_comment: null,
  });
  if (r.status !== 'saved' || r.decision !== 'submit') throw new Error(`besoin non soumis : ${JSON.stringify(r)}`);
  return r.need;
}
const rowOf = async (n: Need, ctx: AccessContext = AG()) => (await repo.getPipeline(ctx)).find((r) => r.need.id === n.id);
const stateOf = async (n: Need, ctx: AccessContext = AG()) => (await rowOf(n, ctx))?.validation.state;
const validate = (ctx: AccessContext, n: Need, motive?: string) => repo.validateNeed(ctx, n.id, { outcome: 'validated', ...(motive ? { motive } : {}) });
const refuse = (ctx: AccessContext, n: Need, motive = 'Période non conforme (motif fictif).') => repo.validateNeed(ctx, n.id, { outcome: 'refused', motive });
const eventsOf = async (n: Need, ctx: AccessContext = AG()) => (await repo.getEvents(ctx)).filter((e) => e.need_id === n.id);

describe('jeu de démonstration A3c', () => {
  it('les besoins existants avant A3c sont réputés validés ; les nouveaux cas repères couvrent chaque état', async () => {
    const rows = await repo.getPipeline(AG());
    const states = new Set(rows.map((r) => r.validation.state));
    expect([...states].sort()).toEqual(['escalated', 'refused', 'to_validate', 'validated']);
    const first = rows.find((r) => r.need.need_code === 'BES-DEMO-001')!;
    expect(first.validation.state).toBe('validated');
  });
  it('au moins un besoin en retard de validation pour le CVR de démonstration, avec urgence et retard', async () => {
    const mine = (await repo.getPipeline(CVR())).filter((r) => r.next.actor === 'cvr');
    expect(mine.length).toBeGreaterThanOrEqual(2);
    expect(mine.some((r) => r.next.urgency === 'overdue' && r.next.lateDays > 0)).toBe(true);
    expect(mine.every((r) => r.next.action === 'validate_need')).toBe(true);
  });
  it('le DR de démonstration a un besoin escaladé à arbitrer', async () => {
    const rows = (await repo.getPipeline(DR())).filter((r) => r.next.actor === 'dr');
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.every((r) => r.next.action === 'arbitrate_need')).toBe(true);
  });
});

describe('F-30.1 : le CVR valide dans son périmètre', () => {
  it('un besoin soumis attend son CVR ; la qualification de l\'agence attend la validation', async () => {
    const n = await submitIn('RS-HRF1');
    const row = (await rowOf(n))!;
    expect(row.validation.state).toBe('to_validate');
    expect(row.next).toMatchObject({ actor: 'cvr', action: 'validate_need' });
    expect(await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).toMatchObject({ status: 'refused', reason: 'not_validated' });
    expect(row.recruitment.intake).toBe('to_qualify'); // la qualification reste une dimension séparée
  });
  it('CVR valide : trace, EV-06 d\'audience « les deux », la qualification devient possible', async () => {
    const n = await submitIn('RS-HRF1');
    expect(await validate(CVR(), n)).toEqual({ status: 'ok' });
    expect(await stateOf(n)).toBe('validated');
    const ev = (await eventsOf(n)).filter((e) => e.code === 'EV-06');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ audience: 'both', actor_profile: 'cvr_client' });
    expect((await rowOf(n))!.next).toMatchObject({ actor: 'agency', action: 'qualify' });
    expect((await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).status).toBe('ok');
    expect((await rowOf(n))!.recruitment.intake).toBe('taken');
    // Une validation ne se rejoue pas.
    expect(await validate(CVR(), n)).toMatchObject({ status: 'refused', reason: 'not_pending' });
  });
  it('seul un CVR (ou un DR sur un besoin escaladé) agit ; ni l\'agence, ni le RS, ni la direction', async () => {
    const n = await submitIn('RS-HRF1');
    for (const id of ['agency_operator', 'agency_admin', 'rs', 'direction_client', 'provider_admin'] as const) {
      expect(await validate(ctxOf(id), n), id).toMatchObject({ status: 'refused', reason: 'forbidden' });
      expect(await refuse(ctxOf(id), n), id).toMatchObject({ status: 'refused', reason: 'forbidden' });
    }
    // Un DR ne contourne pas son CVR : le besoin doit être escaladé.
    expect(await validate(DR(), n)).toMatchObject({ status: 'refused', reason: 'not_escalated' });
    expect(await stateOf(n)).toBe('to_validate');
  });
  it('tentative hors périmètre refusée côté données : un autre CVR, un DR d\'une autre branche', async () => {
    const n = await submitIn('RS-HRF1');
    const other = cvrOf('CVR-GP03');
    expect(await validate(other, n)).toMatchObject({ status: 'refused', reason: 'not_found' });
    expect(await refuse(other, n)).toMatchObject({ status: 'refused', reason: 'not_found' });
    expect(await repo.escalateNeed(other, n.id, { case: 'out_of_perimeter', motive: 'x' })).toMatchObject({ status: 'refused', reason: 'not_found' });
    expect(await rowOf(n, other)).toBeUndefined();
    expect(await repo.getNeedThread(other, n.id)).toBeNull();
    expect(await validate(drOf('DR-BETA'), n)).toMatchObject({ status: 'refused', reason: 'not_found' });
    expect(await stateOf(n)).toBe('to_validate');
    expect((await eventsOf(n)).filter((e) => ['EV-06', 'EV-07', 'EV-08'].includes(e.code))).toHaveLength(0);
  });
  it('seul un besoin soumis se valide ; un brouillon n\'existe pas pour la chaîne', async () => {
    const r = await repo.saveNeed(rsOf('RS-HRF1'), {
      dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: OWN, position_label: null, weekly_hours: null, priority: null,
      periods: [period(1, '2027-05-03', '2027-05-09')], days: [], hours_slot: null, store_codes: [], client_comment: null,
    });
    if (r.status !== 'saved' || r.decision !== 'draft') throw new Error('brouillon attendu');
    expect(await validate(CVR(), r.need)).toMatchObject({ status: 'refused', reason: 'not_submitted' });
    expect(await repo.escalateNeed(CVR(), r.need.id, { case: 'out_of_perimeter', motive: 'x' })).toMatchObject({ reason: 'not_submitted' });
    expect((await eventsOf(r.need)).filter((e) => ['EV-06', 'EV-07', 'EV-08'].includes(e.code))).toHaveLength(0);
  });
});

describe('F-30.1 : refus avec motif obligatoire, puis nouveau tour', () => {
  it('le refus exige un motif, trace EV-08, bloque la qualification et la proposition', async () => {
    const n = await submitIn('RS-HRF1');
    expect(await repo.validateNeed(CVR(), n.id, { outcome: 'refused' })).toMatchObject({ status: 'refused', reason: 'motive_required' });
    expect(await repo.validateNeed(CVR(), n.id, { outcome: 'refused', motive: '   ' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.validateNeed(CVR(), n.id, { outcome: 'refused', motive: 'x'.repeat(281) })).toMatchObject({ reason: 'invalid' });
    expect(await repo.validateNeed(CVR(), n.id, { outcome: 'other' as 'refused', motive: 'x' })).toMatchObject({ reason: 'invalid' });
    expect(await stateOf(n)).toBe('to_validate');
    expect(await refuse(CVR(), n, 'Période non conforme (motif fictif).')).toEqual({ status: 'ok' });
    expect(await stateOf(n)).toBe('refused');
    const ev = (await eventsOf(n)).filter((e) => e.code === 'EV-08');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ audience: 'both' });
    expect(JSON.stringify(ev[0]!.data)).not.toContain('conforme'); // le motif ne passe jamais par le journal
    expect(await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).toMatchObject({ reason: 'not_validated' });
    expect((await rowOf(n))!.next).toMatchObject({ actor: 'rs', action: 'resubmit_need', due: null });
    const thread = (await repo.getNeedThread(CVR(), n.id))!;
    expect(thread.validations).toHaveLength(1);
    expect(thread.validations[0]).toMatchObject({ outcome: 'refused', level: 'cvr', motive: 'Période non conforme (motif fictif).' });
  });
  it('refus, correction du besoin, renvoi, nouvelle validation : le premier tour reste au dossier', async () => {
    const n = await submitIn('RS-HRF1');
    await refuse(CVR(), n);
    // Seul le RS du secteur ou l'agence renvoie ; un renvoi sans refus est refusé.
    expect(await repo.resubmitNeed(CVR(), n.id)).toMatchObject({ status: 'refused', reason: 'forbidden' });
    expect(await repo.resubmitNeed(rsOf('RS-5LL0'), n.id)).toMatchObject({ status: 'refused', reason: 'not_found' }); // autre secteur
    expect(await repo.resubmitNeed(ctxOf('rs'), n.id)).toEqual({ status: 'ok' });
    expect(await repo.resubmitNeed(ctxOf('rs'), n.id)).toMatchObject({ status: 'refused', reason: 'not_refused' });
    expect((await rowOf(n))!.validation).toMatchObject({ state: 'to_validate', round: 2 });
    expect((await rowOf(n))!.next).toMatchObject({ actor: 'cvr', action: 'validate_need' });
    expect(await validate(CVR(), n)).toEqual({ status: 'ok' });
    const thread = (await repo.getNeedThread(AG(), n.id))!;
    expect(thread.validations.map((v) => [v.round, v.outcome])).toEqual([[1, 'refused'], [2, 'resubmitted'], [2, 'validated']]);
    expect((await eventsOf(n)).map((e) => e.code)).toEqual(expect.arrayContaining(['EV-08', 'EV-46', 'EV-06']));
    expect((await eventsOf(n)).find((e) => e.code === 'EV-46')).toMatchObject({ audience: 'both' });
    expect((await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).status).toBe('ok');
  });
  it('l\'agence renvoie aussi un besoin refusé (saisie pour le compte du RS)', async () => {
    const n = await submitIn('RS-HRF1');
    await refuse(CVR(), n);
    expect(await repo.resubmitNeed(AG(), n.id)).toEqual({ status: 'ok' });
    expect(await stateOf(n)).toBe('to_validate');
  });
});

describe('F-30.2 : escalade vers le DR', () => {
  it('hors périmètre : escalade avec motif, le DR arbitre, trace EV-07 puis la qualification s\'ouvre', async () => {
    const n = await submitIn('RS-HRF1');
    expect(await repo.escalateNeed(CVR(), n.id, { case: 'out_of_perimeter', motive: '' })).toMatchObject({ status: 'refused', reason: 'motive_required' });
    expect(await repo.escalateNeed(CVR(), n.id, { case: 'bogus' as 'arbitration', motive: 'x' })).toMatchObject({ reason: 'invalid' });
    expect(await repo.escalateNeed(CVR(), n.id, { case: 'out_of_perimeter', motive: 'Hors du périmètre du CVR (motif fictif).' })).toEqual({ status: 'ok' });
    expect(await stateOf(n)).toBe('escalated');
    expect((await rowOf(n))!.next).toMatchObject({ actor: 'dr', action: 'arbitrate_need' });
    // Le CVR a transmis : il n'agit plus, il ne revalide pas ; la qualification attend.
    expect(await validate(CVR(), n)).toMatchObject({ reason: 'not_pending' });
    expect(await repo.escalateNeed(CVR(), n.id, { case: 'out_of_perimeter', motive: 'x' })).toMatchObject({ reason: 'not_pending' });
    expect(await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).toMatchObject({ reason: 'not_validated' });
    expect(await validate(DR(), n, 'Arbitré en faveur du secteur (motif fictif).')).toEqual({ status: 'ok' });
    expect(await stateOf(n)).toBe('validated');
    const codes = (await eventsOf(n)).map((e) => [e.code, e.data.action ?? null]);
    expect(codes).toEqual(expect.arrayContaining([['EV-07', 'escalated'], ['EV-07', 'arbitrated']]));
    const thread = (await repo.getNeedThread(AG(), n.id))!;
    expect(thread.validations.map((v) => [v.level, v.outcome])).toEqual([['cvr', 'escalated'], ['dr', 'validated']]);
    expect((await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).status).toBe('ok');
  });
  it('le DR peut refuser avec motif obligatoire (EV-08, niveau DR) ; le besoin retourne au RS', async () => {
    const n = await submitIn('RS-HRF1');
    await repo.escalateNeed(CVR(), n.id, { case: 'out_of_perimeter', motive: 'x' });
    expect(await repo.validateNeed(DR(), n.id, { outcome: 'refused' })).toMatchObject({ reason: 'motive_required' });
    expect(await refuse(DR(), n, 'Refus du DR (motif fictif).')).toEqual({ status: 'ok' });
    expect(await stateOf(n)).toBe('refused');
    const ev = (await eventsOf(n)).filter((e) => e.code === 'EV-08');
    expect(ev[0]!.data).toMatchObject({ level: 'dr' });
    expect((await rowOf(n))!.next).toMatchObject({ actor: 'rs', action: 'resubmit_need' });
  });
  it('hors enveloppe : point d\'entrée sans règle de calcul, déclenchable seulement par le CVR avec motif, jamais automatiquement', async () => {
    const n = await submitIn('RS-HRF1');
    // Aucune escalade automatique à la soumission : la règle d\'enveloppe n\'est pas branchée (D43 ouverte, A4b1).
    expect(await stateOf(n)).toBe('to_validate');
    expect(await repo.escalateNeed(AG(), n.id, { case: 'out_of_envelope', motive: 'x' })).toMatchObject({ reason: 'forbidden' });
    expect(await repo.escalateNeed(DR(), n.id, { case: 'out_of_envelope', motive: 'x' })).toMatchObject({ reason: 'forbidden' });
    expect(await repo.escalateNeed(CVR(), n.id, { case: 'out_of_envelope' as 'arbitration', motive: '' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.escalateNeed(CVR(), n.id, { case: 'out_of_envelope', motive: 'Dépassement estimé à la main (motif fictif).' })).toEqual({ status: 'ok' });
    const v = (await repo.getNeedThread(AG(), n.id))!.validations.at(-1)!;
    expect(v).toMatchObject({ outcome: 'escalated', escalation_case: 'out_of_envelope', level: 'cvr' });
  });
  it('arbitrage entre deux CVR : le CVR concerné est désigné, le DR arbitre les deux besoins', async () => {
    const a = await submitIn('RS-HRF1'); // CVR-ZV01
    const b = await submitIn('RS-5WN4'); // CVR-WY02
    const wy = cvrOf('CVR-WY02');
    const thread = (await repo.getNeedThread(CVR(), a.id))!;
    // Cibles proposées : les CVR frères sous le même DR, jamais ceux d'un autre DR, jamais le sien.
    expect(thread.escalationTargets.map((z) => z.code).sort()).toEqual(['CVR-GP03', 'CVR-WY02']);
    expect(thread.escalationTargets.every((z) => z.kind === 'cvr')).toBe(true);
    expect(await repo.escalateNeed(CVR(), a.id, { case: 'arbitration', motive: 'x' })).toMatchObject({ reason: 'invalid_zone' }); // CVR concerné manquant
    expect(await repo.escalateNeed(CVR(), a.id, { case: 'arbitration', motive: 'x', concernedZoneId: zoneId('CVR-ZV01') })).toMatchObject({ reason: 'invalid_zone' });
    expect(await repo.escalateNeed(CVR(), a.id, { case: 'arbitration', motive: 'x', concernedZoneId: zoneId('CVR-NM04') })).toMatchObject({ reason: 'invalid_zone' }); // autre DR
    expect(await repo.escalateNeed(CVR(), a.id, { case: 'arbitration', motive: 'x', concernedZoneId: zoneId('RS-5LL0') })).toMatchObject({ reason: 'invalid_zone' });
    expect(await repo.escalateNeed(CVR(), a.id, { case: 'arbitration', motive: 'Magasins partagés (motif fictif).', concernedZoneId: zoneId('CVR-WY02') })).toEqual({ status: 'ok' });
    expect(await repo.escalateNeed(wy, b.id, { case: 'arbitration', motive: 'Même arbitrage (motif fictif).', concernedZoneId: zoneId('CVR-ZV01') })).toEqual({ status: 'ok' });
    // Le CVR concerné ne lit pas le besoin de l'autre : son périmètre ne change pas.
    expect(await repo.getNeedThread(wy, a.id)).toBeNull();
    // Le DR voit les deux et arbitre différemment.
    const todo = (await repo.getPipeline(DR())).filter((r) => r.next.action === 'arbitrate_need').map((r) => r.need.id);
    expect(todo).toEqual(expect.arrayContaining([a.id, b.id]));
    expect(await validate(DR(), a)).toEqual({ status: 'ok' });
    expect(await refuse(DR(), b, 'Arbitrage défavorable (motif fictif).')).toEqual({ status: 'ok' });
    expect([await stateOf(a), await stateOf(b)]).toEqual(['validated', 'refused']);
    // Un DR d'une autre branche n'arbitre pas.
    const c = await submitIn('RS-684K'); // DR-BETA
    await repo.escalateNeed(cvrOf('CVR-NM04'), c.id, { case: 'out_of_perimeter', motive: 'x' });
    expect(await validate(DR(), c)).toMatchObject({ reason: 'not_found' });
    expect(await validate(drOf('DR-BETA'), c)).toEqual({ status: 'ok' });
  });
});

describe('validation en lot avec motif commun (F-30.6)', () => {
  it('chaque besoin est contrôlé seul : un refus n\'arrête pas les autres, un motif commun s\'applique', async () => {
    const a = await submitIn('RS-HRF1');
    const b = await submitIn('RS-5LL0');
    const foreign = await submitIn('RS-5WN4'); // CVR-WY02
    await validate(CVR(), b);
    const r = await repo.validateBatch(CVR(), [a.id, b.id, foreign.id, a.id], { outcome: 'refused', motive: 'Même motif pour le lot (fictif).' });
    expect(r.items.map((i) => [i.needId === a.id ? 'a' : i.needId === b.id ? 'b' : 'x', i.status, i.reason ?? null])).toEqual([
      ['a', 'ok', null], ['b', 'refused', 'not_pending'], ['x', 'refused', 'not_found'],
    ]);
    expect([r.done, r.refused]).toEqual([1, 2]);
    expect((await repo.getNeedThread(AG(), a.id))!.validations[0]!.motive).toBe('Même motif pour le lot (fictif).');
    expect(await stateOf(foreign)).toBe('to_validate');
    expect(await repo.validateBatch(CVR(), [], { outcome: 'validated' })).toMatchObject({ done: 0, refused: 0 });
    expect((await repo.validateBatch(CVR(), [foreign.id], { outcome: 'refused' })).items[0]).toMatchObject({ status: 'refused', reason: 'motive_required' });
  });
  it('le DR valide en lot ses besoins escaladés', async () => {
    const a = await submitIn('RS-HRF1');
    const b = await submitIn('RS-5LL0');
    for (const n of [a, b]) await repo.escalateNeed(CVR(), n.id, { case: 'out_of_perimeter', motive: 'x' });
    const r = await repo.validateBatch(DR(), [a.id, b.id], { outcome: 'validated' });
    expect(r.done).toBe(2);
    expect([await stateOf(a), await stateOf(b)]).toEqual(['validated', 'validated']);
  });
});

describe('F-30.3 : délégations et suppléants', () => {
  const draft = (over: Partial<Parameters<typeof repo.createDelegation>[1]> = {}) => ({
    absentZoneId: zoneId('CVR-WY02'), substituteZoneId: zoneId('CVR-ZV01'), startsOn: TODAY, endsOn: '2026-11-06', ...over,
  });
  it('agence administration seule ; trace complète au journal d\'audience agence', async () => {
    for (const ctx of [AG(), CVR(), DR(), ctxOf('rs'), ctxOf('direction_client')]) {
      expect(await repo.createDelegation(ctx, draft())).toMatchObject({ status: 'refused', reason: 'forbidden' });
    }
    expect(repo.canManageDelegations(ADMIN())).toBe(true);
    expect(repo.canManageDelegations(AG())).toBe(false);
    const before = (await repo.getEvents(ADMIN())).length;
    const r = await repo.createDelegation(ADMIN(), draft({ motive: 'Absence planifiée (motif fictif).' }));
    expect(r.status).toBe('ok');
    const created = (await repo.getEvents(ADMIN())).filter((e) => e.code === 'EV-47');
    expect(created.length).toBeGreaterThanOrEqual(1);
    expect(created.every((e) => e.audience === 'agency')).toBe(true);
    expect((await repo.getEvents(ADMIN())).length).toBeGreaterThan(before);
    const list = await repo.getDelegations(ADMIN());
    expect(list.find((d) => d.absent_zone_id === zoneId('CVR-WY02') && d.starts_on === TODAY)).toMatchObject({ created_by: 'agency_admin', created_on: TODAY, motive: 'Absence planifiée (motif fictif).' });
    // Lecture réservée à l'agence et au prestataire : jamais la cliente.
    for (const ctx of [CVR(), DR(), ctxOf('rs'), ctxOf('direction_client')]) expect(await repo.getDelegations(ctx)).toEqual([]);
  });
  it('contrôles : mêmes niveaux, dates au calendrier, un seul suppléant à la fois, pas de chaîne', async () => {
    expect(await repo.createDelegation(ADMIN(), draft({ substituteZoneId: zoneId('CVR-WY02') }))).toMatchObject({ reason: 'same_zone' });
    expect(await repo.createDelegation(ADMIN(), draft({ substituteZoneId: zoneId('DR-ALPHA') }))).toMatchObject({ reason: 'invalid_zone' });
    expect(await repo.createDelegation(ADMIN(), draft({ startsOn: '2026-10-22' }))).toMatchObject({ reason: 'invalid_dates' });
    expect(await repo.createDelegation(ADMIN(), draft({ endsOn: '2026-10-22' }))).toMatchObject({ reason: 'invalid_dates' });
    expect(await repo.createDelegation(ADMIN(), draft({ motive: 'x'.repeat(281) }))).toMatchObject({ reason: 'invalid' });
    expect((await repo.createDelegation(ADMIN(), draft())).status).toBe('ok');
    expect(await repo.createDelegation(ADMIN(), draft({ substituteZoneId: zoneId('CVR-GP03') }))).toMatchObject({ reason: 'overlap' });
    expect(await repo.createDelegation(ADMIN(), { absentZoneId: zoneId('CVR-ZV01'), substituteZoneId: zoneId('CVR-GP03'), startsOn: TODAY, endsOn: '2026-10-30' })).toMatchObject({ reason: 'chain' });
  });
  it('délégation pendant une absence : le suppléant agit sur la zone de l\'absent, avec la trace de la suppléance', async () => {
    const n = await submitIn('RS-5WN4'); // secteur de CVR-WY02 (absent)
    expect(await validate(CVR(), n)).toMatchObject({ reason: 'not_found' });
    expect(await rowOf(n, CVR())).toBeUndefined();
    await repo.createDelegation(ADMIN(), draft());
    const thread = (await repo.getNeedThread(CVR(), n.id))!;
    expect(thread).not.toBeNull();
    expect(thread.actingFor?.code).toBe('CVR-WY02');
    expect((await repo.getPipeline(CVR())).find((r) => r.need.id === n.id)!.next).toMatchObject({ actor: 'cvr', action: 'validate_need' });
    expect(await validate(CVR(), n)).toEqual({ status: 'ok' });
    const v = (await repo.getNeedThread(AG(), n.id))!.validations.at(-1)!;
    expect(v).toMatchObject({ outcome: 'validated', actor_profile: 'cvr_client' });
    expect(v.via_delegation_id).toBe((await repo.getDelegations(ADMIN())).find((d) => d.substitute_zone_id === zoneId('CVR-ZV01'))!.id);
    // Les décisions de proposition de l'absent relèvent aussi du suppléant pendant l'absence.
    expect((await repo.getScopeZones(CVR())).some((z) => z.code === 'CVR-WY02')).toBe(true);
  });
  it('un suppléant n\'élargit jamais le périmètre au-delà de celui du délégant', async () => {
    await repo.createDelegation(ADMIN(), draft());
    const foreign = await submitIn('RS-RT9F'); // CVR-GP03, non délégué
    const dr = await submitIn('RS-684K'); // DR-BETA
    expect(await rowOf(foreign, CVR())).toBeUndefined();
    expect(await repo.getNeedThread(CVR(), foreign.id)).toBeNull();
    expect(await validate(CVR(), foreign)).toMatchObject({ reason: 'not_found' });
    expect(await validate(CVR(), dr)).toMatchObject({ reason: 'not_found' });
    // Le niveau DR n'est pas délégué par une absence de CVR : arbitrer un besoin escaladé reste au DR.
    const n = await submitIn('RS-5WN4');
    await repo.escalateNeed(CVR(), n.id, { case: 'out_of_perimeter', motive: 'x' });
    expect(await validate(CVR(), n)).toMatchObject({ reason: 'not_pending' });
    // Le périmètre global de la direction, lui, ne change pas, et le suppléant ne reçoit pas les autres CVR du DR.
    const ids = (await repo.getPipeline(CVR())).map((r) => r.need.sector_id);
    const allowed = new Set([...zones.filter((z) => z.parent_id === zoneId('CVR-ZV01') || z.parent_id === zoneId('CVR-WY02')).map((z) => z.id)]);
    expect(ids.every((id) => allowed.has(id))).toBe(true);
    // La visibilité d'un RS ou d'un DR ne bouge pas.
    expect(await rowOf(n, ctxOf('rs'))).toBeUndefined();
  });
  it('fin de délégation : arrêt anticipé immédiat, trace conservée, plus aucun accès', async () => {
    await repo.createDelegation(ADMIN(), draft());
    const n = await submitIn('RS-5WN4');
    await validate(CVR(), n);
    const id = (await repo.getDelegations(ADMIN()))[0]!.id;
    const withDelegation = (await repo.getDelegations(ADMIN())).find((d) => d.absent_zone_id === zoneId('CVR-WY02') && d.starts_on === TODAY)!;
    expect(await repo.stopDelegation(AG(), withDelegation.id)).toMatchObject({ reason: 'forbidden' });
    expect(await repo.stopDelegation(ADMIN(), '00000000-0000-4000-8000-000000000000')).toMatchObject({ reason: 'not_found' });
    expect(await repo.stopDelegation(ADMIN(), withDelegation.id)).toEqual({ status: 'ok' });
    expect(await repo.stopDelegation(ADMIN(), withDelegation.id)).toMatchObject({ reason: 'already' });
    expect(id).toBeTruthy();
    const stopped = (await repo.getDelegations(ADMIN())).find((d) => d.id === withDelegation.id)!;
    expect(stopped).toMatchObject({ stopped_on: TODAY, stopped_by: 'agency_admin' });
    expect(await rowOf(n, CVR())).toBeUndefined();
    const m = await submitIn('RS-5WN4', '2027-01-11');
    expect(await validate(CVR(), m)).toMatchObject({ reason: 'not_found' });
    // La validation faite pendant la délégation reste au dossier.
    expect((await repo.getNeedThread(AG(), n.id))!.validations.at(-1)).toMatchObject({ outcome: 'validated' });
    const codes = (await repo.getEvents(ADMIN())).filter((e) => e.code === 'EV-47').map((e) => e.data.action);
    expect(codes).toEqual(expect.arrayContaining(['created', 'stopped']));
  });
  it('délégation planifiée : aucun effet avant la date ; annulée avant son début : annulée', async () => {
    const r = await repo.createDelegation(ADMIN(), draft({ startsOn: '2026-11-02', endsOn: '2026-11-13' }));
    expect(r.status).toBe('ok');
    const n = await submitIn('RS-5WN4');
    expect(await rowOf(n, CVR())).toBeUndefined();
    const d = (await repo.getDelegations(ADMIN())).find((x) => x.starts_on === '2026-11-02')!;
    expect(await repo.stopDelegation(ADMIN(), d.id)).toEqual({ status: 'ok' });
    const codes = (await repo.getEvents(ADMIN())).filter((e) => e.code === 'EV-47').map((e) => e.data.action);
    expect(codes).toContain('cancelled');
  });
  it('le DR absent est remplacé par un DR : il arbitre sur la zone de l\'absent seulement', async () => {
    const n = await submitIn('RS-684K'); // DR-BETA
    await repo.escalateNeed(cvrOf('CVR-NM04'), n.id, { case: 'out_of_perimeter', motive: 'x' });
    expect(await validate(DR(), n)).toMatchObject({ reason: 'not_found' });
    const r = await repo.createDelegation(ADMIN(), { absentZoneId: zoneId('DR-BETA'), substituteZoneId: zoneId('DR-ALPHA'), startsOn: TODAY, endsOn: '2026-10-30' });
    expect(r.status).toBe('ok');
    expect(await validate(DR(), n)).toEqual({ status: 'ok' });
    const other = await submitIn('RS-V3S1'); // DR-GAMMA
    await repo.escalateNeed(cvrOf('CVR-UH06'), other.id, { case: 'out_of_perimeter', motive: 'x' });
    expect(await validate(DR(), other)).toMatchObject({ reason: 'not_found' });
  });
});

describe('F-30.4 : qualification de l\'agence, cohérence avec les statuts de A3', () => {
  const validated = async (sector = 'RS-HRF1') => { const n = await submitIn(sector); await validate(cvrOf(sector === 'RS-HRF1' ? 'CVR-ZV01' : 'CVR-WY02'), n); return n; };
  it('prise en charge, précision et rejet exigent la validation ; précision et rejet exigent un motif', async () => {
    const n = await validated();
    expect(await repo.qualifyNeed(AG(), n.id, { outcome: 'clarify' })).toMatchObject({ reason: 'motive_required' });
    expect(await repo.qualifyNeed(AG(), n.id, { outcome: 'reject' })).toMatchObject({ reason: 'motive_required' });
    expect((await repo.qualifyNeed(AG(), n.id, { outcome: 'clarify', motive: 'Préciser les magasins (fictif).' })).status).toBe('ok');
    expect((await rowOf(n))!.recruitment.intake).toBe('clarification');
    expect((await rowOf(n))!.next).toMatchObject({ actor: 'rs', action: 'clarify' });
    expect((await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).status).toBe('ok');
    expect(await repo.qualifyNeed(AG(), n.id, { outcome: 'take' })).toMatchObject({ reason: 'already' });
  });
  it('un besoin rejeté ou en précision ne reçoit ni proposition, ni décision, ni étape de recrutement', async () => {
    const n = await validated();
    await repo.qualifyNeed(AG(), n.id, { outcome: 'reject', motive: 'Hors mission (fictif).' });
    const row = (await rowOf(n))!;
    expect(row.positionStatus).toBe('cancelled');
    expect(row.funnel).toBeNull();
    expect((await repo.saveProposal(AG(), n.id, { candidate_ref: 'INT-901', weekly_hours: 14, days: [1, 2, 3], hours_slot: '08:00-12:00', start_date: '2026-12-07', end_date: '2026-12-13', store_codes: [], deviation_note: null, cost_status: 'complete' }, { send: true }))).toMatchObject({ reason: 'not_ready' });
    expect(await repo.recordStep(AG(), n.id, 'start_search')).toMatchObject({ reason: 'not_taken' });
    // Un rejet de l'agence n'efface pas la validation managériale : deux dimensions séparées.
    expect(row.validation.state).toBe('validated');
  });
  it('la qualification de l\'agence ne contourne pas un refus du DR', async () => {
    const n = await submitIn('RS-HRF1');
    await repo.escalateNeed(CVR(), n.id, { case: 'out_of_perimeter', motive: 'x' });
    await refuse(DR(), n);
    expect(await repo.qualifyNeed(ADMIN(), n.id, { outcome: 'take' })).toMatchObject({ reason: 'not_validated' });
  });
});

describe('audience de chaque événement et alerte (D91, D108)', () => {
  it('chaque événement du circuit porte une audience valide, sans motif ni zone concernée dans les données', async () => {
    const n = await submitIn('RS-HRF1');
    await refuse(CVR(), n, 'Motif confidentiel à ne pas journaliser (fictif).');
    await repo.resubmitNeed(ctxOf('rs'), n.id);
    await repo.escalateNeed(CVR(), n.id, { case: 'arbitration', motive: 'Motif d\'escalade (fictif).', concernedZoneId: zoneId('CVR-WY02') });
    await validate(DR(), n);
    await repo.createDelegation(ADMIN(), { absentZoneId: zoneId('CVR-WY02'), substituteZoneId: zoneId('CVR-ZV01'), startsOn: TODAY, endsOn: '2026-10-30', motive: 'Motif de délégation (fictif).' });
    const events = await repo.getEvents(ADMIN());
    const chain = events.filter((e) => ['EV-06', 'EV-07', 'EV-08', 'EV-46', 'EV-47'].includes(e.code));
    expect(chain.length).toBeGreaterThan(5);
    for (const e of chain) {
      expect((AUDIENCES as readonly string[]).includes(e.audience), e.code).toBe(true);
      const text = JSON.stringify(e.data);
      expect(text, e.code).not.toMatch(/fictif|confidentiel/);
      expect(text, e.code).not.toContain(zoneId('CVR-WY02'));
    }
    expect(chain.filter((e) => e.code !== 'EV-47').every((e) => e.audience === 'both')).toBe(true);
    expect(chain.filter((e) => e.code === 'EV-47').every((e) => e.audience === 'agency')).toBe(true);
  });
  it('la cliente ne lit aucun événement de délégation ni aucun événement d\'agence, quel que soit son profil', async () => {
    await repo.createDelegation(ADMIN(), { absentZoneId: zoneId('CVR-WY02'), substituteZoneId: zoneId('CVR-ZV01'), startsOn: TODAY, endsOn: '2026-10-30' });
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs'] as const) {
      const evs = await repo.getEvents(ctxOf(id));
      expect(evs.some((e) => e.code === 'EV-47'), id).toBe(false);
      expect(evs.every((e) => e.audience !== 'agency'), id).toBe(true);
    }
  });
  it('alertes : en attente, en retard, escaladés, refusés (cliente) ; délégation en cours (agence seule)', async () => {
    const keys = async (ctx: AccessContext) => (await repo.getPipelineAlerts(ctx)).map((a) => a.message_key);
    expect(await keys(CVR())).toEqual(expect.arrayContaining(['validationPending', 'validationLate']));
    expect(await keys(DR())).toEqual(expect.arrayContaining(['escalationPending']));
    expect(await keys(ctxOf('rs'))).not.toContain('delegationActive');
    await repo.createDelegation(ADMIN(), { absentZoneId: zoneId('CVR-WY02'), substituteZoneId: zoneId('CVR-ZV01'), startsOn: TODAY, endsOn: '2026-10-30' });
    expect(await keys(ADMIN())).toContain('delegationActive');
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs'] as const) expect(await keys(ctxOf(id)), id).not.toContain('delegationActive');
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs', 'agency_operator', 'agency_admin'] as const) {
      for (const a of await repo.getPipelineAlerts(ctxOf(id))) expect((AUDIENCES as readonly string[]).includes(a.audience), `${id} ${a.message_key}`).toBe(true);
    }
  });
});

describe('entonnoir : les besoins à valider ne comptent pas comme « à qualifier »', () => {
  it('compte séparé, jamais dans les heures demandées', async () => {
    const before = (await repo.getFunnelReport(AG())).summary;
    const n = await submitIn('RS-HRF1');
    const after = (await repo.getFunnelReport(AG())).summary;
    expect(after.toValidate).toBe(before.toValidate + 1);
    expect(after.toQualify).toBe(before.toQualify);
    expect(after.demandedHours).toBe(before.demandedHours);
    await validate(CVR(), n);
    const done = (await repo.getFunnelReport(AG())).summary;
    expect([done.toValidate, done.toQualify]).toEqual([before.toValidate, before.toQualify + 1]);
  });
});
