import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import type { Need, Proposal, ProposalInput } from '@/data/schemas';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { needSpan } from '@/domain/pipeline';
import { AUDIENCES } from '@/domain/types';
import type { ProfileId } from '@/domain/types';
import { period } from './needs-util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const ctxOf = (id: ProfileId) => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr');
const AG = () => ctxOf('agency_operator');
const CVR = () => ctxOf('cvr_client');
const OWN = (ctxOf('rs').scope as { ids: string[] }).ids[0]!;
const CVR_ZONE = (ctxOf('cvr_client').scope as { ids: string[] }).ids[0]!;
const TODAY = '2026-10-23';

beforeEach(() => resetDemoState());

const byCode = async (code: string, ctx = AG()) => (await repo.getPipeline(ctx)).find((r) => r.need.need_code === code)!;

/** Nouveau besoin soumis dans le secteur du RS de démonstration. */
async function submitNeed(over: { periods?: ReturnType<typeof period>[] } = {}): Promise<Need> {
  const stores = (await repo.getStores(AG())).filter((s) => s.sector_id === OWN).slice(0, 1).map((s) => s.code);
  const r = await repo.saveNeed(ctxOf('rs'), {
    dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: OWN, position_label: 'Poste 4', weekly_hours: 14, priority: 2,
    periods: over.periods ?? [period(1, '2026-12-07', '2026-12-13')], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: stores, client_comment: null,
  });
  if (r.status !== 'saved' || r.decision !== 'submit') throw new Error(`besoin non soumis : ${JSON.stringify(r)}`);
  return r.need;
}
const take = (n: Need) => repo.qualifyNeed(AG(), n.id, { outcome: 'take' });
const input = (n: Need, over: Partial<ProposalInput> = {}): ProposalInput => {
  const span = needSpan(n)!;
  return {
    candidate_ref: 'INT-901', weekly_hours: n.weekly_hours!, days: [...n.days], hours_slot: n.hours_slot, start_date: span.start, end_date: span.end,
    store_codes: [...n.store_codes], deviation_note: null, cost_status: 'complete', ...over,
  };
};
async function send(n: Need, over: Partial<ProposalInput> = {}): Promise<Proposal> {
  const r = await repo.saveProposal(AG(), n.id, input(n, over), { send: true });
  if (r.status !== 'saved') throw new Error(`envoi refusé : ${JSON.stringify(r)}`);
  return r.proposal;
}
const decide = (id: string, outcome: 'approved' | 'refused' | 'revision', motive?: string) => repo.decideProposal(CVR(), id, { outcome, ...(motive ? { motive } : {}) });
const rowOf = async (n: Need, ctx = AG()) => (await repo.getPipeline(ctx)).find((r) => r.need.id === n.id)!;

describe('jeu de démonstration A3', () => {
  it('chaque état de l\'entonnoir et chaque statut de poste a un cas repère', async () => {
    const expected: Record<string, [string | null, string | null]> = {
      'BES-DEMO-001': ['started', 'filled'], 'BES-DEMO-002': ['proposed', 'proposed'], 'BES-DEMO-003': ['started', 'filled'],
      'BES-DEMO-004': ['approved', 'approved'], 'BES-DEMO-007': ['proposed', 'proposed'] /* brouillon de proposition : agence */,
      'BES-DEMO-008': ['recruiting', 'recruiting'], 'BES-DEMO-009': ['recruiting', 'refused'], 'BES-DEMO-010': ['to_recruit', 'to_recruit'],
      'BES-DEMO-011': [null, null], 'BES-DEMO-014': [null, 'cancelled'], 'BES-DEMO-015': [null, 'cancelled'],
      'BES-DEMO-017': ['recruiting', 'withdrawal'], 'BES-DEMO-018': ['proposed', 'proposed'], 'BES-DEMO-021': ['hired', 'approved'],
    };
    for (const [code, [funnel, status]] of Object.entries(expected)) {
      const row = await byCode(code);
      if (code === 'BES-DEMO-007') {
        // Un brouillon de proposition ne fait pas passer le besoin à « Proposé » : l'état suit les propositions envoyées.
        expect(row.funnel).toBe('recruiting');
        continue;
      }
      expect([code, row.funnel, row.positionStatus]).toEqual([code, funnel, status]);
    }
  });
  it('remplacement : la décision de la version 1 est invalidée par la version 2', async () => {
    const row = await byCode('BES-DEMO-018');
    const thread = (await repo.getNeedThread(AG(), row.need.id))!;
    const v1 = thread.proposals.find((p) => p.version === 1)!;
    expect(v1.status).toBe('superseded');
    const d = thread.decisions.find((x) => x.proposal_id === v1.id)!;
    expect(d).toMatchObject({ status: 'invalidated', invalidated_reason: 'new_version' });
    expect(d.invalidated_by_proposal_id).toBe(thread.proposals.find((p) => p.version === 2)!.id);
  });
  it('le statut de poste calculé apparaît sur les besoins lus', async () => {
    const needs = await repo.getNeeds(AG());
    expect(needs.find((n) => n.need_code === 'BES-DEMO-001')?.position_status).toBe('filled');
    expect(needs.find((n) => n.need_code === 'BES-DEMO-010')?.position_status).toBe('to_recruit');
  });
});

