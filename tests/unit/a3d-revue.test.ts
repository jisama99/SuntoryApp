import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import type { BatchRow } from '@/data/schemas';
import { ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { emptyBatchRow } from '@/domain/batch';
import type { ProfileId } from '@/domain/types';
import { period } from './needs-util';

/**
 * Compléments de la revue A3d : saisie en lot par les nouveaux profils, et scénario S4 de `docs/CHARGE_ET_DISPONIBILITE.md` §5 sur la
 * logique (doublons et conflits simultanés). Étape A : fixtures et un seul processus, donc la capacité de la base n'est pas mesurée.
 */
const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const ctxOf = (id: ProfileId) => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr');
const cvrZone = zones.find((z) => z.code === 'CVR-ZV01')!.id;
const sectors = zones.filter((z) => z.kind === 'rs' && z.parent_id === cvrZone).map((z) => z.id);
const OTHER = zones.find((z) => z.kind === 'rs' && z.parent_id !== cvrZone)!.id;

beforeEach(() => resetDemoState());

const stores = async (sector: string) => (await repo.getStores(ctxOf('agency_operator'))).filter((s) => s.sector_id === sector).slice(0, 1).map((s) => s.code);
async function row(sector: string, start: string, end: string, over: Partial<BatchRow> = {}): Promise<BatchRow> {
  return {
    ...emptyBatchRow(sector), dispositif: 'permanent', campaign_code: 'CMP-DEMO-01', position_label: 'Poste 4', weekly_hours: '14', priority: '2',
    periods: [{ start_date: start, end_date: end, start_week: null, end_week: null }], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: await stores(sector), ...over,
  };
}
async function input(sector: string, start: string, end: string) {
  return {
    dispositif: 'permanent' as const, campaign_code: 'CMP-DEMO-01', sector_id: sector, position_label: 'Poste 4', weekly_hours: 14, priority: 2 as const,
    periods: [period(1, start, end)], days: [1, 2, 3], hours_slot: '08:00-12:00', store_codes: await stores(sector), client_comment: null,
  };
}

describe('saisie en lot par le CVR : le secteur reste contrôlé ligne par ligne', () => {
  it('les lignes de son périmètre sont créées, celle d\'un autre CVR est rejetée, avec l\'avis donné à la saisie', async () => {
    const r = await repo.saveNeedsBatch(ctxOf('cvr_client'), [
      await row(sectors[0]!, '2027-03-01', '2027-03-07'),
      await row(OTHER, '2027-03-01', '2027-03-07'),
      await row(sectors[1]!, '2027-03-08', '2027-03-14'),
    ]);
    expect(r.lines.map((l) => l.status === 'saved' ? 'saved' : `${l.status}:${l.reason}`)).toEqual(['saved', 'rejected:out_of_scope', 'saved']);
    for (const l of r.lines.filter((x) => x.status === 'saved')) {
      const pr = (await repo.getPipeline(ctxOf('agency_admin'))).find((p) => p.need.id === l.needId)!;
      expect(pr.validation.state).toBe('validated');
      expect(pr.validation.log[0]).toMatchObject({ at_entry: true, level: 'cvr', by_profile: 'cvr_client' });
      expect(pr.need.on_behalf).toBe(false);
    }
  });
});

describe('S4 concurrence (logique) : doublons et modifications simultanés', () => {
  it('deux saisies identiques simultanées, par deux profils : une seule est créée, aucun doublon', async () => {
    const before = (await repo.getNeeds(ctxOf('agency_admin'))).length;
    const [a, b] = await Promise.all([
      repo.saveNeed(ctxOf('rs'), await input(sectors[0]!, '2027-05-03', '2027-05-09')),
      repo.saveNeed(ctxOf('cvr_client'), await input(sectors[0]!, '2027-05-03', '2027-05-09')),
    ]);
    expect([a.status, b.status].filter((s) => s === 'saved')).toHaveLength(1);
    expect((await repo.getNeeds(ctxOf('agency_admin'))).length).toBe(before + 1);
  });

  it('trente saisies identiques simultanées : exactement une créée', async () => {
    const before = (await repo.getNeeds(ctxOf('agency_admin'))).length;
    const inp = await input(sectors[0]!, '2027-06-07', '2027-06-13');
    const results = await Promise.all(Array.from({ length: 30 }, (_, i) => repo.saveNeed(ctxOf(i % 2 ? 'rs' : 'cvr_client'), inp)));
    expect(results.filter((r) => r.status === 'saved')).toHaveLength(1);
    expect((await repo.getNeeds(ctxOf('agency_admin'))).length).toBe(before + 1);
  });

  it('deux modifications simultanées du même besoin (fusion de périodes) : aucune écriture perdue', async () => {
    const created = await repo.saveNeed(ctxOf('rs'), await input(sectors[0]!, '2027-07-05', '2027-07-11'));
    if (created.status !== 'saved') throw new Error('besoin non créé');
    const id = created.need.id;
    const merge = async (who: ProfileId, start: string, end: string) =>
      repo.saveNeed(ctxOf(who), await input(sectors[0]!, start, end), { mergeInto: id, confirm: true });
    const [x, y] = await Promise.all([merge('rs', '2027-07-12', '2027-07-18'), merge('cvr_client', '2027-07-19', '2027-07-25')]);
    expect([x.status, y.status]).toEqual(['saved', 'saved']);
    const need = (await repo.getNeeds(ctxOf('agency_admin'))).find((n) => n.id === id)!;
    expect(need.periods[0]).toMatchObject({ start_date: '2027-07-05', end_date: '2027-07-25' });
    expect(need.record_version).toBe(3);
  });
});
