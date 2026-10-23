import { z } from 'zod';
import { alertVisible, audienceAllows, lineage, zoneInScope } from '@/domain/access';
import type { AccessContext } from '@/domain/access';
import { MENU_BY_PROFILE, MENU_HREF } from '@/domain/menu';
import { isEmptyBatchRow, rowToInput } from '@/domain/batch';
import { buildDeadlineAlerts, buildOutbox, delaySummary, needMonth } from '@/domain/deadline-views';
import { gate, listDeadlines } from '@/domain/deadlines';
import { applyDispositifParams, paramsMapOf } from '@/domain/dispositif-params';
import { checkNeed, decideSave } from '@/domain/need-check';
import type { Finding } from '@/domain/rules';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import { DEFAULT_HOME_SKIN, DISPOSITIFS, HOME_SKINS, PRESET_IDS } from '@/domain/types';
import type { Audience, DeadlineType, Dispositif, EventCode, HomeSkin, PresetId, ProfileId, Severity } from '@/domain/types';
import {
  addDays, daysBetween, isValidIsoDate, isValidWeek, parseStoredWeek, storedWeekOf, weekEnd, weekStart,
} from '@/domain/week';
import { resolvePeriod } from '@/domain/week-rules';
import type { RuleEnv, RuleInput } from '@/domain/week-rules';
import { calendarOf } from '@/domain/deadlines';
import { addMonths, isWorkingDay, monthStart } from '@/domain/working-days';
import alertsJson from './fixtures/alerts.json';
import campaignsJson from './fixtures/campaigns.json';
import clockJson from './fixtures/clock.json';
import deadlineSettingsJson from './fixtures/deadline-settings.json';
import dispositifParamsJson from './fixtures/dispositif-params.json';
import eventsJson from './fixtures/events.json';
import needsJson from './fixtures/needs.json';
import profilesJson from './fixtures/profiles.json';
import reopeningRequestsJson from './fixtures/reopening-requests.json';
import reopeningsJson from './fixtures/reopenings.json';
import storesJson from './fixtures/stores.json';
import weekClosuresJson from './fixtures/week-closures.json';
import zonesJson from './fixtures/zones.json';
import type {
  BatchDraft, BatchLineResult, DemoProfileDirectory, OutboxEntry, Repository, ReturnedFinding,
  SaveOptions, SaveRefusal, SaveResult,
} from './repository';
import {
  AlertSchema, BatchRowsSchema, BusinessEventSchema, CampaignSchema, DeadlineSettingsSchema, DemoClockSchema,
  DispositifParamsSchema, MonthStr, NeedInputSchema, NeedSchema, PARAM_KEYS, PARAM_VALUE_SCHEMAS, ProfileSchema,
  ReopeningRequestSchema, ReopeningSchema, StoreSchema, WeekClosureSchema, ZoneSchema,
} from './schemas';
import type {
  BusinessEvent, DeadlineSettings, DispositifParams, Need, ParamChange, Period, Reopening,
  ReopeningRequest, Zone,
} from './schemas';

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
  settings: DeadlineSettings;
  params: DispositifParams[];
  paramHistory: ParamChange[];
  campaignDispositifs: Record<string, Dispositif[]>;
  reopenings: Reopening[];
  requests: ReopeningRequest[];
  batchDrafts: Partial<Record<ProfileId, BatchDraft>>;
  outbox: Record<string, 'validated' | 'discarded'>;
  homeSkinDefault: HomeSkin;
  userSkins: Partial<Record<ProfileId, HomeSkin>>;
}
const globalState = globalThis as typeof globalThis & { __suntoryDemoState?: DemoState };
function state(): DemoState {
  if (!globalState.__suntoryDemoState) {
    const events = z.array(BusinessEventSchema).parse(eventsJson);
    globalState.__suntoryDemoState = {
      needs: z.array(NeedSchema).parse(needsJson),
      events,
      seq: events.reduce((m, e) => Math.max(m, e.seq), 0),
      settings: structuredClone(DeadlineSettingsSchema.parse(deadlineSettingsJson)),
      params: structuredClone(z.array(DispositifParamsSchema).parse(dispositifParamsJson)),
      paramHistory: [],
      campaignDispositifs: Object.fromEntries(campaigns.map((c) => [c.code, [c.dispositif]])),
      reopenings: z.array(ReopeningSchema).parse(reopeningsJson),
      requests: z.array(ReopeningRequestSchema).parse(reopeningRequestsJson),
      batchDrafts: {},
      outbox: {},
      homeSkinDefault: DEFAULT_HOME_SKIN,
      userSkins: {},
    };
  }
  return globalState.__suntoryDemoState;
}