describe('statuts séparés : besoin, proposition, recrutement, exécution', () => {
  it('chaque dimension évolue seule', async () => {
    const n = await submitNeed();
    let row = await rowOf(n);
    expect(row.recruitment.intake).toBe('to_qualify');
    expect(row.funnel).toBeNull();
    await take(n);
    row = await rowOf(n);
    expect(row.recruitment.intake).toBe('taken');
    expect(row.funnel).toBe('to_recruit');
    expect(row.need.need_state).toBe('submitted'); // la dimension « besoin » n'a pas bougé
    await repo.recordStep(AG(), n.id, 'start_search');
    expect((await rowOf(n)).funnel).toBe('recruiting');
    const p = await send(n);
    expect(p.status).toBe('proposed');
    row = await rowOf(n);
    expect([row.funnel, row.positionStatus, row.next.actor, row.next.action]).toEqual(['proposed', 'proposed', 'decider', 'decide']);
    expect((await decide(p.id, 'approved')).status).toBe('ok');
    expect((await rowOf(n)).funnel).toBe('approved');
    expect((await repo.recordStep(AG(), n.id, 'hired')).status).toBe('ok');
    expect((await rowOf(n)).funnel).toBe('hired');
    // La remise du véhicule est un événement distinct : elle ne fait pas démarrer le poste.
    expect((await repo.recordStep(AG(), n.id, 'vehicle_handover', { date: TODAY })).status).toBe('ok');
    row = await rowOf(n);
    expect([row.funnel, row.recruitment.vehicle_handover_date, row.recruitment.start_work_date]).toEqual(['hired', TODAY, null]);
    expect((await repo.recordStep(AG(), n.id, 'start_work', { date: TODAY })).status).toBe('ok');
    row = await rowOf(n);
    expect([row.funnel, row.positionStatus, row.billableFrom]).toEqual(['started', 'filled', TODAY]);
  });
  it('un besoin non qualifié ne peut recevoir ni proposition ni étape de recrutement', async () => {
    const n = await submitNeed();
    expect(await repo.saveProposal(AG(), n.id, input(n), { send: true })).toMatchObject({ status: 'refused', reason: 'not_ready' });
    expect(await repo.recordStep(AG(), n.id, 'start_search')).toMatchObject({ status: 'refused', reason: 'not_taken' });
  });
  it('qualification : précision et rejet exigent un motif, une seule qualification', async () => {
    const n = await submitNeed();
    expect(await repo.qualifyNeed(AG(), n.id, { outcome: 'reject' })).toMatchObject({ reason: 'motive_required' });
    expect((await repo.qualifyNeed(AG(), n.id, { outcome: 'clarify', motive: 'Quels magasins ?' })).status).toBe('ok');
    expect((await rowOf(n)).next).toMatchObject({ actor: 'rs', action: 'clarify' });
    expect((await take(n)).status).toBe('ok');
    expect(await take(n)).toMatchObject({ reason: 'already' });
  });
});

describe('scénario : refus puis nouvelle proposition', () => {
  it('le refus ramène à « En recrutement » avec compteur, la nouvelle proposition invalide la décision précédente', async () => {
    const n = await submitNeed();
    await take(n);
    const v1 = await send(n, { candidate_ref: 'INT-901' });
    expect(await decide(v1.id, 'refused')).toMatchObject({ status: 'refused', reason: 'motive_required' });
    expect((await decide(v1.id, 'refused', 'Profil non adapté.')).status).toBe('ok');
    let row = await rowOf(n);
    expect([row.funnel, row.positionStatus, row.recruitment.refusal_count, row.next.action]).toEqual(['recruiting', 'refused', 1, 'new_proposal']);
    const v2 = await send(n, { candidate_ref: 'INT-902' });
    expect(v2.version).toBe(2);
    row = await rowOf(n);
    expect([row.funnel, row.proposal?.version, row.decision]).toEqual(['proposed', 2, null]);
    const thread = (await repo.getNeedThread(AG(), n.id))!;
    expect(thread.proposals.find((p) => p.version === 1)?.status).toBe('superseded');
    expect(thread.decisions.find((d) => d.version === 1)).toMatchObject({ status: 'invalidated', invalidated_reason: 'new_version', invalidated_by_proposal_id: v2.id });
    expect(row.recruitment.refusal_count).toBe(1); // rien n'est effacé
  });
});

