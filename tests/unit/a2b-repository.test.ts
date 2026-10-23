import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import type { BatchRow } from '@/data/schemas';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { emptyBatchRow } from '@/domain/batch';
import { PROFILE_IDS } from '@/domain/types';
import type { ProfileId } from '@/domain/types';
import type { RuleInput } from '@/domain/week-rules';
import { period } from './needs-util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const ctxOf = (id: ProfileId) => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr');
const OWN = (ctxOf('rs').scope as { ids: string[] }).ids[0]!;
const CVR_ZONE = (ctxOf('cvr_client').scope as { ids: string[] }).ids[0]!;

async function storeCodes(sector: string, n = 1) {
  return (await repo.getStores(ctxOf('agency_operator'))).filter((s) => s.sector_id === sector).slice(0, n).map((s) => s.code);
}

async function need(over: Partial<RuleInput> = {}, sector = OWN): Promise<RuleInput> {
  return {
    dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', sector_id: sector, position_label: 'Poste 4',
    weekly_hours: 14, priority: 2, periods: [period(1, '2027-03-01', '2027-03-07')], days: [1, 2, 3], hours_slot: '08:00-12:00',
    store_codes: await storeCodes(sector), client_comment: null, ...over,
  };
}
const NOVEMBER = [period(1, '2026-11-09', '2026-11-15')];
const DECEMBER = [period(1, '2026-12-07', '2026-12-13')];

beforeEach(() => resetDemoState());

describe('blocage après échéance côté données (D78)', () => {
  it('le Repository refuse l\'écriture d\'un mois clos, n\'écrit rien et journalise EV-04', async () => {
    const before = (await repo.getNeeds(ctxOf('rs'))).length;
    const r = await repo.saveNeed(ctxOf('rs'), await need({ periods: NOVEMBER }));
    expect(r.status).toBe('refused');
    if (r.status !== 'refused') return;
    expect(r.reason).toBe('blocked');
    const f = r.findings.find((x) => x.rule === 'E1')!;
    expect(f.gravity).toBe('blocking');
    expect(f.params).toMatchObject({ month: '2026-11', deadline: '2026-10-19' });
    expect(f.defer).toEqual({ toMonth: '2026-12' });
    expect((await repo.getNeeds(ctxOf('rs'))).length).toBe(before);
    const ev = (await repo.getEvents(ctxOf('agency_operator'))).filter((e) => e.code === 'EV-04');
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ audience: 'agency', data: { kind: 'blocked', rule: 'E1' } });
  });

  it('un brouillon sans date n\'est pas bloqué, un brouillon daté d\'un mois clos l\'est', async () => {
    const draft = await repo.saveNeed(ctxOf('rs'), await need({ periods: [], weekly_hours: null }));
    expect(draft.status).toBe('saved');
    const dated = await repo.saveNeed(ctxOf('rs'), await need({ periods: NOVEMBER, weekly_hours: null }));
    expect(dated.status).toBe('refused');
  });

  it('décembre est ouvert au 23/10/2026, la duplication d\'un besoin vers un mois clos est refusée', async () => {
    expect((await repo.saveNeed(ctxOf('rs'), await need({ periods: DECEMBER }))).status).toBe('saved');
    const mine = (await repo.getNeeds(ctxOf('rs'))).find((n) => n.need_state === 'submitted' && n.periods.length > 0)!;
    const dup = await repo.duplicateNeed(ctxOf('rs'), mine.id, '2026-11-23');
    expect(dup.status).toBe('refused');
  });

  it('report sur le mois suivant : accepté, marqué « reportée », tracé par EV-04', async () => {
    const r = await repo.saveNeed(ctxOf('rs'), await need({ periods: NOVEMBER }), { deferToNextMonth: true, confirm: true });
    expect(r.status).toBe('saved');
    if (r.status !== 'saved') return;
    expect(r.need.deferred_from_month).toBe('2026-11');
    const ev = (await repo.getEvents(ctxOf('agency_operator'))).filter((e) => e.code === 'EV-04');
    expect(ev[0]?.data).toMatchObject({ kind: 'deferred', from: '2026-11', to: '2026-12' });
  });

  it('le mois suivant clos aussi : le report est refusé', async () => {
    await repo.setDefaultPreset(ctxOf('agency_admin'), 'standard');
    await repo.updateDeadlineEntry(ctxOf('agency_admin'), { month: '2026-12', type: 'needs_entry', mode: 'fixed', fixedDate: '2026-10-22' });
    const r = await repo.saveNeed(ctxOf('rs'), await need({ periods: NOVEMBER }), { deferToNextMonth: true });
    expect(r.status).toBe('refused');
  });
});