/** Remet la démonstration dans son état initial (tests). */
export function resetDemoState(): void {
  delete globalState.__suntoryDemoState;
}

/** Photographie des données modifiables, journal exclu : le journal n'est jamais réécrit (D91). */
const snapshotOf = (st: DemoState): string => JSON.stringify({ ...st, events: undefined, seq: undefined, batchDrafts: undefined, userSkins: undefined });
type UndoEntry = { actor: ProfileId; before: string; after: string };
const undoGlobal = globalThis as typeof globalThis & { __suntoryUndo?: Map<string, UndoEntry> };
const undoStore = (undoGlobal.__suntoryUndo ??= new Map<string, UndoEntry>());
const UNDO_KEEP = 20;

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

/** Réouvertures de l'agence qui s'appliquent à un secteur : la zone de la réouverture est le secteur ou l'un de ses ancêtres. */
function reopeningsForSector(sectorId: string): Reopening[] {
  const chain = new Set(lineage(zones, sectorId).map((z) => z.id));
  return state().reopenings.filter((r) => chain.has(r.zone_id));
}

/** Semaines clôturées, moins celles que l'agence a rouvertes pour ce secteur (W12, D147). */
function effectiveClosedWeeks(sectorId: string | null): Set<string> {
  const open = sectorId ? reopeningsForSector(sectorId).filter((r) => r.scope === 'week' && r.expires_on >= clock.date) : [];
  return new Set(weekClosures.map((w) => w.week).filter((w) => !open.some((r) => r.target === w)));
}

interface EnvOptions {
  dispositif: Dispositif | null;
  sectorId: string;
  actor: ProfileId;
  writeKind: 'entry' | 'change';
  targetMonth?: string;
  deferredFrom?: string;
}

function ruleEnv(campaignCode: string | null, o: EnvOptions): RuleEnv {
  const camp = campaigns.find((c) => c.code === campaignCode);
  const st = state();
  const env: RuleEnv = {
    today: clock.date,
    closedWeeks: effectiveClosedWeeks(o.sectorId),
    campaign: camp ? { dispositif: camp.dispositif, window_start: camp.window_start, window_end: camp.window_end } : null,
    config: applyDispositifParams(DEFAULT_RULE_CONFIG, o.dispositif ? paramsMapOf(st.params)[o.dispositif] : undefined),
    a2b: {
      actor: o.actor,
      writeKind: o.writeKind,
      settings: st.settings,
      params: paramsMapOf(st.params),
      reopenings: reopeningsForSector(o.sectorId),
      campaignDispositifs: st.campaignDispositifs,
    },
  };
  if (o.targetMonth && env.a2b) env.a2b.targetMonth = o.targetMonth;
  if (o.deferredFrom && env.a2b) env.a2b.deferredFrom = o.deferredFrom;
  return env;
}

/** Zones liées : l'une est l'ancêtre de l'autre (ou la même). */
function related(a: string, b: string): boolean {
  return lineage(zones, a).some((z) => z.id === b) || lineage(zones, b).some((z) => z.id === a);
}

const isAgencyAdmin = (ctx: AccessContext) => ctx.profileId === 'agency_admin';
const hasSettingsMenu = (ctx: AccessContext) => MENU_BY_PROFILE[ctx.profileId].includes('settings');
const TODAY_PLUS_DAYS = 90;

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

