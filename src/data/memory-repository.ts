import { z } from 'zod';
import { alertVisible, lineage, zoneInScope } from '@/domain/access';
import type { AccessContext } from '@/domain/access';
import { MENU_BY_PROFILE, MENU_HREF } from '@/domain/menu';
import type { Severity } from '@/domain/types';
import alertsJson from './fixtures/alerts.json';
import clockJson from './fixtures/clock.json';
import profilesJson from './fixtures/profiles.json';
import zonesJson from './fixtures/zones.json';
import type { DemoProfileDirectory, Repository } from './repository';
import { AlertSchema, DemoClockSchema, ProfileSchema, ZoneSchema } from './schemas';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const alerts = z.array(AlertSchema).parse(alertsJson);
const clock = DemoClockSchema.parse(clockJson);

const SEVERITY_RANK: Record<Severity, number> = { risk: 0, attention: 1, info: 2 };

export function createMemoryRepository(): Repository {
  return {
    async getMenu(ctx) {
      return MENU_BY_PROFILE[ctx.profileId].map((key) => ({ key, href: MENU_HREF[key] }));
    },

    async getScopeZones(ctx) {
      if (ctx.scope.kind === 'all') return zones;
      const scope = ctx.scope;
      const inside = zones.filter((z) => zoneInScope(zones, z.id, scope));
      const ids = new Set(inside.map((z) => z.id));
      for (const z of inside) for (const a of lineage(zones, z.id)) ids.add(a.id);
      return zones.filter((z) => ids.has(z.id));
    },

    async getZone(ctx, zoneId) {
      const visible = await this.getScopeZones(ctx);
      return visible.find((z) => z.id === zoneId) ?? null;
    },

    async getAlerts(ctx) {
      return alerts
        .filter((a) => alertVisible(zones, ctx, a))
        .sort(
          (a, b) =>
            SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
            b.created_at.localeCompare(a.created_at),
        );
    },

    async getClock() {
      return clock;
    },
  };
}

export function createDemoProfileDirectory(): DemoProfileDirectory {
  return {
    async list() {
      return profiles;
    },
    async get(id) {
      return profiles.find((p) => p.id === id) ?? null;
    },
  };
}

export type { AccessContext };