describe('réouverture par l\'agence seule (D82, D87, D147)', () => {
  const ask = { scope: 'month' as const, target: '2026-11', motive: 'Besoin tardif', desiredUntil: '2026-11-06' };

  it('seul le CVR demande une réouverture', async () => {
    for (const id of PROFILE_IDS.filter((p) => p !== 'cvr_client')) {
      const r = await repo.requestReopening(ctxOf(id), ask);
      expect(r, id).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect((await repo.requestReopening(ctxOf('cvr_client'), { ...ask, target: '2026-12' })).status).toBe('refused'); // décembre n'est pas clos
    expect(await repo.requestReopening(ctxOf('cvr_client'), ask)).toEqual({ status: 'refused', reason: 'duplicate' }); // la demande fictive existe déjà
    expect((await repo.requestReopening(ctxOf('cvr_client'), { ...ask, target: '2026-10' })).status).toBe('ok');
    expect((await repo.getEvents(ctxOf('agency_operator'))).some((e) => e.code === 'EV-32')).toBe(true);
  });

  it('un CVR ne peut pas rouvrir lui-même, ni aucun profil hors agence administration', async () => {
    const request = (await repo.getReopeningRequests(ctxOf('agency_admin')))[0]!;
    const grant = { requestId: request.id, decision: 'grant' as const, scope: 'month' as const, target: '2026-11', zoneId: CVR_ZONE, reason: 'Motif', expiresOn: '2026-11-06' };
    for (const id of PROFILE_IDS.filter((p) => p !== 'agency_admin')) {
      expect(await repo.decideReopening(ctxOf(id), grant), id).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect((await repo.getReopenings(ctxOf('agency_admin')))).toHaveLength(0);
    const r = await repo.saveNeed(ctxOf('rs'), await need({ periods: NOVEMBER }));
    expect(r.status).toBe('refused');
  });

  it('la réouverture par l\'agence rétablit l\'écriture, avec motif, durée et trace', async () => {
    const request = (await repo.getReopeningRequests(ctxOf('agency_admin')))[0]!;
    const res = await repo.decideReopening(ctxOf('agency_admin'), {
      requestId: request.id, decision: 'grant', scope: 'month', target: '2026-11', zoneId: CVR_ZONE, reason: 'Besoin tardif accepté', expiresOn: '2026-11-06',
    });
    expect(res.status).toBe('ok');
    const [reopening] = await repo.getReopenings(ctxOf('agency_admin'));
    expect(reopening).toMatchObject({ target: '2026-11', reason: 'Besoin tardif accepté', expires_on: '2026-11-06', decided_by: 'agency_admin', request_id: request.id });
    expect((await repo.getReopeningRequests(ctxOf('agency_admin')))[0]?.status).toBe('granted');
    // Le RS du CVR peut de nouveau saisir ; un RS hors de ce CVR reste bloqué.
    expect((await repo.saveNeed(ctxOf('rs'), await need({ periods: NOVEMBER }), { confirm: true })).status).toBe('saved');
    const elsewhere = zones.filter((z) => z.kind === 'rs').find((z) => !(zones.find((c) => c.id === CVR_ZONE) && z.parent_id === CVR_ZONE))!;
    const other = await repo.saveNeed(ctxOf('agency_operator'), await need({ periods: NOVEMBER }, elsewhere.id));
    expect(other.status).toBe('refused');
    const ev = (await repo.getEvents(ctxOf('agency_operator'))).filter((e) => e.code === 'EV-33');
    expect(ev[0]).toMatchObject({ audience: 'both', data: { decision: 'granted', until: '2026-11-06' } });
  });

  it('un refus de l\'agence clôt la demande sans rouvrir', async () => {
    const request = (await repo.getReopeningRequests(ctxOf('agency_admin')))[0]!;
    await repo.decideReopening(ctxOf('agency_admin'), { requestId: request.id, decision: 'decline', scope: 'month', target: '2026-11', zoneId: CVR_ZONE, reason: '', expiresOn: '2026-11-06' });
    expect((await repo.getReopeningRequests(ctxOf('agency_admin')))[0]?.status).toBe('declined');
    expect(await repo.getReopenings(ctxOf('agency_admin'))).toHaveLength(0);
  });

  it('motif obligatoire, durée bornée, cible valide', async () => {
    const base = { requestId: null, decision: 'grant' as const, scope: 'month' as const, target: '2026-11', zoneId: CVR_ZONE, reason: 'Motif', expiresOn: '2026-11-06' };
    const admin = ctxOf('agency_admin');
    expect((await repo.decideReopening(admin, { ...base, reason: '  ' })).status).toBe('refused');
    expect((await repo.decideReopening(admin, { ...base, expiresOn: '2026-10-01' })).status).toBe('refused');
    expect((await repo.decideReopening(admin, { ...base, expiresOn: '2027-06-01' })).status).toBe('refused');
    expect((await repo.decideReopening(admin, { ...base, target: '2026-S99', scope: 'week' })).status).toBe('refused');
    expect((await repo.decideReopening(admin, base)).status).toBe('ok');
  });

  it('réouverture d\'une semaine clôturée (W12) : la règle se tait pour la zone rouverte', async () => {
    const closed = { periods: [period(1, '2026-10-05', '2026-10-11')] };
    const before = await repo.saveNeed(ctxOf('rs'), await need(closed), { confirm: true });
    expect(before.status === 'refused' && before.findings.some((f) => f.rule === 'W12')).toBe(true);
    await repo.decideReopening(ctxOf('agency_admin'), { requestId: null, decision: 'grant', scope: 'week', target: '2026-S41', zoneId: CVR_ZONE, reason: 'Correction', expiresOn: '2026-10-30' });
    await repo.decideReopening(ctxOf('agency_admin'), { requestId: null, decision: 'grant', scope: 'month', target: '2026-10', zoneId: CVR_ZONE, reason: 'Correction', expiresOn: '2026-10-30' });
    const after = await repo.saveNeed(ctxOf('rs'), await need(closed), { confirm: true });
    expect(after.status === 'refused' ? after.findings.map((f) => f.rule) : []).not.toContain('W12');
  });
});

describe('paramètres par dispositif (F-30.10, F-30.11)', () => {
  it('modifiables par l\'agence administration seule, avec historique', async () => {
    for (const id of PROFILE_IDS.filter((p) => p !== 'agency_admin')) {
      expect(await repo.updateDispositifParam(ctxOf(id), 'second_placement', 'min_minutes', 30), id).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect(await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'min_minutes', 30)).toEqual({ status: 'ok' });
    expect(await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'min_minutes', 30)).toEqual({ status: 'refused', reason: 'unchanged' });
    expect(await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'min_minutes', -5)).toEqual({ status: 'refused', reason: 'invalid' });
    const [h] = await repo.getParamHistory(ctxOf('agency_admin'));
    expect(h).toMatchObject({ dispositif: 'second_placement', key: 'min_minutes', old_value: 45, new_value: 30, actor_profile: 'agency_admin', changed_on: '2026-10-23' });
    expect((await repo.getEvents(ctxOf('agency_operator'))).find((e) => e.code === 'EV-38')?.audience).toBe('agency');
  });

  it('les paramètres complets et l\'historique sont réservés aux profils qui ont l\'entrée Paramètres', async () => {
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs', 'agency_operator'] as ProfileId[]) {
      expect(await repo.getDispositifParams(ctxOf(id)), id).toEqual([]);
      expect(await repo.getParamHistory(ctxOf(id)), id).toEqual([]);
    }
    expect((await repo.getDispositifParams(ctxOf('provider_admin'))).length).toBe(4);
  });

  it('le forfait kilométrique n\'est pas communiqué côté cliente (D08 ouvert)', async () => {
    const client = (await repo.getDeadlineContext(ctxOf('rs'))).params.find((p) => p.dispositif === 'second_placement')!;
    expect(client.km_flat_rate).toEqual({ applicable: false, amount_eur_ht: null });
    const agency = (await repo.getDeadlineContext(ctxOf('agency_admin'))).params.find((p) => p.dispositif === 'second_placement')!;
    expect(agency.km_flat_rate.amount_eur_ht).not.toBeNull();
  });

  it('P1 par le Repository : le paramètre modifié change le comportement, aucune valeur en dur', async () => {
    const slot = { dispositif: 'second_placement' as const, campaign_code: 'CMP-DEMO-04', hours_slot: '09:00-09:30' };
    const refused = await repo.saveNeed(ctxOf('rs'), await need(slot));
    expect(refused.status === 'refused' && refused.findings.some((f) => f.rule === 'P1')).toBe(true);
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'min_minutes', 20);
    expect((await repo.saveNeed(ctxOf('rs'), await need(slot))).status).toBe('saved');
  });

  it('P6 par le Repository : rôle absent de entry_roles', async () => {
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'entry_roles', ['agency_admin']);
    const slot = { dispositif: 'second_placement' as const, campaign_code: 'CMP-DEMO-04' };
    const r = await repo.saveNeed(ctxOf('rs'), await need(slot));
    expect(r.status === 'refused' && r.findings.some((f) => f.rule === 'P6')).toBe(true);
    expect((await repo.saveNeed(ctxOf('agency_admin'), await need(slot))).status).toBe('saved');
  });

  it('P5 : forfait absent, non bloquante, la ligne reste non chiffrée', async () => {
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'km_flat_rate', { applicable: true, amount_eur_ht: null });
    const r = await repo.saveNeed(ctxOf('rs'), await need({ dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04' }));
    expect(r.status).toBe('saved');
    expect(r.status === 'saved' && r.findings.find((f) => f.rule === 'P5')?.gravity).toBe('info');
  });

  it('P2 au paramétrage : une campagne ne se rattache pas à un second dispositif', async () => {
    expect(await repo.assignCampaignDispositif(ctxOf('agency_admin'), 'CMP-DEMO-04', 'hourly_merch')).toEqual({ status: 'refused', reason: 'p2' });
    expect((await repo.getCampaignDispositifs(ctxOf('agency_admin')))['CMP-DEMO-04']).toEqual(['second_placement']);
    expect(await repo.assignCampaignDispositif(ctxOf('agency_admin'), 'CMP-DEMO-04', 'second_placement')).toEqual({ status: 'ok' });
    expect(await repo.assignCampaignDispositif(ctxOf('rs'), 'CMP-DEMO-04', 'second_placement')).toEqual({ status: 'refused', reason: 'forbidden' });
  });

  it('D145 : l\'horizon et les jours proposés du dispositif pilotent W11 et J3', async () => {
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'permanent', 'days_allowed', [1, 2, 3, 4, 5, 6, 7]);
    const sunday = await repo.saveNeed(ctxOf('rs'), await need({ days: [7] }), { confirm: true });
    expect(sunday.status === 'refused' ? sunday.findings.map((f) => f.rule) : []).not.toContain('J3');
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'permanent', 'horizon_weeks', 2);
    const far = await repo.saveNeed(ctxOf('rs'), await need({ periods: [period(1, '2027-04-05', '2027-04-11')] }), { confirm: true });
    expect(far.status === 'saved' ? far.findings.map((f) => f.rule) : []).toContain('W11');
  });
});

