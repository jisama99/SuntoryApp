import { describe, expect, it } from 'vitest';
import { emptyBatchRow, isEmptyBatchRow, rowToInput, summariseBatch } from '@/domain/batch';
import { parseDays, parsePaste } from '@/domain/batch-paste';
import type { PasteContext } from '@/domain/batch-paste';
import { buildDeadlineAlerts, buildOutbox, delaySummary, needMonth, nextMonday } from '@/domain/deadline-views';
import type { DelayMonth } from '@/domain/deadline-views';
import { listDeadlines } from '@/domain/deadlines';
import type { Zone } from '@/data/schemas';
import { params, paramsMap, SECOND, settings } from './a2b-util';
import { need, period } from './needs-util';

const SECTOR = '11111111-1111-4111-8111-111111111111';
const ctx: PasteContext = {
  sectors: [{ id: SECTOR, code: 'RS-TEST' }],
  fixedSectorId: null,
  dispositifNames: { permanent: 'permanent', seasonal: 'seasonal', saisonnier: 'seasonal', 'second placement': 'second_placement', 'merch horaire': 'hourly_merch' },
  campaignCodes: ['CMP-DEMO-01', 'CMP-DEMO-04'],
  hoursAllowed: [7, 14, 21],
};
const rs: PasteContext = { ...ctx, sectors: [], fixedSectorId: SECTOR };

describe('jours collés (D132, doc 28 §8)', () => {
  it('LUN;MAR devient des cases cochées', () => {
    expect(parseDays('LUN;MAR')).toEqual({ days: [1, 2], unknown: [] });
    expect(parseDays('Mon Tue, Fri')).toEqual({ days: [1, 2, 5], unknown: [] });
    expect(parseDays('1,3,5')).toEqual({ days: [1, 3, 5], unknown: [] });
    expect(parseDays('lundi;jeudi')).toEqual({ days: [1, 4], unknown: [] });
  });
  it('une valeur inconnue est signalée, jamais perdue', () => {
    expect(parseDays('LUN;XYZ;8')).toEqual({ days: [1], unknown: ['XYZ', '8'] });
  });
});

describe('collage depuis un tableur (F-20.2)', () => {
  const line = ['Permanent', 'CMP-DEMO-01', 'Poste 3', '2', '14', '2027-03-01', '2027-03-07', '', '', 'LUN;MAR;MER', '08:00-12:00', 'MAG-DEMO-001;MAG-DEMO-002', 'Note'].join('\t');

  it('une ligne complète est convertie dans le profil d\'un RS', () => {
    const { rows, blankLines } = parsePaste(line, rs);
    expect(blankLines).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sector_id: SECTOR, dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', position_label: 'Poste 3', priority: '2', weekly_hours: '14',
      days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: ['MAG-DEMO-001', 'MAG-DEMO-002'], client_comment: 'Note',
    });
    expect(rows[0]!.periods[0]).toMatchObject({ start_date: '2027-03-01', end_date: '2027-03-07' });
    expect(rows[0]!.paste_issues).toBeUndefined();
  });

  it('profil à plusieurs secteurs : la première colonne désigne le secteur par son code', () => {
    const { rows } = parsePaste(`RS-TEST\t${line}`, ctx);
    expect(rows[0]!.sector_id).toBe(SECTOR);
    const bad = parsePaste(`RS-INCONNU\t${line}`, ctx).rows[0]!;
    expect(bad.paste_issues).toEqual([{ column: 'sector', raw: 'RS-INCONNU', kind: 'unknown_sector' }]);
  });

  it('en-tête reconnu et ignoré, lignes vides comptées', () => {
    const text = `Dispositif\tCampagne\n${line}\n\n${line}\n`;
    const r = parsePaste(text, rs);
    expect(r.headerSkipped).toBe(true);
    expect(r.rows).toHaveLength(2);
    expect(r.blankLines).toBe(1);
  });

  it('valeurs inconnues : cellule vide et explication attachée à la ligne, rien d\'écarté en silence', () => {
    const bad = ['Mensuel', 'CMP-9', 'Poste 9', '7', '13', '2027-03-01', '2027-03-07', '', '', 'LUN;XYZ', '', '', ''].join('\t');
    const r = parsePaste(bad, rs).rows[0]!;
    expect(r.dispositif).toBe('');
    expect(r.paste_issues?.map((i) => i.kind)).toEqual(['unknown_dispositif', 'unknown_campaign', 'unknown_position', 'unknown_priority', 'unknown_hours', 'unknown_day']);
    expect(r.days).toEqual([1]);
  });

  it('dates : ISO converties, jj/mm/aaaa ambiguës ou illisibles gardées en valeur brute pour W14 et W15', () => {
    const cells = (start: string, end: string) => ['Permanent', '', '', '', '', start, end].join('\t');
    const ok = parsePaste(cells('28/12/2026', '03/01/2027'), rs).rows[0]!; // 28/12 est sans ambiguïté, 03/01 est ambigu
    expect(ok.periods[0]).toMatchObject({ start_date: '2026-12-28', end_date: null });
    expect(ok.raw?.[1]).toEqual({ end_date: '03/01/2027' });
    const junk = parsePaste(cells('bientot', 'demain'), rs).rows[0]!;
    expect(junk.periods[0]).toMatchObject({ start_date: null, end_date: null });
    expect(junk.raw?.[1]).toEqual({ start_date: 'bientot', end_date: 'demain' });
    expect(rowToInput(junk).periods).toHaveLength(1); // la période brute reste visible des règles
  });

  it('semaines collées : valeur brute conservée (W2, W5, W13), format stocké repris', () => {
    const cells = ['Permanent', '', '', '', '', '2027-01-04', '2027-01-10', '2', 'S1'].join('\t');
    const r = parsePaste(cells, rs).rows[0]!;
    expect(r.raw?.[1]).toEqual({ start_week: '2', end_week: 'S1' });
    expect(r.periods[0]!.start_week).toBeNull();
    const canonical = parsePaste(['Permanent', '', '', '', '', '', '', '2027-S01'].join('\t'), rs).rows[0]!;
    expect(canonical.periods[0]!.start_week).toBe('2027-S01');
  });

  it('séparateur point-virgule si aucune tabulation, libellés français et anglais', () => {
    const r = parsePaste('Second placement;CMP-DEMO-04;Poste 1;1;7', rs).rows[0]!;
    expect(r).toMatchObject({ dispositif: 'second_placement', campaign_code: 'CMP-DEMO-04', priority: '1', weekly_hours: '7' });
  });

  it('un commentaire trop long est tronqué avec une explication', () => {
    const cells = Array.from({ length: 12 }, () => '').concat(['x'.repeat(300)]).join('\t');
    const r = parsePaste(cells, rs).rows[0]!;
    expect(r.client_comment).toHaveLength(280);
    expect(r.paste_issues?.[0]?.kind).toBe('too_long');
  });
});