describe('scénario : modification après accord', () => {
  it('une version aux éléments déterminants différents invalide l\'accord, jamais en silence', async () => {
    const n = await submitNeed();
    await take(n);
    const v1 = await send(n);
    await decide(v1.id, 'approved');
    expect((await rowOf(n)).funnel).toBe('approved');
    const v2 = await send(n, { candidate_ref: 'INT-902', weekly_hours: 10, deviation_note: 'Disponibilité réduite.' });
    expect(v2.deviations).toEqual(['hours']);
    const row = await rowOf(n);
    expect([row.funnel, row.decision]).toEqual(['proposed', null]);
    const ev = (await repo.getEvents(AG())).filter((e) => e.need_id === n.id);
    expect(ev.some((e) => e.code === 'EV-12' && e.data.reason === 'new_version')).toBe(true);
    expect(await repo.recordStep(AG(), n.id, 'hired')).toMatchObject({ reason: 'no_accord' });
  });
  it('une version identique à la précédente est refusée', async () => {
    const n = await submitNeed();
    await take(n);
    await send(n);
    expect(await repo.saveProposal(AG(), n.id, input(n), { send: true })).toMatchObject({ status: 'refused', reason: 'issues', issues: ['no_change'] });
  });
  it('un écart au besoin sans explication est refusé à l\'envoi', async () => {
    const n = await submitNeed();
    await take(n);
    expect(await repo.saveProposal(AG(), n.id, input(n, { weekly_hours: 10 }), { send: true })).toMatchObject({ reason: 'issues', issues: ['deviation_unexplained'] });
    // En brouillon, l'écart peut rester à expliquer.
    expect((await repo.saveProposal(AG(), n.id, input(n, { weekly_hours: 10 }))).status).toBe('saved');
  });
  it('le besoin modifié après accord invalide l\'accord (période étendue par fusion)', async () => {
    const n = await submitNeed();
    await take(n);
    const v1 = await send(n);
    await decide(v1.id, 'approved');
    const merged = await repo.saveNeed(ctxOf('rs'), {
      dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: OWN, position_label: 'Poste 4', weekly_hours: 14, priority: 2,
      periods: [period(1, '2026-12-14', '2026-12-20')], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: n.store_codes, client_comment: null,
    }, { mergeInto: n.id, confirm: true });
    expect(merged.status).toBe('saved');
    const row = await rowOf(n);
    expect([row.needChanged, row.decision, row.funnel]).toEqual([true, null, 'proposed']);
    const thread = (await repo.getNeedThread(AG(), n.id))!;
    expect(thread.decisions[0]).toMatchObject({ status: 'invalidated', invalidated_reason: 'need_changed' });
    // Le besoin ayant changé, la même proposition peut être renvoyée pour confirmation (version 2).
    const again = await repo.saveProposal(AG(), n.id, input(n, { end_date: '2026-12-20', start_date: '2026-12-07' }), { send: true });
    expect(again.status).toBe('saved');
  });
});

describe('scénario : deux propositions sur un besoin', () => {
  it('la cliente ne voit pas le brouillon, et ne peut décider que la version envoyée la plus récente', async () => {
    const n = await submitNeed();
    await take(n);
    const v1 = await send(n);
    const draft = await repo.saveProposal(AG(), n.id, input(n, { candidate_ref: 'INT-902' }));
    if (draft.status !== 'saved') throw new Error('brouillon');
    expect(draft.proposal.status).toBe('in_progress');
    expect(draft.proposal.version).toBe(2);
    // La version envoyée reste la proposition courante de la cliente ; le brouillon lui est invisible.
    const client = await repo.getNeedThread(CVR(), n.id);
    expect(client?.proposals.map((p) => p.version)).toEqual([1]);
    expect(await decide(draft.proposal.id, 'approved')).toMatchObject({ status: 'refused', reason: 'not_found' });
    const sent2 = await repo.saveProposal(AG(), n.id, input(n, { candidate_ref: 'INT-902' }), { send: true });
    expect(sent2.status).toBe('saved');
    expect(await decide(v1.id, 'approved')).toMatchObject({ reason: 'not_decidable' });
    expect(sent2.status === 'saved' && (await decide(sent2.proposal.id, 'approved')).status).toBe('ok');
  });
  it('une seule décision valide par version', async () => {
    const n = await submitNeed();
    await take(n);
    const v1 = await send(n);
    await decide(v1.id, 'revision', 'Horaires à revoir.');
    expect(await decide(v1.id, 'approved')).toMatchObject({ reason: 'already_decided' });
    expect((await rowOf(n)).next).toMatchObject({ actor: 'agency', action: 'revise_proposal' });
  });
  it('retrait d\'une proposition envoyée : motif obligatoire, accord invalidé', async () => {
    const n = await submitNeed();
    await take(n);
    const v1 = await send(n);
    await decide(v1.id, 'approved');
    expect(await repo.withdrawProposal(AG(), v1.id, '')).toMatchObject({ reason: 'motive_required' });
    expect((await repo.withdrawProposal(AG(), v1.id, 'Candidate indisponible.')).status).toBe('ok');
    const row = await rowOf(n);
    expect([row.decision, row.funnel]).toEqual([null, 'recruiting']);
    expect((await repo.getNeedThread(AG(), n.id))!.decisions[0]).toMatchObject({ status: 'invalidated', invalidated_reason: 'withdrawn' });
  });
});

