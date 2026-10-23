import { describe, expect, it } from 'vitest';
import { createDemoProfileDirectory, createMemoryRepository } from '@/data/memory-repository';
import { audienceAllows, buildAccessContext } from '@/domain/access';
import { MENU_BY_PROFILE } from '@/domain/menu';
import { PROFILE_IDS } from '@/domain/types';
import type { ProfileId } from '@/domain/types';

const repo = createMemoryRepository();
const dir = createDemoProfileDirectory();
const ctxOf = async (id: ProfileId, locale: 'fr' | 'en' = 'fr') =>
  buildAccessContext((await dir.get(id))!, locale);

const CLIENT_PROFILES: ProfileId[] = ['direction_client', 'dr_client', 'cvr_client', 'rs'];

describe('alertes : audience et périmètre dans la donnée retournée (D108)', () => {
  for (const id of CLIENT_PROFILES) {
    it(`${id} : le Repository ne retourne aucune alerte « agency »`, async () => {
      const alerts = await repo.getAlerts(await ctxOf(id));
      expect(alerts.length).toBeGreaterThan(0);
      for (const a of alerts) expect(a.audience).not.toBe('agency');
    });
  }

  it('l\'agence et le prestataire reçoivent toutes les alertes', async () => {
    for (const id of ['agency_operator', 'agency_admin', 'provider_admin'] as ProfileId[]) {
      expect((await repo.getAlerts(await ctxOf(id))).length).toBe(11);
    }
  });

  it('la direction cliente voit moins d\'alertes que l\'agence', async () => {
    const dir_ = await repo.getAlerts(await ctxOf('direction_client'));
    expect(dir_.length).toBeLessThan(11);
  });

  it('les alertes hors périmètre sont absentes de la donnée (même zone « both »)', async () => {
    const rsCtx = await ctxOf('rs');
    const zones = await repo.getScopeZones(rsCtx);
    const ids = new Set(zones.map((z) => z.id));
    for (const a of await repo.getAlerts(rsCtx)) {
      if (a.zone_id) expect(ids.has(a.zone_id)).toBe(true);
    }
  });

  it('un profil CVR ne voit pas les alertes d\'un autre CVR ni celles du niveau DR', async () => {
    const ctx = await ctxOf('cvr_client');
    const all = createMemoryRepository();
    const agency = await all.getAlerts(await ctxOf('agency_operator'));
    const mine = await all.getAlerts(ctx);
    const zones = await all.getScopeZones(await ctxOf('agency_operator'));
    const kindOf = new Map(zones.map((z) => [z.id, z.kind]));
    for (const a of mine) if (a.zone_id) expect(['cvr', 'rs']).toContain(kindOf.get(a.zone_id));
    expect(mine.length).toBeLessThan(agency.length);
  });

  it('défaut refus : une audience inconnue est refusée pour tous les côtés', () => {
    for (const side of ['client', 'agency', 'provider'] as const) {
      expect(audienceAllows(side, 'tous')).toBe(false);
      expect(audienceAllows(side, undefined)).toBe(false);
      expect(audienceAllows(side, '')).toBe(false);
    }
  });
});

describe('périmètre et zones', () => {
  it('un RS ne reçoit que sa chaîne (RS, CVR parent, DR parent), pas les autres zones', async () => {
    const zones = await repo.getScopeZones(await ctxOf('rs'));
    expect(zones.map((z) => z.kind).sort()).toEqual(['cvr', 'dr', 'rs']);
  });

  it('getZone refuse une zone hors périmètre', async () => {
    const all = await repo.getScopeZones(await ctxOf('agency_operator'));
    const mine = new Set((await repo.getScopeZones(await ctxOf('rs'))).map((z) => z.id));
    const outside = all.find((z) => !mine.has(z.id))!;
    expect(await repo.getZone(await ctxOf('rs'), outside.id)).toBeNull();
  });

  it('un DR ne voit que ses CVR et RS', async () => {
    const zones = await repo.getScopeZones(await ctxOf('dr_client'));
    expect(zones.filter((z) => z.kind === 'dr')).toHaveLength(1);
    expect(zones.filter((z) => z.kind === 'cvr')).toHaveLength(3);
  });
});

describe('menu par profil, fourni par le Repository', () => {
  for (const id of PROFILE_IDS) {
    it(`${id} : menu conforme à la table de profils`, async () => {
      const menu = await repo.getMenu(await ctxOf(id));
      expect(menu.map((e) => e.key)).toEqual([...MENU_BY_PROFILE[id]]);
    });
  }

  it('les profils cliente n\'ont ni paramètres ni administration', async () => {
    for (const id of CLIENT_PROFILES) {
      const keys = (await repo.getMenu(await ctxOf(id))).map((e) => e.key);
      expect(keys).not.toContain('settings');
      expect(keys).not.toContain('admin');
    }
  });

  it('le CVR cliente n\'a pas d\'entrée Budget (coûts non communiqués par défaut)', async () => {
    const keys = (await repo.getMenu(await ctxOf('cvr_client'))).map((e) => e.key);
    expect(keys).not.toContain('budget');
  });

  it('seul le prestataire accède à l\'administration', async () => {
    for (const id of PROFILE_IDS) {
      const keys = (await repo.getMenu(await ctxOf(id))).map((e) => e.key);
      expect(keys.includes('admin')).toBe(id === 'provider_admin');
    }
  });
});

describe('contexte d\'accès (D107)', () => {
  it('le vocabulaire dérive du côté et la langue est conservée', async () => {
    const c = await ctxOf('rs', 'en');
    expect(c.vocabulary).toBe('client');
    expect(c.locale).toBe('en');
    expect((await ctxOf('agency_admin')).vocabulary).toBe('agency');
  });

  it('prénom nul pour le prestataire : repli sans nom inventé', async () => {
    expect((await ctxOf('provider_admin')).firstName).toBeNull();
  });
});