describe('résumé avant soumission', () => {
  const full = () => ({
    ...emptyBatchRow(SECTOR), dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', position_label: 'Poste 1', weekly_hours: '14', priority: '1',
    periods: [{ start_date: '2027-03-01', end_date: '2027-03-07', start_week: '2027-S09', end_week: '2027-S09' }], days: [1, 2], hours_slot: '08:00-12:00', store_codes: ['MAG-DEMO-001'],
  });
  it('compte les lignes complètes, incomplètes, vides, les heures et les dispositifs', () => {
    const rows = [full(), { ...full(), weekly_hours: '', hours_slot: '' }, emptyBatchRow(SECTOR), { ...full(), dispositif: 'seasonal', weekly_hours: '21' }];
    const s = summariseBatch(rows, SECTOR);
    expect(s).toMatchObject({ filled: 3, ignored: 1, complete: 2, weeklyHours: 35, storeCount: 2, byDispositif: { permanent: 1, seasonal: 1 } });
    expect(s.incomplete).toEqual([{ index: 1, missing: ['weekly_hours', 'hours_slot'] }]);
  });
  it('une ligne avec explication de collage est signalée', () => {
    const s = summariseBatch([{ ...full(), paste_issues: [{ column: 'days', raw: 'XYZ', kind: 'unknown_day' }] }], SECTOR);
    expect(s.withPasteIssues).toEqual([0]);
  });
  it('ligne vide : seul le secteur imposé est renseigné', () => {
    expect(isEmptyBatchRow(emptyBatchRow(SECTOR), SECTOR)).toBe(true);
    expect(isEmptyBatchRow({ ...emptyBatchRow(SECTOR), hours_slot: 'x' }, SECTOR)).toBe(false);
  });
});

// ---- Vues d'échéances ----
const zone = (id: string, kind: Zone['kind'], parent: string | null, label: string): Zone => ({
  id, kind, code: label, parent_id: parent, label_fr: label, label_en: label, responsible_name: `${label} Démo`, is_demo: true,
});
const DR = zone('d0000000-0000-4000-8000-000000000000', 'dr', null, 'DR-TEST');
const CVR = zone('c0000000-0000-4000-8000-000000000000', 'cvr', DR.id, 'CVR-TE01');
const S1 = zone('a0000000-0000-4000-8000-000000000001', 'rs', CVR.id, 'RS-AAAA');
const S2 = zone('a0000000-0000-4000-8000-000000000002', 'rs', CVR.id, 'RS-BBBB');
const ZONES = [DR, CVR, S1, S2];
const submitted = (sector: string, start: string, end = start) => need({ sector_id: sector, periods: [period(1, start, end)], id: crypto.randomUUID() });