describe('droits et périmètre', () => {
  it('seule la cliente décide, dans son périmètre ; seule l\'agence qualifie et propose', async () => {
    const n = await submitNeed();
    await take(n);
    const p = await send(n);
    for (const id of ['rs', 'agency_operator', 'agency_admin', 'provider_admin'] as const) {
      expect(await repo.decideProposal(ctxOf(id), p.id, { outcome: 'approved' }), id).toMatchObject({ reason: 'forbidden' });
    }
    // Un CVR d'un autre périmètre ne voit pas la proposition.
    const other = (await repo.getScopeZones(AG())).filter((z) => z.kind === 'cvr' && z.id !== CVR_ZONE)[0]!;
    const otherCvr = { ...CVR(), scope: { kind: 'cvr' as const, ids: [other.id] } };
    expect(await repo.decideProposal(otherCvr, p.id, { outcome: 'approved' })).toMatchObject({ reason: 'not_found' });
    expect(await repo.getNeedThread(otherCvr, n.id)).toBeNull();
    expect(await repo.qualifyNeed(CVR(), n.id, { outcome: 'take' })).toMatchObject({ reason: 'forbidden' });
    expect(await repo.saveProposal(CVR(), n.id, input(n), { send: true })).toMatchObject({ reason: 'forbidden' });
    expect(await repo.recordStep(CVR(), n.id, 'hired')).toMatchObject({ reason: 'forbidden' });
  });
  it('le RS enregistre prise de poste et remise du véhicule sur son secteur, pas le reste', async () => {
    const n = await submitNeed();
    await take(n);
    const p = await send(n);
    await decide(p.id, 'approved');
    await repo.recordStep(AG(), n.id, 'hired');
    const rs = ctxOf('rs');
    expect(repo.canRecord(rs, 'start_work')).toBe(true);
    expect(repo.canRecord(rs, 'hired')).toBe(false);
    expect((await repo.recordStep(rs, n.id, 'start_work', { date: TODAY })).status).toBe('ok');
    expect((await repo.recordStep(rs, n.id, 'vehicle_handover', { date: TODAY })).status).toBe('ok');
    expect(await repo.recordStep(rs, n.id, 'stop', { motive: 'x' })).toMatchObject({ reason: 'forbidden' });
  });
  it('le chiffrage est réservé à l\'agence : nul côté cliente, jamais présenté comme 0', async () => {
    const n = await submitNeed();
    await take(n);
    await send(n, { cost_status: 'partial' });
    expect((await rowOf(n)).proposal?.cost_status).toBe('partial');
    expect((await rowOf(n, CVR())).proposal?.cost_status).toBeNull();
    expect((await repo.getNeedThread(CVR(), n.id))!.proposals.every((p) => p.cost_status === null)).toBe(true);
  });
  it('l\'échéance interne de l\'agence n\'est pas communiquée à la cliente (D108)', async () => {
    const own = await byCode('BES-DEMO-007', AG()); // proposition en retard, côté agence
    expect(own.next.urgency).toBe('overdue');
    const client = await byCode('BES-DEMO-007', ctxOf('dr_client'));
    expect(client.next).toMatchObject({ actor: 'agency', due: null, urgency: null, lateDays: 0 });
  });
  it('le secteur d\'origine d\'une réattribution hors périmètre n\'est pas communiqué', async () => {
    const row = await byCode('BES-DEMO-003', AG());
    expect(row.recruitment.reassigned_from_sector_id).not.toBeNull();
    expect((await byCode('BES-DEMO-003', ctxOf('rs'))).recruitment.reassigned_from_sector_id).toBeNull();
  });
  it('un décideur ne voit que son périmètre dans « à traiter »', async () => {
    const ids = (await repo.getPipeline(CVR())).map((r) => r.need.sector_id);
    expect(new Set(ids).size).toBeGreaterThan(0);
    for (const sector of ids) expect(zones.find((z) => z.id === sector)?.parent_id).toBe(CVR_ZONE);
  });
});