const DEADLINE_BLOCK_RULES: readonly string[] = ['E1', 'E2', 'P3', 'P4'];
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

    // ---------------------------------------------------------------------------------------------
    // Lot A2b
    // ---------------------------------------------------------------------------------------------
    async getDeadlineContext(ctx) {
      const st = state();
      const scopeSectors = zones.filter((z) => z.kind === 'rs' && zoneInScope(zones, z.id, ctx.scope));
      const lineageMap: Record<string, string[]> = {};
      for (const z of scopeSectors) lineageMap[z.id] = lineage(zones, z.id).map((x) => x.id);
      const visible = new Set(Object.values(lineageMap).flat());
      return {
        today: clock.date,
        settings: st.settings,
        // Le forfait kilométrique n'est pas communiqué côté cliente tant que D08 n'est pas tranché (doc 28 §2.5).
        params: st.params.map((p) => (ctx.side === 'client' ? { ...p, km_flat_rate: { applicable: false, amount_eur_ht: null } } : p)),
        reopenings: st.reopenings.filter((r) => ctx.scope.kind === 'all' || visible.has(r.zone_id)),
        lineage: lineageMap,
      };
    },

    async getDelaySummary(ctx) {
      const scopeZones = await this.getScopeZones(ctx);
      const needs = state().needs.filter((n) => zoneInScope(zones, n.sector_id, ctx.scope));
      return delaySummary({ today: clock.date, settings: state().settings, zones: scopeZones, needs });
    },

    async getDeadlineAlerts(ctx) {
      const st = state();
      const delays = await this.getDelaySummary(ctx);
      const needs = st.needs.filter((n) => zoneInScope(zones, n.sector_id, ctx.scope));
      const deferredByMonth: Record<string, number> = {};
      for (const n of needs) if (n.deferred_from_month) deferredByMonth[n.deferred_from_month] = (deferredByMonth[n.deferred_from_month] ?? 0) + 1;
      const pendingRequests = st.requests.filter((r) => r.status === 'pending' && zoneInScope(zones, r.zone_id, ctx.scope)).length;
      const rows = listDeadlines(clock.date, st.settings, paramsMapOf(st.params));
      const all = buildDeadlineAlerts({ today: clock.date, rows, delays, deferredByMonth, pendingRequests });
      // Filtrage par audience dans la couche de données (D108) : défaut refus.
      return all
        .filter((a) => audienceAllows(ctx.side, a.audience))
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.id.localeCompare(b.id));
    },

    canManageSettings(ctx) {
      return isAgencyAdmin(ctx);
    },

    async getDispositifParams(ctx) {
      return hasSettingsMenu(ctx) ? state().params : [];
    },

    async getParamHistory(ctx) {
      return hasSettingsMenu(ctx) ? [...state().paramHistory].sort((a, b) => b.seq - a.seq) : [];
    },

    async updateDispositifParam(ctx, dispositif, key, value) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      const target = state().params.find((p) => p.dispositif === dispositif);
      if (!target || !(PARAM_KEYS as readonly string[]).includes(key)) return { status: 'refused', reason: 'invalid' };
      const parsed = PARAM_VALUE_SCHEMAS[key].safeParse(value);
      if (!parsed.success) return { status: 'refused', reason: 'invalid' };
      const old = target[key];
      if (JSON.stringify(old) === JSON.stringify(parsed.data)) return { status: 'refused', reason: 'unchanged' };
      (target as Record<string, unknown>)[key] = parsed.data;
      const st = state();
      const seq = st.paramHistory.reduce((m, h) => Math.max(m, h.seq), 0) + 1;
      st.paramHistory.push({
        id: crypto.randomUUID(), seq, dispositif, key, old_value: old, new_value: parsed.data, actor_profile: ctx.profileId, changed_on: clock.date,
      });
      const anyZone = (zones.find((z) => z.kind === 'dr') as Zone).id;
      emit('EV-38', ctx.profileId, anyZone, null, 'agency', { kind: 'dispositif', dispositif, key });
      return { status: 'ok' };
    },

    async getCampaignDispositifs() {
      return state().campaignDispositifs;
    },

    async assignCampaignDispositif(ctx, campaignCode, dispositif) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      const list = state().campaignDispositifs[campaignCode];
      if (!list || !(DISPOSITIFS as readonly string[]).includes(dispositif)) return { status: 'refused', reason: 'not_found' };
      if (list.includes(dispositif)) return { status: 'ok' };
      // P2 : une campagne ne relève que d'un dispositif. Rien n'est modifié.
      return { status: 'refused', reason: 'p2' };
    },

    async updateDeadlineEntry(ctx, input) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      const st = state();
      if (!MonthStr.safeParse(input.month).success || !(['needs_entry', 'change_request'] as DeadlineType[]).includes(input.type)) {
        return { status: 'refused', reason: 'invalid' };
      }
      const rest = st.settings.entries.filter((e) => !(e.month === input.month && e.type === input.type));
      if (input.mode === 'default') {
        st.settings.entries = rest;
      } else if (input.mode === 'preset') {
        if (!input.preset || !(PRESET_IDS as readonly string[]).includes(input.preset)) return { status: 'refused', reason: 'invalid' };
        rest.push({ month: input.month, type: input.type, preset: input.preset, fixed_date: null, author_profile: ctx.profileId, effective_from: clock.date, is_demo: true });
        st.settings.entries = rest;
      } else {
        const d = input.fixedDate;
        // Une date fixe est un jour ouvré antérieur au début du mois cible (les non ouvrés sont désactivés dans le calendrier).
        if (!d || !isValidIsoDate(d) || !isWorkingDay(d, calendarOf(st.settings)) || d >= monthStart(input.month)) {
          return { status: 'refused', reason: 'invalid' };
        }
        rest.push({ month: input.month, type: input.type, preset: null, fixed_date: d, author_profile: ctx.profileId, effective_from: clock.date, is_demo: true });
        st.settings.entries = rest;
      }
      st.settings.entries.sort((a, b) => a.month.localeCompare(b.month) || a.type.localeCompare(b.type));
      emit('EV-38', ctx.profileId, (zones.find((z) => z.kind === 'dr') as Zone).id, null, 'agency', { kind: 'calendar', month: input.month, type: input.type, mode: input.mode });
      return { status: 'ok' };
    },

    async setDefaultPreset(ctx, preset: PresetId) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      if (!(PRESET_IDS as readonly string[]).includes(preset)) return { status: 'refused', reason: 'invalid' };
      state().settings.default_preset = preset;
      emit('EV-38', ctx.profileId, (zones.find((z) => z.kind === 'dr') as Zone).id, null, 'agency', { kind: 'calendar', mode: 'default_preset', preset });
      return { status: 'ok' };
    },

    async getReopenings(ctx) {
      return state().reopenings.filter((r) => zoneInScope(zones, r.zone_id, ctx.scope) || ctx.scope.kind === 'all');
    },

    async getReopeningRequests(ctx) {
      return state().requests.filter((r) => zoneInScope(zones, r.zone_id, ctx.scope));
    },

    async requestReopening(ctx, input) {
      if (ctx.profileId !== 'cvr_client' || ctx.scope.kind !== 'cvr') return { status: 'refused', reason: 'forbidden' };
      const zoneId = ctx.scope.ids[0];
      const motive = input.motive.trim();
      const max = addDays(clock.date, TODAY_PLUS_DAYS);
      if (!zoneId || motive.length === 0 || motive.length > 280 || !isValidIsoDate(input.desiredUntil) || input.desiredUntil < clock.date || input.desiredUntil > max) {
        return { status: 'refused', reason: 'invalid' };
      }
      const st = state();
      if (input.scope === 'month') {
        if (!MonthStr.safeParse(input.target).success) return { status: 'refused', reason: 'invalid' };
        const g = gate({ month: input.target, type: 'needs_entry', dispositif: null, today: clock.date, settings: st.settings, params: paramsMapOf(st.params), reopenings: st.reopenings.filter((r) => related(r.zone_id, zoneId)) });
        if (g.open) return { status: 'refused', reason: 'not_closed' };
      } else {
        if (!weekClosures.some((w) => w.week === input.target)) return { status: 'refused', reason: 'invalid' };
        if (st.reopenings.some((r) => r.scope === 'week' && r.target === input.target && r.expires_on >= clock.date && related(r.zone_id, zoneId))) return { status: 'refused', reason: 'not_closed' };
      }
      if (st.requests.some((r) => r.status === 'pending' && r.scope === input.scope && r.target === input.target && r.zone_id === zoneId)) {
        return { status: 'refused', reason: 'duplicate' };
      }
      const request: ReopeningRequest = {
        id: crypto.randomUUID(), scope: input.scope, target: input.target, zone_id: zoneId, motive,
        desired_until: input.desiredUntil, requested_on: clock.date, status: 'pending', is_demo: true,
      };
      st.requests.push(request);
      emit('EV-32', ctx.profileId, zoneId, null, 'both', { scope: input.scope, target: input.target, until: input.desiredUntil });
      return { status: 'ok' };
    },

    async decideReopening(ctx, input) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      const st = state();
      const request = input.requestId ? st.requests.find((r) => r.id === input.requestId && r.status === 'pending') : undefined;
      if (input.requestId && !request) return { status: 'refused', reason: 'not_found' };
      const scope = request?.scope ?? input.scope;
      const target = request?.target ?? input.target;
      const zoneId = request?.zone_id ?? input.zoneId;
      if (!zones.some((z) => z.id === zoneId)) return { status: 'refused', reason: 'not_found' };
      if (input.decision === 'decline') {
        if (!request) return { status: 'refused', reason: 'invalid' };
        request.status = 'declined';
        emit('EV-33', ctx.profileId, zoneId, null, 'both', { decision: 'declined', scope, target });
        return { status: 'ok' };
      }
      const reason = input.reason.trim();
      const validTarget = scope === 'month' ? MonthStr.safeParse(target).success : weekClosures.some((w) => w.week === target);
      if (!validTarget || reason.length === 0 || reason.length > 280 || !isValidIsoDate(input.expiresOn) || input.expiresOn < clock.date || input.expiresOn > addDays(clock.date, TODAY_PLUS_DAYS)) {
        return { status: 'refused', reason: 'invalid' };
      }
      st.reopenings.push({
        id: crypto.randomUUID(), scope, target, zone_id: zoneId, reason, expires_on: input.expiresOn,
        decided_by: ctx.profileId, decided_on: clock.date, request_id: request?.id ?? null, is_demo: true,
      });
      if (request) request.status = 'granted';
      emit('EV-33', ctx.profileId, zoneId, null, 'both', { decision: 'granted', scope, target, until: input.expiresOn });
      return { status: 'ok' };
    },

    async getOutbox(ctx): Promise<OutboxEntry[]> {
      if (ctx.side === 'client') return [];
      const st = state();
      const delays = delaySummary({ today: clock.date, settings: st.settings, zones, needs: st.needs });
      const rows = listDeadlines(clock.date, st.settings, paramsMapOf(st.params));
      return buildOutbox({ today: clock.date, rows, delays, zones }).map((i) => ({ ...i, status: st.outbox[i.id] ?? 'pending' }));
    },

    async decideOutbox(ctx, id, decision) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      const known = (await this.getOutbox(ctx)).some((i) => i.id === id);
      if (!known) return { status: 'refused', reason: 'not_found' };
      state().outbox[id] = decision;
      return { status: 'ok' };
    },

    async resolveSectorCodes(ctx, codes) {
      const wanted = new Set(codes.map((c) => c.trim().toLowerCase()).filter(Boolean));
      return zones
        .filter((z) => z.kind === 'rs' && zoneInScope(zones, z.id, ctx.scope) && wanted.has(z.code.toLowerCase()))
        .map((z) => ({ id: z.id, code: z.code }));
    },

    async saveNeedsBatch(ctx, rows, options = {}) {
      const lines: BatchLineResult[] = [];
      const confirm = new Set(options.confirm ?? []);
      const defer = new Set(options.defer ?? []);
      const fixedSector = ctx.scope.kind === 'rs' && ctx.scope.ids.length === 1 ? ctx.scope.ids[0] : undefined;
      for (const [index, row] of rows.entries()) {
        const line = await (async (): Promise<BatchLineResult> => {
          if (isEmptyBatchRow(row, fixedSector)) return { index, status: 'ignored', findings: [], missing: [] };
          if (row.paste_issues && row.paste_issues.length > 0) {
            return { index, status: 'rejected', reason: 'paste', findings: [], missing: [], issues: row.paste_issues };
          }
          const candidate = rowToInput({ ...row, sector_id: row.sector_id || fixedSector || '' });
          const parsed = NeedInputSchema.safeParse(candidate);
          if (!parsed.success) return { index, status: 'rejected', reason: 'invalid', findings: [], missing: [] };
          const r = await saveNeedImpl(ctx, { ...parsed.data, ...(candidate.raw ? { raw: candidate.raw } : {}) }, {
            confirm: confirm.has(index), deferToNextMonth: defer.has(index), requireComplete: true,
          });
          if (r.status === 'saved') return { index, status: 'saved', needId: r.need.id, needCode: r.need.need_code, decision: r.decision, findings: r.findings, missing: r.missing };
          if (r.status === 'needs_confirmation') return { index, status: 'needs_confirmation', findings: r.findings, missing: r.missing };
          return { index, status: 'rejected', reason: r.reason, findings: r.findings, missing: r.missing };
        })();
        lines.push(line);
      }
      const count = (s: BatchLineResult['status']) => lines.filter((l) => l.status === s).length;
      return { lines, saved: count('saved'), rejected: count('rejected'), needsConfirmation: count('needs_confirmation'), ignored: count('ignored') };
    },

    async withUndo(ctx, write, changed) {
      const before = snapshotOf(state());
      const result = await write();
      const after = snapshotOf(state());
      if (!changed(result) || before === after) return { result, undoToken: null };
      const token = crypto.randomUUID();
      undoStore.set(token, { actor: ctx.profileId, before, after });
      while (undoStore.size > UNDO_KEEP) undoStore.delete(undoStore.keys().next().value as string);
      return { result, undoToken: token };
    },

    async undoWrite(ctx, token) {
      const entry = undoStore.get(token);
      if (!entry || entry.actor !== ctx.profileId) return { status: 'refused', reason: entry ? 'forbidden' : 'expired' };
      const st = state();
      if (snapshotOf(st) !== entry.after) return { status: 'refused', reason: 'expired' };
      const { events, seq } = st;
      const restored = JSON.parse(entry.before) as Partial<DemoState>;
      Object.assign(st, restored, { events, seq });
      undoStore.delete(token);
      const anyZone = (zones.find((z) => z.kind === 'dr') as Zone).id;
      emit('EV-39', ctx.profileId, anyZone, null, 'agency', { kind: 'undo' });
      return { status: 'ok' };
    },

    async getHomeSkin(ctx) {
      const st = state();
      const own = st.userSkins[ctx.profileId];
      return own ? { skin: own, source: 'user' } : { skin: st.homeSkinDefault, source: 'agency' };
    },

    async getHomeSkinDefault(ctx) {
      return isAgencyAdmin(ctx) ? state().homeSkinDefault : null;
    },

    async setHomeSkinDefault(ctx, skin) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      if (!(HOME_SKINS as readonly string[]).includes(skin)) return { status: 'refused', reason: 'invalid' };
      const st = state();
      if (st.homeSkinDefault === skin) return { status: 'ok' };
      st.homeSkinDefault = skin;
      emit('EV-38', ctx.profileId, (zones.find((z) => z.kind === 'dr') as Zone).id, null, 'agency', { kind: 'home_skin', skin });
      return { status: 'ok' };
    },

    async setUserHomeSkin(ctx, skin) {
      if (!(HOME_SKINS as readonly string[]).includes(skin)) return { status: 'refused', reason: 'invalid' };
      state().userSkins[ctx.profileId] = skin;
      return { status: 'ok' };
    },

    async getBatchDraft(ctx) {
      return state().batchDrafts[ctx.profileId] ?? null;
    },

    async saveBatchDraft(ctx, rows) {
      if (!WRITE_PROFILES.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
      state().batchDrafts[ctx.profileId] = { updated_on: clock.date, rows: BatchRowsSchema.parse(rows) };
      return { status: 'ok' };
    },

    async clearBatchDraft(ctx) {
      delete state().batchDrafts[ctx.profileId];
    },
  };

  function refusal(reason: SaveRefusal, findings: ReturnedFinding[] = [], missing: string[] = []): SaveResult {
    return { status: 'refused', reason, findings, missing };
  }

  /** Demande reportée sur le mois suivant (D82) : tracée sur le besoin et dans le journal (EV-04). */
  function markDeferred(ctx: AccessContext, sectorId: string, need: Need, fromMonth: string) {
    need.deferred_from_month = fromMonth;
    emit('EV-04', ctx.profileId, sectorId, need.id, 'agency', { kind: 'deferred', from: fromMonth, to: addMonths(fromMonth, 1) });
  }

  /** Détection d'une anomalie (EV-05) : réservée à l'agence (qualité des données, D108). */
  function emitAnomalies(ctx: AccessContext, sectorId: string, needId: string | null, findings: Finding[]) {
    for (const f of findings) {
      if (f.gravity === 'info' || DEADLINE_BLOCK_RULES.includes(f.rule)) continue;
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
    // Mois cible : celui du besoin modifié pour une fusion, sinon celui du premier jour de la première période.
    const mergeMonth = mergeTarget ? needMonth(mergeTarget) : null;
    const ownMonth = needMonth({ periods: input.periods });
    const deferredFrom = options.deferToNextMonth ? (mergeMonth ?? ownMonth ?? undefined) : undefined;
    const envOptions: EnvOptions = {
      dispositif: input.dispositif, sectorId: sector.id, actor: ctx.profileId, writeKind: mergeTarget ? 'change' : 'entry',
    };
    if (mergeMonth) envOptions.targetMonth = mergeMonth;
    if (deferredFrom) envOptions.deferredFrom = deferredFrom;
    const check = checkNeed(input, ruleEnv(input.campaign_code, envOptions), others, {
      id: draft?.id ?? null, need_code: null, source_record_id: null,
    });
    const findings = presentFindings(ctx, check.findings);
    const decision = decideSave(check, options.confirm === true || mergeTarget !== undefined);

    if (decision === 'refuse') {
      emitAnomalies(ctx, sector.id, draft?.id ?? null, check.findings);
      for (const f of check.findings.filter((x) => DEADLINE_BLOCK_RULES.includes(x.rule) && x.gravity === 'blocking')) {
        emit('EV-04', ctx.profileId, sector.id, draft?.id ?? null, 'agency', {
          kind: 'blocked', rule: f.rule, month: String(f.params.month), deadline: String(f.params.deadline),
        });
      }
      return { status: 'refused', reason: 'blocked', findings, missing: check.missing };
    }
    if (options.requireComplete && !check.complete) return refusal('incomplete', findings, check.missing);
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
      if (deferredFrom) markDeferred(ctx, sector.id, mergeTarget, deferredFrom);
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
      if (deferredFrom) markDeferred(ctx, sector.id, saved, deferredFrom);
    } else {
      saved = {
        id: crypto.randomUUID(), need_code: nextNeedCode(), ...fields, need_state: state_, position_status: null,
        entered_by_profile: ctx.profileId, on_behalf: ctx.profileId !== 'rs',
        created_at: today, modified_at: today, record_version: 1, source_record_id: null, is_demo: true,
      };
      st.needs.push(saved);
      if (deferredFrom) markDeferred(ctx, sector.id, saved, deferredFrom);
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
