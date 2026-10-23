import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildFixtures } from '../../scripts/fixtures-core';
import { AlertSchema, DemoClockSchema, ProfileSchema, ZoneSchema } from '@/data/schemas';
import { ROOT } from './util';

const f = buildFixtures();
const committed = (name: string) =>
  JSON.parse(readFileSync(path.join(ROOT, 'src/data/fixtures', name), 'utf8'));

describe('fixtures A1 : forme, marqueur, déterminisme', () => {
  it('C1 : les codes respectent les motifs fictifs de docs/FIXTURES.md §3', () => {
    for (const z of f.zones) {
      if (z.kind === 'dr') expect(z.code).toMatch(/^DR-(ALPHA|BETA|GAMMA)$/);
      if (z.kind === 'cvr') expect(z.code).toMatch(/^CVR-[A-Z]{2}\d{2}$/);
      if (z.kind === 'rs') expect(z.code).toMatch(/^RS-[BCDFGHJKLMNPQRSTVWXZ0-9]{4}$/);
    }
    expect(new Set(f.zones.map((z) => z.code)).size).toBe(f.zones.length);
  });

  it('C2 : 100 % des entités portent is_demo à true', () => {
    for (const e of [...f.zones, ...f.profiles, ...f.alerts, f.clock]) expect(e.is_demo).toBe(true);
  });

  it('volumes : 3 DR, 6 CVR, 12 RS, 7 profils, un DR avec 3 CVR', () => {
    expect(f.zones.filter((z) => z.kind === 'dr')).toHaveLength(3);
    expect(f.zones.filter((z) => z.kind === 'cvr')).toHaveLength(6);
    expect(f.zones.filter((z) => z.kind === 'rs')).toHaveLength(12);
    expect(f.profiles).toHaveLength(7);
    const dr = f.zones.filter((z) => z.kind === 'dr').map((d) => f.zones.filter((z) => z.parent_id === d.id).length);
    expect(Math.max(...dr)).toBe(3);
  });

  it('chaque entité respecte son schéma Zod', () => {
    z.array(ZoneSchema).parse(f.zones);
    z.array(ProfileSchema).parse(f.profiles);
    z.array(AlertSchema).parse(f.alerts);
    DemoClockSchema.parse(f.clock);
  });

  it('les alertes couvrent les trois audiences, et une alerte sans audience est rejetée', () => {
    expect(new Set(f.alerts.map((a) => a.audience))).toEqual(new Set(['agency', 'client', 'both']));
    const withoutAudience: Record<string, unknown> = { ...f.alerts[0]! };
    delete withoutAudience.audience;
    expect(AlertSchema.safeParse(withoutAudience).success).toBe(false);
    expect(AlertSchema.safeParse({ ...f.alerts[0]!, audience: 'tous' }).success).toBe(false);
  });

  it('déterminisme : deux générations identiques, et fichiers versionnés à jour', () => {
    expect(JSON.stringify(buildFixtures())).toBe(JSON.stringify(f));
    expect(committed('zones.json')).toEqual(f.zones);
    expect(committed('profiles.json')).toEqual(f.profiles);
    expect(committed('alerts.json')).toEqual(f.alerts);
    expect(committed('clock.json')).toEqual(f.clock);
  });

  it('chaque profil rattaché à une zone porte le prénom du responsable fictif de cette zone', () => {
    const byId = new Map(f.zones.map((zn) => [zn.id, zn]));
    for (const p of f.profiles) {
      if (p.scope.kind === 'all') continue;
      const zone = byId.get(p.scope.ids[0]!)!;
      expect(zone.responsible_name.startsWith(`${p.first_name} `)).toBe(true);
    }
  });

  it('un profil sans prénom existe pour exercer le repli de salutation (D84)', () => {
    expect(f.profiles.some((p) => p.first_name === null)).toBe(true);
  });
});