describe('validation en lot', () => {
  it('motif commun, chaque proposition contrôlée seule, un refus n\'arrête pas les autres', async () => {
    const a = await submitNeed();
    const b = await submitNeed({ periods: [period(1, '2026-12-14', '2026-12-20')] });
    await take(a);
    await take(b);
    const pa = await send(a);
    const pb = await send(b);
    await decide(pb.id, 'revision', 'Déjà vu.');
    const res = await repo.decideBatch(CVR(), [pa.id, pb.id, 'inconnu'], { outcome: 'approved', motive: 'Lot validé.' });
    expect(res).toMatchObject({ decided: 1, refused: 2 });
    expect(res.items.map((i) => i.reason)).toEqual([undefined, 'already_decided', 'not_found']);
    const decisions = (await repo.getNeedThread(CVR(), a.id))!.decisions;
    expect(decisions[0]).toMatchObject({ outcome: 'approved', motive: 'Lot validé.' });
  });
  it('un refus en lot exige un motif commun', async () => {
    const a = await submitNeed();
    await take(a);
    const pa = await send(a);
    expect((await repo.decideBatch(CVR(), [pa.id], { outcome: 'refused' })).items[0]).toMatchObject({ status: 'refused', reason: 'motive_required' });
  });
});

describe('recrutement : sorties, hors entonnoir, délais', () => {
  async function hired(): Promise<Need> {
    const n = await submitNeed();
    await take(n);
    const p = await send(n);
    await decide(p.id, 'approved');
    await repo.recordStep(AG(), n.id, 'hired');
    return n;
  }
  it('désistement : retour à « En recrutement », compteur, accord invalidé, cycle conservé (D97)', async () => {
    const n = await hired();
    expect((await repo.recordStep(AG(), n.id, 'withdrawal')).status).toBe('ok');
    const row = await rowOf(n);
    expect([row.funnel, row.positionStatus, row.recruitment.withdrawal_count, row.recruitment.hired_on]).toEqual(['recruiting', 'withdrawal', 1, null]);
    expect(row.recruitment.exits).toHaveLength(1);
    expect(row.recruitment.exits[0]).toMatchObject({ kind: 'withdrawal', hired_on: TODAY });
    expect((await repo.getNeedThread(AG(), n.id))!.decisions[0]?.status).toBe('invalidated');
    expect(row.proposal?.status).toBe('withdrawn');
  });
  it('départ après la prise de poste : rupture', async () => {
    const n = await hired();
    await repo.recordStep(AG(), n.id, 'start_work', { date: TODAY });
    await repo.recordStep(AG(), n.id, 'withdrawal');
    expect((await rowOf(n)).positionStatus).toBe('termination');
  });
  it('stoppé exige un motif et sort de l\'entonnoir', async () => {
    const n = await submitNeed();
    await take(n);
    expect(await repo.recordStep(AG(), n.id, 'stop')).toMatchObject({ reason: 'motive_required' });
    expect((await repo.recordStep(AG(), n.id, 'stop', { motive: 'Magasin fermé.' })).status).toBe('ok');
    const row = await rowOf(n);
    expect([row.funnel, row.positionStatus]).toEqual([null, 'cancelled']);
    expect(await repo.recordStep(AG(), n.id, 'start_search')).toMatchObject({ reason: 'closed' });
  });
  it('zone blanche : exclue du taux d\'heures, ligne séparée', async () => {
    const before = await repo.getFunnelReport(AG());
    const n = await submitNeed();
    await take(n);
    await repo.recordStep(AG(), n.id, 'white_zone');
    const after = await repo.getFunnelReport(AG());
    expect(after.summary.whiteZone.needs).toBe(before.summary.whiteZone.needs + 1);
    expect(after.summary.demandedHours).toBe(before.summary.demandedHours);
    expect(after.summary.startedRate).toBe(before.summary.startedRate);
    expect(after.vacancies.some((v) => v.needId === n.id && v.days === 0)).toBe(true);
    expect((await repo.recordStep(AG(), n.id, 'lift_white_zone')).status).toBe('ok');
  });
  it('réattribution : secteur d\'origine valide exigé', async () => {
    const n = await submitNeed();
    await take(n);
    expect(await repo.recordStep(AG(), n.id, 'reassign', { fromSectorId: n.sector_id })).toMatchObject({ reason: 'invalid_sector' });
    const other = zones.find((z) => z.kind === 'rs' && z.id !== n.sector_id)!;
    expect((await repo.recordStep(AG(), n.id, 'reassign', { fromSectorId: other.id })).status).toBe('ok');
    expect((await rowOf(n)).recruitment.situation).toBe('reassigned');
  });
  it('dates : recrutement après l\'accord seulement, jamais dans le futur ; prise de poste planifiable', async () => {
    const n = await hired();
    expect(await repo.recordStep(AG(), n.id, 'training', { date: '2026-12-01' })).toMatchObject({ reason: 'invalid' });
    expect((await repo.recordStep(AG(), n.id, 'start_work', { date: '2026-11-02' })).status).toBe('ok');
    const row = await rowOf(n);
    expect(row.funnel).toBe('hired'); // la prise de poste n'est pas atteinte
    expect(row.billableFrom).toBe('2026-11-02');
    expect((await rowOf(n, CVR())).billableFrom).toBeNull(); // facturation : agence seule
  });
  it('délais par situation : réattribué sous l\'effectif minimal, zone blanche sans délai', async () => {
    const report = await repo.getFunnelReport(AG());
    expect(report.delays.new.j1.sufficient).toBe(true);
    expect(report.delays.reassigned.j1).toMatchObject({ n: 1, sufficient: false });
    expect(report.delays.white_zone.j1.n).toBe(0);
    expect(report.params.min_sample).toBe(5);
  });
  it('taux : nul (donnée indisponible) quand aucune heure n\'est demandée, jamais 0', async () => {
    const report = await repo.getFunnelReport(ctxOf('rs'));
    expect(report.summary.demandedHours).toBeGreaterThan(0);
    const other = { ...ctxOf('rs'), scope: { kind: 'rs' as const, ids: [zones.find((z) => z.kind === 'rs' && z.parent_id !== CVR_ZONE && z.responsible_name !== '')!.id] } };
    const empty = { ...other, scope: { kind: 'rs' as const, ids: [zones.filter((z) => z.kind === 'rs').at(-1)!.id] } };
    const r = await repo.getFunnelReport(empty);
    if (r.summary.demandedHours === 0) {
      expect(r.summary.hiredRate).toBeNull();
      expect(r.summary.startedRate).toBeNull();
    }
  });
});

