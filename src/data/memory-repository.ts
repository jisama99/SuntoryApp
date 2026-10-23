import { z } from 'zod';
import { alertVisible, audienceAllows, lineage, zoneInScope } from '@/domain/access';
import type { AccessContext } from '@/domain/access';
import { MENU_BY_PROFILE, MENU_HREF } from '@/domain/menu';
import { checkNeed, decideSave } from '@/domain/need-check';
import type { Finding } from '@/domain/rules';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import type { Audience, EventCode, ProfileId, Severity } from '@/domain/types';
import {
  addDays, daysBetween, isValidWeek, parseStoredWeek, storedWeekOf, weekEnd, weekStart,
} from '@/domain/week';
import { resolvePeriod } from '@/domain/week-rules';
import type { RuleEnv, RuleInput } from '@/domain/week-rules';
import alertsJson from './fixtures/alerts.json';
import campaignsJson from './fixtures/campaigns.json';
import clockJson from './fixtures/clock.json';
import eventsJson from './fixtures/events.json';
import needsJson from './fixtures/needs.json';
import profilesJson from './fixtures/profiles.json';
import storesJson from './fixtures/stores.json';
import weekClosuresJson from './fixtures/week-closures.json';
import zonesJson from './fixtures/zones.json';
import type { DemoProfileDirectory, Repository, ReturnedFinding, SaveOptions, SaveRefusal, SaveResult } from './repository';
import {
  AlertSchema, BusinessEventSchema, CampaignSchema, DemoClockSchema, NeedSchema, ProfileSchema, StoreSchema,
  WeekClosureSchema, ZoneSchema,
} from './schemas';
import type { BusinessEvent, Need, Period } from './schemas';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const alerts = z.array(AlertSchema).parse(alertsJson);
const clock = DemoClockSchema.parse(clockJson);
const stores = z.array(StoreSchema).parse(storesJson);
const campaigns = z.array(CampaignSchema).parse(campaignsJson);
const weekClosures = z.array(WeekClosureSchema).parse(weekClosuresJson);

/**
 * Données modifiables de la démonstration. Conservées sur globalThis : Next peut charger ce module dans plusieurs
 * groupes (pages, actions) et chacun doit voir les mêmes besoins et le même journal.
 */
interface DemoState {
  needs: Need[];
  events: BusinessEvent[];
  seq: number;
}
const globalState = globalThis as typeof globalThis & { __suntoryDemoState?: DemoState };
function state(): DemoState {
  if (!globalState.__suntoryDemoState) {
    const events = z.array(BusinessEventSchema).parse(eventsJson);
    globalState.__suntoryDemoState = {
      needs: z.array(NeedSchema).parse(needsJson),
      events,
      seq: events.reduce((m, e) => Math.max(m, e.seq), 0),
    };
  }
  return globalState.__suntoryDemoState;
}

/** Remet la démonstration dans son état initial (tests). */
export function resetDemoState(): void {
  delete globalState.__suntoryDemoState;
}

const WRITE_PROFILES: readonly ProfileId[] = ['rs', 'agency_operator', 'agency_admin'];

function emit(code: EventCode, actor: ProfileId, zoneId: string, needId: string | null, audience: Audience, data: BusinessEvent['data']) {
  const st = state();
  st.events.push({
    id: crypto.randomUUID(), code, actor_profile: actor, zone_id: zoneId, need_id: needId,
    effect_date: clock.date, recorded_at: clock.date, seq: ++st.seq, audience, data, is_demo: true,
  });
}

function nextNeedCode(): string {
  const max = state().needs.reduce((m, n) => Math.max(m, Number(n.need_code.slice(-3))), 0);
  return `BES-DEMO-${String(max + 1).padStart(3, '0')}`;
}

/** Complète les dates déduites des semaines et les semaines déduites des dates, sans écraser une valeur saisie. */
function normalisePeriods(periods: Period[]): Period[] {
  return periods.map((p) => {
    const sw = p.start_week ? parseStoredWeek(p.start_week) : null;
    const ew = p.end_week ? parseStoredWeek(p.end_week) : null;
    const start_date = p.start_date ?? (sw && isValidWeek(sw) ? weekStart(sw) : null);
    const end_date = p.end_date ?? (ew && isValidWeek(ew) ? weekEnd(ew) : sw && isValidWeek(sw) ? weekEnd(sw) : null);
    return {
      period_no: p.period_no,
      start_date,
      end_date,
      start_week: p.start_week ?? (start_date ? storedWeekOf(start_date) : null),
      end_week: p.end_week ?? (end_date ? storedWeekOf(end_date) : null),
    };
  });
}