describe('calendrier d\'échéances (D80)', () => {
  it('paramétré par l\'agence administration seule, date fixe sur un jour ouvré avant le mois cible', async () => {
    const entry = { month: '2026-12', type: 'needs_entry' as const, mode: 'fixed' as const, fixedDate: '2026-11-24' };
    for (const id of PROFILE_IDS.filter((p) => p !== 'agency_admin')) {
      expect(await repo.updateDeadlineEntry(ctxOf(id), entry), id).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect(await repo.updateDeadlineEntry(ctxOf('agency_admin'), { ...entry, fixedDate: '2026-11-21' })).toEqual({ status: 'refused', reason: 'invalid' }); // samedi
    expect(await repo.updateDeadlineEntry(ctxOf('agency_admin'), { ...entry, fixedDate: '2026-11-11' })).toEqual({ status: 'refused', reason: 'invalid' }); // férié
    expect(await repo.updateDeadlineEntry(ctxOf('agency_admin'), { ...entry, fixedDate: '2026-12-02' })).toEqual({ status: 'refused', reason: 'invalid' }); // après le début du mois
    expect(await repo.updateDeadlineEntry(ctxOf('agency_admin'), entry)).toEqual({ status: 'ok' });
    const ctx = await repo.getDeadlineContext(ctxOf('rs'));
    expect(ctx.settings.entries.find((e) => e.month === '2026-12' && e.type === 'needs_entry')).toMatchObject({ fixed_date: '2026-11-24', author_profile: 'agency_admin' });
    expect(await repo.updateDeadlineEntry(ctxOf('agency_admin'), { ...entry, mode: 'default' })).toEqual({ status: 'ok' });
  });
});

describe('alertes d\'échéance et audience (D79, D81, D108)', () => {
  it('aucune alerte d\'audience agence dans un profil cliente, CVR, DR ou RS', async () => {
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs'] as ProfileId[]) {
      const alerts = await repo.getDeadlineAlerts(ctxOf(id));
      expect(alerts.length, id).toBeGreaterThan(0);
      expect(alerts.filter((a) => a.audience === 'agency'), id).toEqual([]);
    }
    const agency = await repo.getDeadlineAlerts(ctxOf('agency_admin'));
    expect(agency.some((a) => a.audience === 'agency' && a.message_key === 'reopenQueue')).toBe(true);
  });

  it('J-5 au 23/10 pour les changements de novembre (date fixe du 30/10), puis J-2 quand l\'agence avance la date', async () => {
    const day5 = await repo.getDeadlineAlerts(ctxOf('rs'));
    expect(day5.find((a) => a.id === 'reminder:2026-11:change_request:all')).toMatchObject({ message_key: 'reminderChange', params: { stage: 5, left: 5, deadline: '2026-10-30' } });
    await repo.updateDeadlineEntry(ctxOf('agency_admin'), { month: '2026-11', type: 'change_request', mode: 'fixed', fixedDate: '2026-10-27' });
    const day2 = await repo.getDeadlineAlerts(ctxOf('rs'));
    expect(day2.find((a) => a.id === 'reminder:2026-11:change_request:all')).toMatchObject({ severity: 'attention', params: { stage: 2, left: 2 } });
  });

  it('les alertes sont filtrées par périmètre : un RS ne compte que son secteur', async () => {
    const rs = (await repo.getDelaySummary(ctxOf('rs')))[0]!;
    expect(rs.total).toBe(1);
    const all = (await repo.getDelaySummary(ctxOf('agency_operator')))[0]!;
    expect(all.total).toBe(12);
    expect(all.counts.up_to_date + all.counts.to_follow + all.counts.late).toBe(12);
  });

  it('résumé des retards : novembre est clos, les secteurs sans besoin de novembre sont en retard', async () => {
    const [nov, dec] = await repo.getDelaySummary(ctxOf('agency_operator'));
    expect(nov?.month).toBe('2026-11');
    expect(nov?.status.state).toBe('closed');
    expect(nov?.counts.late).toBeGreaterThan(0);
    expect(dec?.status.state).toBe('upcoming');
    expect(dec?.counts.late).toBe(0);
  });
});

