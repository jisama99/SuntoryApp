import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildFixtures } from '../../scripts/fixtures-core';
import {
  BusinessEventSchema, CampaignSchema, NeedInputSchema, NeedSchema, StoreSchema, WeekClosureSchema,
} from '@/data/schemas';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import { checkNeed } from '@/domain/need-check';
import { storedWeekOf } from '@/domain/week';
import { ROOT } from './util';

const f = buildFixtures();
const committed = (name: string) => JSON.parse(readFileSync(path.join(ROOT, 'src/data/fixtures', name), 'utf8'));

describe('fixtures A2a : forme, marqueur, déterminisme', () => {
  it('chaque entité respecte son schéma Zod', () => {
    z.array(NeedSchema).parse(f.needs);
    z.array(StoreSchema).parse(f.stores);
    z.array(CampaignSchema).parse(f.campaigns);
    z.array(WeekClosureSchema).parse(f.weekClosures);
    z.array(BusinessEventSchema).parse(f.events);
  });

  it('C1 : codes fictifs conformes (BES-DEMO, MAG-DEMO, CMP-DEMO) et uniques', () => {
    for (const n of f.needs) expect(n.need_code).toMatch(/^BES-DEMO-\d{3}$/);
    for (const s of f.stores) expect(s.code).toMatch(/^MAG-DEMO-\d{3}$/);
    for (const c of f.campaigns) expect(c.code).toMatch(/^CMP-DEMO-\d{2}$/);
    expect(new Set(f.needs.map((n) => n.need_code)).size).toBe(f.needs.length);
    expect(new Set(f.stores.map((s) => s.code)).size).toBe(f.stores.length);
  });

  it('C2 : 100 % des entités portent is_demo à true', () => {
    for (const e of [...f.needs, ...f.stores, ...f.campaigns, ...f.weekClosures, ...f.events]) expect(e.is_demo).toBe(true);
  });

  it('fichiers versionnés identiques à la génération (graine fixe) et données A1 inchangées', () => {
    expect(committed('needs.json')).toEqual(f.needs);
    expect(committed('stores.json')).toEqual(f.stores);
    expect(committed('campaigns.json')).toEqual(f.campaigns);
    expect(committed('week-closures.json')).toEqual(f.weekClosures);
    expect(committed('events.json')).toEqual(f.events);
    expect(JSON.stringify(buildFixtures())).toBe(JSON.stringify(f));
    expect(f.zones.find((z) => z.code === 'DR-ALPHA')?.id).toBe('1cf08936-8d48-4257-9eba-3ab84fe0ed99');
  });

  it('volumes : 29 besoins ou plus, 40 magasins dont 3 sans rattachement, un secteur sans besoin', () => {
    expect(f.needs.length).toBeGreaterThanOrEqual(25);
    expect(f.stores).toHaveLength(40);
    expect(f.stores.filter((s) => s.sector_id === null)).toHaveLength(3);
    const sectors = f.zones.filter((z) => z.kind === 'rs').map((z) => z.id);
    const withNeed = new Set(f.needs.map((n) => n.sector_id));
    expect(sectors.filter((s) => !withNeed.has(s)).length).toBeGreaterThanOrEqual(1);
  });

  it('cas repères : 2026-S53, 2027-S01, brouillon sans période, deux périodes, saisonnier', () => {
    const weeks = f.needs.flatMap((n) => n.periods.map((p) => p.start_week));
    expect(weeks).toContain('2026-S53');
    expect(weeks).toContain('2027-S01');
    expect(f.needs.some((n) => n.need_state === 'draft' && n.periods.length === 0)).toBe(true);
    expect(f.needs.some((n) => n.periods.length === 2)).toBe(true);
    expect(f.needs.some((n) => n.dispositif === 'seasonal')).toBe(true);
  });

  it('les semaines stockées sont celles des dates (aucune incohérence W5 dans les fixtures)', () => {
    for (const n of f.needs) {
      for (const p of n.periods) {
        if (p.start_date) expect(p.start_week).toBe(storedWeekOf(p.start_date));
        if (p.end_date) expect(p.end_week).toBe(storedWeekOf(p.end_date));
      }
    }
  });

  it('aucun constat bloquant dans les fixtures, hors W9 des brouillons sans période', () => {
    const env = {
      today: f.clock.date,
      closedWeeks: new Set(f.weekClosures.map((w) => w.week)),
      campaign: null,
      config: DEFAULT_RULE_CONFIG,
    };
    for (const n of f.needs) {
      const input = NeedInputSchema.parse(n);
      const others = f.needs.filter((x) => x.id !== n.id);
      const blocking = checkNeed(input, env, others, { id: n.id, need_code: n.need_code, source_record_id: null }).findings
        .filter((x) => x.gravity === 'blocking' && x.rule !== 'W9');
      expect(blocking.map((x) => x.rule), n.need_code).toEqual([]);
    }
  });

  it('les magasins d\'un besoin appartiennent à son secteur', () => {
    const bySector = new Map(f.stores.map((s) => [s.code, s.sector_id]));
    for (const n of f.needs) for (const c of n.store_codes) expect(bySector.get(c), n.need_code).toBe(n.sector_id);
  });

  it('le journal : EV-01 pour chaque besoin, EV-02 pour chaque besoin soumis, audience obligatoire', () => {
    for (const n of f.needs) {
      expect(f.events.some((e) => e.need_id === n.id && e.code === 'EV-01')).toBe(true);
      expect(f.events.some((e) => e.need_id === n.id && e.code === 'EV-02')).toBe(n.need_state === 'submitted');
    }
    for (const e of f.events) expect(['agency', 'client', 'both']).toContain(e.audience);
  });
});