describe('notes (D162)', () => {
  async function proposalOnNeed() {
    const n = await submitNeed();
    await take(n);
    return { n, p: await send(n) };
  }
  it('interne par défaut, invisible de la cliente, sans confirmation requise', async () => {
    const { p } = await proposalOnNeed();
    expect((await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'Note interne.', visibility: 'agency_internal' })).status).toBe('ok');
    expect((await repo.getNotes(AG(), 'proposal', p.id)).map((x) => x.visibility)).toEqual(['agency_internal']);
    expect(await repo.getNotes(CVR(), 'proposal', p.id)).toEqual([]);
    expect(await repo.getNotes(ctxOf('direction_client'), 'proposal', p.id)).toEqual([]);
  });
  it('partager exige une confirmation explicite', async () => {
    const { p } = await proposalOnNeed();
    const base = { objectKind: 'proposal' as const, objectId: p.id, text: 'Pour la cliente.', visibility: 'shared_client' as const };
    expect(await repo.addNote(AG(), base)).toMatchObject({ reason: 'confirm_required' });
    expect(await repo.getNotes(AG(), 'proposal', p.id)).toEqual([]);
    expect((await repo.addNote(AG(), { ...base, confirmShare: true })).status).toBe('ok');
    expect((await repo.getNotes(CVR(), 'proposal', p.id)).map((x) => x.text)).toEqual(['Pour la cliente.']);
  });
  it('destinataire désigné : lui seul la lit, un destinataire étranger au besoin est refusé', async () => {
    const { p } = await proposalOnNeed();
    const base = { objectKind: 'proposal' as const, objectId: p.id, text: 'Pour le CVR.', visibility: 'shared_recipient' as const, confirmShare: true };
    const foreign = zones.find((z) => z.kind === 'cvr' && z.id !== CVR_ZONE)!.id;
    expect(await repo.addNote(AG(), { ...base, recipientZoneId: foreign })).toMatchObject({ reason: 'invalid_recipient' });
    expect(await repo.addNote(AG(), base)).toMatchObject({ reason: 'invalid_recipient' });
    expect((await repo.addNote(AG(), { ...base, recipientZoneId: CVR_ZONE })).status).toBe('ok');
    expect(await repo.getNotes(CVR(), 'proposal', p.id)).toHaveLength(1);
    expect(await repo.getNotes(ctxOf('direction_client'), 'proposal', p.id)).toEqual([]);
    expect(await repo.getNotes(ctxOf('dr_client'), 'proposal', p.id)).toEqual([]);
  });
  it('retrait : la cliente ne la voit plus, l\'agence garde la trace, jamais de retour à l\'interne', async () => {
    const { p } = await proposalOnNeed();
    await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'À retirer.', visibility: 'shared_client', confirmShare: true });
    const note = (await repo.getNotes(AG(), 'proposal', p.id))[0]!;
    expect((await repo.withdrawNote(AG(), note.id)).status).toBe('ok');
    expect(await repo.withdrawNote(AG(), note.id)).toMatchObject({ reason: 'already' });
    expect(await repo.getNotes(CVR(), 'proposal', p.id)).toEqual([]);
    const kept = (await repo.getNotes(AG(), 'proposal', p.id))[0]!;
    expect(kept).toMatchObject({ visibility: 'shared_client', withdrawn_by: 'agency_operator' });
    expect(kept.withdrawn_on).toBe(TODAY);
  });
  it('la cliente n\'écrit pas de note ; une visibilité inconnue est refusée', async () => {
    const { p } = await proposalOnNeed();
    expect(await repo.addNote(CVR(), { objectKind: 'proposal', objectId: p.id, text: 'x', visibility: 'shared_client', confirmShare: true })).toMatchObject({ reason: 'forbidden' });
    expect(await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'x', visibility: 'public' as never, confirmShare: true })).toMatchObject({ reason: 'invalid' });
  });
  it('un brouillon de proposition n\'expose pas ses notes à la cliente', async () => {
    const n = await submitNeed();
    await take(n);
    const draft = await repo.saveProposal(AG(), n.id, input(n));
    if (draft.status !== 'saved') throw new Error('brouillon');
    await repo.addNote(AG(), { objectKind: 'proposal', objectId: draft.proposal.id, text: 'x', visibility: 'shared_client', confirmShare: true });
    expect(await repo.getNotes(CVR(), 'proposal', draft.proposal.id)).toEqual([]);
  });
  it('fixtures : note interne, partagée, adressée et retirée respectent la lecture par profil', async () => {
    const all = async (ctx: ReturnType<typeof ctxOf>) => {
      const out: string[] = [];
      for (const row of await repo.getPipeline(ctx)) for (const x of (await repo.getNeedThread(ctx, row.need.id))!.notes) out.push(`${x.visibility}${x.withdrawn_on ? ':retirée' : ''}`);
      return out.sort();
    };
    expect(await all(AG())).toEqual(['agency_internal', 'shared_client', 'shared_client:retirée', 'shared_recipient']);
    expect(await all(CVR())).toEqual(['shared_client', 'shared_recipient']);
    expect(await all(ctxOf('direction_client'))).toEqual(['shared_client']);
    expect(await all(ctxOf('dr_client'))).toEqual(['shared_client']);
  });
});