describe('file de courriels préparés, sans envoi (D86, D94)', () => {
  it('visible de l\'agence, décidée par l\'administration, jamais côté cliente', async () => {
    const items = await repo.getOutbox(ctxOf('agency_admin'));
    expect(items.some((i) => i.kind === 'monday_summary' && i.planned_on === '2026-10-26')).toBe(true);
    expect(items.every((i) => i.status === 'pending')).toBe(true);
    for (const id of ['direction_client', 'dr_client', 'cvr_client', 'rs'] as ProfileId[]) expect(await repo.getOutbox(ctxOf(id)), id).toEqual([]);
    expect(await repo.decideOutbox(ctxOf('agency_operator'), items[0]!.id, 'validated')).toEqual({ status: 'refused', reason: 'forbidden' });
    expect(await repo.decideOutbox(ctxOf('agency_admin'), 'inconnu', 'validated')).toEqual({ status: 'refused', reason: 'not_found' });
    expect(await repo.decideOutbox(ctxOf('agency_admin'), items[0]!.id, 'validated')).toEqual({ status: 'ok' });
    expect((await repo.getOutbox(ctxOf('agency_admin')))[0]?.status).toBe('validated');
  });
});

describe('saisie en lot (F-20.2)', () => {
  async function row(over: Partial<BatchRow> = {}): Promise<BatchRow> {
    return {
      ...emptyBatchRow(OWN), dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', position_label: 'Poste 4', weekly_hours: '14', priority: '2',
      periods: [{ start_date: '2027-03-01', end_date: '2027-03-07', start_week: '2027-S09', end_week: '2027-S09' }],
      days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: await storeCodes(OWN), ...over,
    };
  }
  const period2 = (a: string, b: string, aw: string) => [{ start_date: a, end_date: b, start_week: aw, end_week: aw }];

  it('un lot partiellement invalide ne crée que les lignes valides et liste les rejets', async () => {
    const before = (await repo.getNeeds(ctxOf('rs'))).length;
    const rows = [
      await row(), // valide
      await row({ dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04', hours_slot: '09:00-09:30', periods: period2('2027-04-05', '2027-04-11', '2027-S14') }), // P1
      await row({ periods: period2('2026-11-09', '2026-11-15', '2026-S46') }), // E1
      await row({ weekly_hours: '' }), // incomplète
      emptyBatchRow(OWN), // vide
      await row({ position_label: 'Poste 5', periods: period2('2027-05-03', '2027-05-09', '2027-S18') }), // valide
    ];
    const result = await repo.saveNeedsBatch(ctxOf('rs'), rows);
    expect(result.saved).toBe(2);
    expect(result.rejected).toBe(3);
    expect(result.ignored).toBe(1);
    expect(result.lines.map((l) => l.status)).toEqual(['saved', 'rejected', 'rejected', 'rejected', 'ignored', 'saved']);
    expect(result.lines[1]!.findings.map((f) => f.rule)).toContain('P1');
    expect(result.lines[2]!.findings.map((f) => f.rule)).toContain('E1');
    expect(result.lines[3]).toMatchObject({ reason: 'incomplete', missing: ['weekly_hours'] });
    expect((await repo.getNeeds(ctxOf('rs'))).length).toBe(before + 2); // aucune ligne perdue en silence, aucune ligne invalide créée
  });

  it('un doublon à l\'intérieur du lot est rejeté (D1), la première ligne reste', async () => {
    const r = await repo.saveNeedsBatch(ctxOf('rs'), [await row(), await row()]);
    expect(r.lines.map((l) => l.status)).toEqual(['saved', 'rejected']);
    expect(r.lines[1]!.findings.map((f) => f.rule)).toContain('D1');
  });

  it('une alerte demande une confirmation par ligne, rien n\'est écrit avant', async () => {
    const sunday = await row({ periods: [{ start_date: '2027-03-14', end_date: '2027-03-20', start_week: '2027-S10', end_week: '2027-S11' }] }); // W16 : début un dimanche
    const first = await repo.saveNeedsBatch(ctxOf('rs'), [sunday]);
    expect(first.lines[0]?.status).toBe('needs_confirmation');
    const before = (await repo.getNeeds(ctxOf('rs'))).length;
    expect(before).toBe((await repo.getNeeds(ctxOf('rs'))).length);
    const second = await repo.saveNeedsBatch(ctxOf('rs'), [sunday], { confirm: [0] });
    expect(second.lines[0]?.status).toBe('saved');
  });

  it('report par ligne sur le mois suivant', async () => {
    const r = await repo.saveNeedsBatch(ctxOf('rs'), [await row({ periods: period2('2026-11-09', '2026-11-15', '2026-S46') })], { defer: [0], confirm: [0] });
    expect(r.lines[0]?.status).toBe('saved');
    expect((await repo.getNeeds(ctxOf('rs'))).find((n) => n.id === r.lines[0]?.needId)?.deferred_from_month).toBe('2026-11');
  });

  it('une ligne collée avec une valeur inconnue est rejetée avec son explication, jamais écartée en silence', async () => {
    const r = await repo.saveNeedsBatch(ctxOf('rs'), [await row({ paste_issues: [{ column: 'days', raw: 'XYZ', kind: 'unknown_day' }] })]);
    expect(r.lines[0]).toMatchObject({ status: 'rejected', reason: 'paste', issues: [{ column: 'days', raw: 'XYZ' }] });
  });

  it('dates collées ambiguës (W14) ou illisibles (W15) : ligne rejetée avec la règle', async () => {
    const ambiguous = await row({ periods: [{ start_date: null, end_date: null, start_week: null, end_week: null }], raw: { 1: { start_date: '04/01/2027', end_date: '10/01/2027' } } });
    const r = await repo.saveNeedsBatch(ctxOf('rs'), [ambiguous]);
    expect(r.lines[0]?.status).toBe('rejected');
    expect(r.lines[0]!.findings.map((f) => f.rule)).toContain('W14');
  });

  it('un RS ne saisit pas hors de son secteur, un profil en lecture ne saisit pas', async () => {
    const other = zones.filter((z) => z.kind === 'rs').find((z) => z.id !== OWN)!.id;
    const r = await repo.saveNeedsBatch(ctxOf('rs'), [await row({ sector_id: other, store_codes: [] })]);
    expect(r.lines[0]).toMatchObject({ status: 'rejected', reason: 'out_of_scope' });
    const ro = await repo.saveNeedsBatch(ctxOf('cvr_client'), [await row()]);
    expect(ro.lines[0]).toMatchObject({ status: 'rejected', reason: 'forbidden' });
  });

  it('brouillon automatique : conservé par profil, effacé après enregistrement', async () => {
    expect(await repo.getBatchDraft(ctxOf('rs'))).toBeNull();
    expect(await repo.saveBatchDraft(ctxOf('rs'), [await row()])).toEqual({ status: 'ok' });
    expect((await repo.getBatchDraft(ctxOf('rs')))?.rows).toHaveLength(1);
    expect(await repo.getBatchDraft(ctxOf('agency_operator'))).toBeNull();
    expect(await repo.saveBatchDraft(ctxOf('cvr_client'), [await row()])).toEqual({ status: 'refused', reason: 'forbidden' });
    await repo.clearBatchDraft(ctxOf('rs'));
    expect(await repo.getBatchDraft(ctxOf('rs'))).toBeNull();
  });

  it('brouillon automatique : rattaché au compte, jamais partagé entre deux comptes du même profil (A1f, hypothèse 8)', async () => {
    const a = buildAccessContext(profiles.find((p) => p.id === 'rs')!, 'fr', { accountId: 'compte-a' });
    const b = buildAccessContext(profiles.find((p) => p.id === 'rs')!, 'fr', { accountId: 'compte-b' });
    expect(await repo.saveBatchDraft(a, [await row()])).toEqual({ status: 'ok' });
    expect((await repo.getBatchDraft(a))?.rows).toHaveLength(1);
    expect(await repo.getBatchDraft(b)).toBeNull();
    await repo.clearBatchDraft(b);
    expect((await repo.getBatchDraft(a))?.rows).toHaveLength(1);
    await repo.clearBatchDraft(a);
    expect(await repo.getBatchDraft(a)).toBeNull();
  });
});

describe('journal : audience obligatoire sur tous les nouveaux événements', () => {
  it('EV-04, EV-32, EV-33 et EV-38 portent une audience, l\'agence seule lit EV-04 et EV-38', async () => {
    await repo.saveNeed(ctxOf('rs'), await need({ periods: NOVEMBER }));
    await repo.requestReopening(ctxOf('cvr_client'), { scope: 'month', target: '2026-10', motive: 'Motif', desiredUntil: '2026-11-06' });
    await repo.updateDispositifParam(ctxOf('agency_admin'), 'second_placement', 'min_minutes', 50);
    const all = await repo.getEvents(ctxOf('agency_admin'));
    for (const e of all) expect(['agency', 'client', 'both']).toContain(e.audience);
    const client = await repo.getEvents(ctxOf('cvr_client'));
    expect(client.some((e) => e.code === 'EV-04' || e.code === 'EV-38')).toBe(false);
    expect(client.some((e) => e.code === 'EV-32')).toBe(true);
  });
});