function ruleEnv(campaignCode: string | null): RuleEnv {
  const camp = campaigns.find((c) => c.code === campaignCode);
  return {
    today: clock.date,
    closedWeeks: new Set(weekClosures.map((w) => w.week)),
    campaign: camp ? { dispositif: camp.dispositif, window_start: camp.window_start, window_end: camp.window_end } : null,
    config: DEFAULT_RULE_CONFIG,
  };
}

/** Le besoin lié n'est cité que s'il est dans le périmètre ; sinon aucun identifiant ni code ne sort de la couche données. */
function presentFindings(ctx: AccessContext, findings: Finding[]): ReturnedFinding[] {
  return findings.map((f) => {
    if (!f.relatedNeedId) return f;
    const related = state().needs.find((n) => n.id === f.relatedNeedId);
    if (related && zoneInScope(zones, related.sector_id, ctx.scope)) return { ...f, relatedVisible: true };
    const hidden: ReturnedFinding = { ...f, params: { ...f.params }, relatedVisible: false };
    delete hidden.relatedNeedId;
    delete hidden.params.code;
    return hidden;
  });
}

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

    async getNeeds(ctx) {
      return state().needs.filter((n) => zoneInScope(zones, n.sector_id, ctx.scope));
    },

    async getNeed(ctx, needId) {
      const n = state().needs.find((x) => x.id === needId);
      return n && zoneInScope(zones, n.sector_id, ctx.scope) ? n : null;
    },

    async getNeedTotals(ctx) {
      const visible = state().needs.filter((n) => zoneInScope(zones, n.sector_id, ctx.scope));
      const submitted = visible.filter((n) => n.need_state === 'submitted');
      return {
        submitted: submitted.length,
        drafts: visible.length - submitted.length,
        weekly_hours: submitted.reduce((sum, n) => sum + (n.weekly_hours ?? 0), 0),
      };
    },

    async getStores(ctx) {
      return stores.filter((st) =>
        st.sector_id === null ? ctx.side !== 'client' : zoneInScope(zones, st.sector_id, ctx.scope),
      );
    },

    async getCampaigns() {
      return campaigns;
    },

    async getWeekClosures() {
      return weekClosures;
    },

    async getEvents(ctx) {
      return state().events
        .filter((e) => audienceAllows(ctx.side, e.audience) && zoneInScope(zones, e.zone_id, ctx.scope))
        .sort((a, b) => b.seq - a.seq);
    },

    canWriteNeeds(ctx) {
      return WRITE_PROFILES.includes(ctx.profileId);
    },

    async saveNeed(ctx, input, options = {}) {
      return saveNeedImpl(ctx, input, options);
    },

    async duplicateNeed(ctx, needId, newStart, options = {}) {
      const src = state().needs.find((n) => n.id === needId);
      if (!src || !zoneInScope(zones, src.sector_id, ctx.scope)) return refusal('not_found');
      const first = src.periods.map(resolvePeriod).find((p) => p.start)?.start;
      if (!first) return refusal('no_period');
      const shift = daysBetween(first, newStart);
      const move = (d: string | null) => (d ? addDays(d, shift) : null);
      const periods: Period[] = src.periods.map((p) => {
        const start_date = move(resolvePeriod(p).start);
        const end_date = move(resolvePeriod(p).end);
        return {
          period_no: p.period_no, start_date, end_date,
          start_week: start_date ? storedWeekOf(start_date) : null,
          end_week: end_date ? storedWeekOf(end_date) : null,
        };
      });
      const { dispositif, campaign_code, sector_id, position_label, weekly_hours, priority, days, hours_slot, store_codes, client_comment } = src;
      return saveNeedImpl(
        ctx,
        { dispositif, campaign_code, sector_id, position_label, weekly_hours, priority, days, hours_slot, store_codes, client_comment, periods },
        options,
      );
    },
  };

  function refusal(reason: SaveRefusal, findings: ReturnedFinding[] = [], missing: string[] = []): SaveResult {
    return { status: 'refused', reason, findings, missing };
  }

  /** Détection d'une anomalie (EV-05) : réservée à l'agence (qualité des données, D108). */
  function emitAnomalies(ctx: AccessContext, sectorId: string, needId: string | null, findings: Finding[]) {
    for (const f of findings) {
      if (f.gravity === 'info') continue;
      emit('EV-05', ctx.profileId, sectorId, needId, 'agency', { rule: f.rule, gravity: f.gravity });
    }
  }

  async function saveNeedImpl(ctx: AccessContext, input: RuleInput, options: SaveOptions): Promise<SaveResult> {
    const st = state();
    if (!WRITE_PROFILES.includes(ctx.profileId)) return refusal('forbidden');
    const sector = zones.find((z) => z.id === input.sector_id && z.kind === 'rs');
    if (!sector || !zoneInScope(zones, sector.id, ctx.scope)) return refusal('out_of_scope');

    const allowedStores = stores.filter((s) => s.sector_id === sector.id || (s.sector_id === null && ctx.side !== 'client'));
    if (!input.store_codes.every((c) => allowedStores.some((s) => s.code === c))) return refusal('invalid_store');

    const campaign = input.campaign_code ? campaigns.find((c) => c.code === input.campaign_code) : undefined;
    if (input.campaign_code && (!campaign || (input.dispositif && campaign.dispositif !== input.dispositif))) {
      return refusal('campaign_mismatch');
    }

    let draft: Need | undefined;
    if (options.needId) {
      draft = st.needs.find((n) => n.id === options.needId);
      if (!draft || draft.sector_id !== sector.id) return refusal('not_found');
      if (draft.need_state !== 'draft') return refusal('not_draft');
    }
    const mergeTarget = options.mergeInto ? st.needs.find((n) => n.id === options.mergeInto) : undefined;
    if (options.mergeInto && (!mergeTarget || mergeTarget.sector_id !== sector.id)) return refusal('not_found');

    const others = st.needs.filter((n) => n.id !== draft?.id && n.id !== mergeTarget?.id);
    const check = checkNeed(input, ruleEnv(input.campaign_code), others, {
      id: draft?.id ?? null, need_code: null, source_record_id: null,
    });
    const findings = presentFindings(ctx, check.findings);
    const decision = decideSave(check, options.confirm === true || mergeTarget !== undefined);

    if (decision === 'refuse') {
      emitAnomalies(ctx, sector.id, draft?.id ?? null, check.findings);
      return { status: 'refused', reason: 'blocked', findings, missing: check.missing };
    }
    if (decision === 'confirm') return { status: 'needs_confirmation', findings, missing: check.missing };

    const today = clock.date;
    if (mergeTarget) {
      const spans = [...mergeTarget.periods, ...input.periods].map(resolvePeriod).filter((p) => p.start && p.end);
      const start = spans.reduce((m, p) => (p.start as string) < m ? (p.start as string) : m, spans[0]?.start as string);
      const end = spans.reduce((m, p) => (p.end as string) > m ? (p.end as string) : m, spans[0]?.end as string);
      const rest = mergeTarget.periods.filter((p) => p.period_no !== 1);
      mergeTarget.periods = [
        { period_no: 1, start_date: start, end_date: end, start_week: storedWeekOf(start), end_week: storedWeekOf(end) },
        ...rest,
      ];
      mergeTarget.record_version += 1;
      mergeTarget.modified_at = today;
      emitAnomalies(ctx, sector.id, mergeTarget.id, check.findings);
      emit('EV-03', ctx.profileId, sector.id, mergeTarget.id, 'both', { need_code: mergeTarget.need_code, merged: true });
      return { status: 'saved', need: mergeTarget, decision: 'merge', findings, missing: [] };
    }

    const fields = {
      dispositif: input.dispositif,
      campaign_code: input.campaign_code,
      sector_id: sector.id,
      position_label: input.position_label?.trim() || null,
      weekly_hours: input.weekly_hours,
      priority: input.priority,
      periods: normalisePeriods(input.periods),
      days: [...input.days].sort((a, b) => a - b),
      hours_slot: input.hours_slot?.trim() || null,
      store_codes: [...input.store_codes],
      store_count: input.store_codes.length,
      client_comment: input.client_comment?.trim() || null,
    };
    const state_ = decision === 'submit' ? ('submitted' as const) : ('draft' as const);

    let saved: Need;
    if (draft) {
      Object.assign(draft, fields, { need_state: state_, modified_at: today, record_version: draft.record_version + 1 });
      saved = draft;
    } else {
      saved = {
        id: crypto.randomUUID(), need_code: nextNeedCode(), ...fields, need_state: state_, position_status: null,
        entered_by_profile: ctx.profileId, on_behalf: ctx.profileId !== 'rs',
        created_at: today, modified_at: today, record_version: 1, source_record_id: null, is_demo: true,
      };
      st.needs.push(saved);
      emit('EV-01', ctx.profileId, sector.id, saved.id, 'both', { need_code: saved.need_code, on_behalf: saved.on_behalf });
    }
    if (state_ === 'submitted') {
      emit('EV-02', ctx.profileId, sector.id, saved.id, 'both', { need_code: saved.need_code, on_behalf: saved.on_behalf });
    }
    emitAnomalies(ctx, sector.id, saved.id, check.findings);
    return { status: 'saved', need: saved, decision: state_ === 'submitted' ? 'submit' : 'draft', findings, missing: check.missing };
  }
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