describe('audience de tous les événements et de toutes les alertes émis (D91, D108)', () => {
  it('chaque événement porte une audience valide ; aucun ne transporte de coût ni de texte de note ou de motif', async () => {
    const n = await submitNeed();
    await take(n);
    const p = await send(n, { cost_status: 'not_priced' });
    await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'SECRET-INTERNE', visibility: 'agency_internal' });
    await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'SECRET-DESTINATAIRE', visibility: 'shared_recipient', recipientZoneId: CVR_ZONE, confirmShare: true });
    await decide(p.id, 'refused', 'MOTIF-SECRET');
    await repo.recordStep(AG(), n.id, 'stop', { motive: 'ARRET-SECRET' });
    const agency = await repo.getEvents(AG());
    for (const e of agency) expect(AUDIENCES, `${e.code}`).toContain(e.audience);
    const dump = JSON.stringify(agency);
    for (const secret of ['SECRET-INTERNE', 'SECRET-DESTINATAIRE', 'MOTIF-SECRET', 'ARRET-SECRET']) expect(dump).not.toContain(secret);
    expect(agency.filter((e) => e.data && 'cost_status' in e.data)).toEqual([]);
  });
  it('la cliente ne lit aucun événement d\'agence : ni note interne, ni note adressée', async () => {
    const n = await submitNeed();
    await take(n);
    const p = await send(n);
    await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'a', visibility: 'agency_internal' });
    await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'b', visibility: 'shared_recipient', recipientZoneId: CVR_ZONE, confirmShare: true });
    await repo.addNote(AG(), { objectKind: 'proposal', objectId: p.id, text: 'c', visibility: 'shared_client', confirmShare: true });
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs'] as const) {
      const events = await repo.getEvents(ctxOf(id));
      expect(events.filter((e) => e.audience === 'agency'), id).toEqual([]);
      expect(events.filter((e) => e.code === 'EV-44' && e.need_id === n.id).length, id).toBeLessThanOrEqual(1);
    }
    expect((await repo.getEvents(CVR())).filter((e) => e.code === 'EV-44' && e.need_id === n.id)).toHaveLength(1);
    expect((await repo.getEvents(AG())).filter((e) => e.code === 'EV-44' && e.need_id === n.id)).toHaveLength(3);
  });
  it('les événements du circuit portent leur code du catalogue, avec audience « les deux »', async () => {
    const n = await submitNeed();
    await take(n);
    const v1 = await send(n);
    await decide(v1.id, 'approved');
    await repo.recordStep(AG(), n.id, 'hired');
    await repo.recordStep(AG(), n.id, 'vehicle_handover', { date: TODAY });
    await repo.recordStep(AG(), n.id, 'start_work', { date: TODAY });
    const codes = (await repo.getEvents(AG())).filter((e) => e.need_id === n.id).map((e) => e.code);
    for (const c of ['EV-09', 'EV-10', 'EV-11', 'EV-14', 'EV-16', 'EV-17']) expect(codes, c).toContain(c);
    const circuit = (await repo.getEvents(AG())).filter((e) => e.need_id === n.id && e.code !== 'EV-01' && e.code !== 'EV-02');
    for (const e of circuit) expect(e.audience, e.code).toBe('both');
  });
  it('alertes : audience valide, une alerte d\'agence n\'atteint jamais la cliente', async () => {
    const agency = await repo.getPipelineAlerts(AG());
    expect(agency.length).toBeGreaterThan(0);
    for (const a of agency) expect(AUDIENCES).toContain(a.audience);
    expect(agency.map((a) => a.message_key)).toEqual(expect.arrayContaining(['proposalLate', 'costingIncomplete', 'decisionsPending', 'decisionsLate']));
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs'] as const) {
      const client = await repo.getPipelineAlerts(ctxOf(id));
      expect(client.filter((a) => a.audience === 'agency'), id).toEqual([]);
      expect(client.map((a) => a.message_key), id).not.toContain('proposalLate');
      expect(client.map((a) => a.message_key), id).not.toContain('costingIncomplete');
    }
    expect((await repo.getPipelineAlerts(CVR())).map((a) => a.message_key)).toContain('decisionsPending');
  });
  it('les alertes ne comptent que le périmètre du lecteur', async () => {
    const all = (await repo.getPipelineAlerts(ctxOf('direction_client'))).find((a) => a.message_key === 'decisionsPending')!;
    const cvr = (await repo.getPipelineAlerts(CVR())).find((a) => a.message_key === 'decisionsPending')!;
    expect(Number(all.params.n)).toBeGreaterThan(Number(cvr.params.n));
  });
});