describe('résumé des retards (D81)', () => {
  const s = settings();
  it('mois cible d\'un besoin', () => {
    expect(needMonth(submitted(S1.id, '2026-11-30', '2026-12-06'))).toBe('2026-11');
    expect(needMonth({ periods: [] })).toBeNull();
  });
  it('novembre clos : un secteur sans besoin soumis est en retard, un secteur servi est à jour', () => {
    const [nov] = delaySummary({ today: '2026-10-23', settings: s, zones: ZONES, needs: [submitted(S1.id, '2026-11-09')] });
    expect(nov!.month).toBe('2026-11');
    expect(nov!.status.state).toBe('closed');
    expect(nov!.sectors.map((x) => [x.zone.id, x.status])).toEqual([[S1.id, 'up_to_date'], [S2.id, 'late']]);
    expect(nov!.counts).toEqual({ up_to_date: 1, to_follow: 0, late: 1 });
    expect(nov!.regions).toHaveLength(1);
    expect(nov!.regions[0]!.zone.id).toBe(DR.id);
  });
  it('décembre ouvert : à suivre, jamais en retard ; un brouillon seul ne compte pas comme soumis', () => {
    const draft = { ...submitted(S1.id, '2026-12-07'), need_state: 'draft' as const };
    const dec = delaySummary({ today: '2026-10-23', settings: s, zones: ZONES, needs: [draft] })[1]!;
    expect(dec.counts).toEqual({ up_to_date: 0, to_follow: 2, late: 0 });
    expect(dec.sectors[0]!.drafts).toBe(1);
  });
});

describe('alertes dérivées (D79, D82)', () => {
  const s = settings({
    entries: [{ month: '2026-11', type: 'change_request', preset: null, fixed_date: '2026-10-30', author_profile: 'agency_admin', effective_from: '2026-10-23', is_demo: true }],
  });
  const map = paramsMap(params('second_placement', SECOND));
  const build = (today: string, pending = 0) => {
    const delays = delaySummary({ today, settings: s, zones: ZONES, needs: [submitted(S1.id, '2026-12-07')] });
    return buildDeadlineAlerts({ today, rows: listDeadlines(today, s, map), delays, deferredByMonth: { '2026-11': 2 }, pendingRequests: pending });
  };
  it('J-5, puis J-2, puis jour J pour les changements de novembre', () => {
    for (const [today, stage] of [['2026-10-23', 5], ['2026-10-28', 2], ['2026-10-30', 0]] as const) {
      const a = build(today).find((x) => x.id === 'reminder:2026-11:change_request:all')!;
      expect(a.params.stage).toBe(stage);
      expect(a.audience).toBe('client');
    }
    expect(build('2026-10-22').some((x) => x.id === 'reminder:2026-11:change_request:all')).toBe(false);
  });
  it('rappel de saisie avec le nombre de secteurs en retard, seulement quand il en reste', () => {
    const a = build('2026-11-13').find((x) => x.id === 'reminder:2026-12:needs_entry:all')!;
    expect(a.message_key).toBe('reminderEntryMissing');
    expect(a.params.missing).toBe(1); // S2 n'a rien saisi pour décembre
  });
  it('lendemain de clôture : résumé des retards pour la cliente, bilan chiffré pour l\'agence seule', () => {
    const list = build('2026-10-20');
    const late = list.find((x) => x.message_key === 'lateSummary')!;
    const report = list.find((x) => x.message_key === 'closingReport')!;
    expect(late.audience).toBe('client');
    expect(report.audience).toBe('agency');
    expect(report.params).toMatchObject({ month: '2026-11', deferred: 2 });
  });
  it('la file de demandes de réouverture est d\'audience agence', () => {
    expect(build('2026-10-23', 3).find((x) => x.message_key === 'reopenQueue')).toMatchObject({ audience: 'agency', params: { n: 3 } });
    expect(build('2026-10-23', 0).some((x) => x.message_key === 'reopenQueue')).toBe(false);
  });
  it('règle du dispositif : alerte propre au second placement', () => {
    const a = build('2026-11-18').find((x) => x.id === 'reminder:2026-12:needs_entry:second_placement');
    expect(a?.message_key).toBe('reminderEntryOwn');
    expect(a?.params.dispositif).toBe('second_placement');
  });
});

describe('file de courriels préparés (D86)', () => {
  const s = settings();
  it('un message par responsable concerné, résumé du lundi sans chiffre, aucun envoi', () => {
    const today = '2026-11-13';
    const delays: DelayMonth[] = delaySummary({ today, settings: s, zones: ZONES, needs: [submitted(S1.id, '2026-12-07')] });
    const items = buildOutbox({ today, rows: listDeadlines(today, s, {}), delays, zones: ZONES });
    const reminders = items.filter((i) => i.kind === 'reminder_day_j' && i.month === '2026-12');
    expect(reminders.map((i) => i.recipient_zone_id).sort()).toEqual([DR.id, CVR.id, S2.id].sort());
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    const monday = items.find((i) => i.kind === 'monday_summary')!;
    expect(monday).toMatchObject({ planned_on: '2026-11-16', recipient_profile: 'direction_client', sector_count: 0 });
  });
  it('prochain lundi', () => {
    expect(nextMonday('2026-10-23')).toBe('2026-10-26');
    expect(nextMonday('2026-10-26')).toBe('2026-11-02');
  });
});