describe('annulation après écriture (D159)', () => {
  it('l\'envoi d\'une proposition est annulable : retour à l\'état précédent, journal conservé', async () => {
    const n = await submitNeed();
    await take(n);
    const { result, undoToken } = await repo.withUndo(AG(), () => repo.saveProposal(AG(), n.id, input(n), { send: true }), (r) => r.status === 'saved');
    expect(result.status).toBe('saved');
    expect(undoToken).toBeTruthy();
    expect((await rowOf(n)).proposalCount).toBe(1);
    expect((await repo.undoWrite(AG(), undoToken as string)).status).toBe('ok');
    expect((await rowOf(n)).proposalCount).toBe(0);
    const journal = await repo.getEvents(AG());
    expect(journal.some((e) => e.need_id === n.id && e.code === 'EV-10')).toBe(true); // l'écriture annulée reste au journal
    expect(journal.some((e) => e.code === 'EV-39')).toBe(true);
  });
  it('une décision est annulable tant qu\'aucune autre écriture n\'a eu lieu', async () => {
    const n = await submitNeed();
    await take(n);
    const p = await send(n);
    const { undoToken } = await repo.withUndo(CVR(), () => decide(p.id, 'approved'), (r) => r.status === 'ok');
    expect((await rowOf(n)).funnel).toBe('approved');
    expect((await repo.undoWrite(CVR(), undoToken as string)).status).toBe('ok');
    expect((await rowOf(n)).funnel).toBe('proposed');
  });
});
