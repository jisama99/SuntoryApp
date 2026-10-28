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
import { CREATABLE_PROFILES, validAssignment, passwordProblem } from '@/domain/accounts';
import {
  DEFAULT_PIPELINE_PARAMS, activeProposal, addWorkingDays, billableFrom, blankRecruitment, computeDeviations, delaySampleOf, delayStats,
  executionStatus, funnelState, startLagSample, startLagStats, funnelSummary, needChangedSince, noteVisibleTo, nextStep, positionStatus, proposalIssues, sentProposal, validDecisionOn,
} from '@/domain/pipeline';
import type { Facts, FunnelRow, PipelineParams } from '@/domain/pipeline';
import {
  authorityFor, canResubmit, cvrZoneOf, delegationIssue, delegationStatus, drZoneOf, effectiveScope, validationIssue,
} from '@/domain/validation';
import type { EnvelopeEvaluator } from '@/domain/validation';
import {
  allocatedSum, allocationIssue, budgetNeedsOf, classifyNeeds, envelopeIssue, envelopeStatusOf, figuresOf, fromCents, imputationMoves, linesOf, snapshotOfNeeds, toCents,
} from '@/domain/budget';
import type { BudgetNeed, ImputationSnapshot } from '@/domain/budget';
import { canEnterNeeds, isOnBehalf, opinionAtEntry } from '@/domain/entry-rights';
import { BUDGET_EVENT_CODES, DECISION_OUTCOMES, DEFAULT_HOME_SKIN, ENTRY_PROFILES, DISPOSITIFS, HOME_SKINS, NOTE_VISIBILITIES, PRESET_IDS } from '@/domain/types';
import type {
  Audience, BudgetStatus, DeadlineType, Dispositif, EventCode, HomeSkin, InvalidationReason, NoteObjectKind, NoteVisibility, PresetId, ProfileId,
  RecruitmentStep, Severity,
} from '@/domain/types';
import {
  addDays, daysBetween, isValidIsoDate, isValidWeek, parseStoredWeek, storedWeekOf, weekEnd, weekStart,
} from '@/domain/week';
import { resolvePeriod } from '@/domain/week-rules';
import type { RuleEnv, RuleInput } from '@/domain/week-rules';
import { calendarOf } from '@/domain/deadlines';
import { addMonths, isWorkingDay, monthStart, workingDaysBetween } from '@/domain/working-days';
import accountsJson from './fixtures/accounts.json';
import allocationsJson from './fixtures/allocations.json';
import envelopesJson from './fixtures/envelopes.json';
import ratesJson from './fixtures/rates.json';
import alertsJson from './fixtures/alerts.json';
import campaignsJson from './fixtures/campaigns.json';
import clockJson from './fixtures/clock.json';
import deadlineSettingsJson from './fixtures/deadline-settings.json';
import decisionsJson from './fixtures/decisions.json';
import delegationsJson from './fixtures/delegations.json';
import notesJson from './fixtures/notes.json';
import proposalsJson from './fixtures/proposals.json';
import recruitmentsJson from './fixtures/recruitments.json';
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
  BatchDecisionResult, BatchDraft, BudgetAlert, BudgetGroup, BudgetLineView, BudgetNeedRow, BudgetView, BatchLineResult, BatchValidationResult, DecisionInput, DecisionRefusal, DelegationView, DemoProfileDirectory,
  FunnelReport, MutationResult, NeedThread, OutboxEntry, PipelineAlert, PipelineRow, ProposalResult, Repository, ReturnedFinding, SaveOptions,
  SaveRefusal, SaveResult, StepInput, StepRefusal, ValidationFailure, ValidationInput, ValidationView,
} from './repository';
import {
  AccountSchema, AllocationLineSchema, AlertSchema, EnvelopeVersionSchema, RateSchema, BatchRowsSchema, BusinessEventSchema, CampaignSchema, DeadlineSettingsSchema, DecisionSchema,
  DelegationSchema, DemoClockSchema, DispositifParamsSchema, MonthStr, NeedInputSchema, NeedSchema, NoteSchema, PARAM_KEYS, PARAM_VALUE_SCHEMAS,
  ProfileSchema, ProposalInputSchema, ProposalSchema, RecruitmentSchema, ReopeningRequestSchema, ReopeningSchema, StoreSchema,
  USERNAME_PATTERN, WeekClosureSchema, ZoneSchema,
} from './schemas';
import type {
  Account, AllocationLine, BusinessEvent, DeadlineSettings, EnvelopeVersion, Decision, Delegation, DispositifParams, Need, Note, ParamChange, Period, Proposal, ProposalInput,
  PublicAccount, Recruitment, Reopening, ReopeningRequest, Zone,
} from './schemas';

import { dummyHash, generatePassword, hashPassword, verifyPassword } from './password';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const alerts = z.array(AlertSchema).parse(alertsJson);
const clock = DemoClockSchema.parse(clockJson);

/**
 * D231 : heure du jour à Paris (HH:MM), seule lecture de l'horloge du poste : le jour reste celui de l'horloge de démonstration.
 * `format()` sans argument lit l'instant courant. Remplaçable en test ; sans argument, `setTimeSource` rétablit cette lecture.
 */
const parisTime = (): string =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format();
let timeSource: () => string = parisTime;
export function setTimeSource(fn?: () => string): void {
  timeSource = fn ?? parisTime;
}
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const stores = z.array(StoreSchema).parse(storesJson);
const campaigns = z.array(CampaignSchema).parse(campaignsJson);
const weekClosures = z.array(WeekClosureSchema).parse(weekClosuresJson);
/** Tarifs horaires FICTIFS datés (D06 ouvert) : jamais modifiés en démonstration. */
const rates = z.array(RateSchema).parse(ratesJson);

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
  batchDrafts: Partial<Record<string, BatchDraft>>;
  outbox: Record<string, 'validated' | 'discarded'>;
  homeSkinDefault: HomeSkin;
  userSkins: Record<string, HomeSkin>;
  accounts: Account[];
  // Lot A3
  recruitments: Recruitment[];
  proposals: Proposal[];
  decisions: Decision[];
  notes: Note[];
  pipelineParams: PipelineParams;
  // Lot A3c
  delegations: Delegation[];
  // Lot A4b1 : enveloppe cliente versionnée, allocations de l'agence, repères pour tracer les dépassements et les déplacements d'imputation.
  envelopes: EnvelopeVersion[];
  allocations: AllocationLine[];
  budgetBaseline: boolean;
  budgetFlags: Record<string, true>;
  imputations: Record<string, ImputationSnapshot>;
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
      accounts: structuredClone(z.array(AccountSchema).parse(accountsJson)),
      recruitments: structuredClone(z.array(RecruitmentSchema).parse(recruitmentsJson)),
      proposals: structuredClone(z.array(ProposalSchema).parse(proposalsJson)),
      decisions: structuredClone(z.array(DecisionSchema).parse(decisionsJson)),
      notes: structuredClone(z.array(NoteSchema).parse(notesJson)),
      pipelineParams: { ...DEFAULT_PIPELINE_PARAMS },
      delegations: structuredClone(z.array(DelegationSchema).parse(delegationsJson)),
      envelopes: structuredClone(z.array(EnvelopeVersionSchema).parse(envelopesJson)),
      allocations: structuredClone(z.array(AllocationLineSchema).parse(allocationsJson)),
      budgetBaseline: false,
      budgetFlags: {},
      imputations: {},
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

/** Profils qui saisissent des besoins (A3d) : la matrice est dans `domain/entry-rights.ts`. */
const WRITE_PROFILES: readonly ProfileId[] = ENTRY_PROFILES.filter((p) => canEnterNeeds(p));
/** Nouvelle soumission d'un besoin refusé : l'auteur côté terrain ou l'agence. */
const RESUBMITTERS: readonly ProfileId[] = ['rs', 'agency_operator', 'agency_admin'];

function emit(code: EventCode, actor: ProfileId, zoneId: string, needId: string | null, audience: Audience, data: BusinessEvent['data'], effectDate: string = clock.date) {
  const st = state();
  st.events.push({
    id: crypto.randomUUID(), code, actor_profile: actor, zone_id: zoneId, need_id: needId,
    effect_date: effectDate, recorded_at: clock.date, seq: ++st.seq, audience, data, is_demo: true,
  });
}

const anyDrZone = () => (zones.find((z) => z.kind === 'dr') as Zone).id;

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
/** Le choix de skin suit la personne (son compte) ; en visualisation d'un profil par le prestataire, il suit ce profil. */
/** Brouillon de saisie en lot : rattaché au compte (et au profil consulté en visualisation), jamais partagé entre comptes (hypothèse 8 du lot A1f). */
const draftKey = (ctx: AccessContext) => (ctx.accountId ? `${ctx.accountId}:${ctx.profileId}` : `profil:${ctx.profileId}`);
const skinKey = (ctx: AccessContext) => (ctx.accountId && !ctx.impersonated ? ctx.accountId : `profil:${ctx.profileId}`);
const publicOf = (a: Account): PublicAccount => ({
  id: a.id, username: a.username, profile: a.profile, scope: a.scope, first_name: a.first_name, active: a.active,
  must_change_password: a.must_change_password, created_by: a.created_by, is_demo: a.is_demo,
});
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

// ---------------------------------------------------------------------------------------------
// Lot A3 : circuit besoin, proposition, décision, recrutement. Les règles sont dans domain/pipeline.ts ; ici, droits,
// filtrage par audience et périmètre, écritures et journal.
// ---------------------------------------------------------------------------------------------
const AGENCY_WRITERS: readonly ProfileId[] = ['agency_operator', 'agency_admin'];
const DECIDERS: readonly ProfileId[] = ['direction_client', 'dr_client', 'cvr_client'];
/** Prise de poste et remise du véhicule : l'agence ou le RS de son secteur (F-30.8). */
const FIELD_STEPS: readonly RecruitmentStep[] = ['start_work', 'vehicle_handover'];
const calOf = () => calendarOf(state().settings);

/**
 * Contexte avec le périmètre effectif d'un suppléant (F-30.3) : son périmètre, plus celui de chaque délégant en cours, jamais davantage.
 * Les lectures et les écritures de la chaîne managériale s'appuient dessus ; l'autorité (qui agit, pour qui) se juge sur le contexte
 * d'origine, afin de tracer qu'une personne agit comme suppléante.
 */
const eff = (ctx: AccessContext): AccessContext => {
  const scope = effectiveScope(ctx.scope, state().delegations, clock.date);
  return scope === ctx.scope ? ctx : { ...ctx, scope };
};

/**
 * Point d'entrée « hors enveloppe » (D43 ouverte). Par défaut, la règle de A4b1 (hypothèse, à valider) : un besoin est « hors enveloppe » quand
 * il fait dépasser le montant alloué à sa maille (campagne, CVR). Coût inconnu ou maille sans allocation : « non évalué », jamais « dans ».
 * Une fonction posée par un test remplace la règle ; sans argument, retour à la règle par défaut.
 */
let envelopeOverride: EnvelopeEvaluator | null = null;
export function setEnvelopeEvaluator(fn?: EnvelopeEvaluator): void {
  envelopeOverride = fn ?? null;
}
const envelopeEvaluator: EnvelopeEvaluator = (need) => (envelopeOverride ?? ((n) => envelopeStatusOf(budgetStatuses().get(n.id))))(need);

const recruitmentOf = (needId: string): Recruitment => state().recruitments.find((r) => r.need_id === needId) ?? blankRecruitment(needId);
function ensureRecruitment(needId: string): Recruitment {
  const st = state();
  let r = st.recruitments.find((x) => x.need_id === needId);
  if (!r) {
    r = blankRecruitment(needId);
    st.recruitments.push(r);
  }
  return r;
}

/** Date de soumission : première soumission au journal (EV-02), sinon création du besoin. */
function submittedOn(n: Need): string {
  const first = state().events.filter((e) => e.code === 'EV-02' && e.need_id === n.id).sort((a, b) => a.seq - b.seq)[0];
  return first?.effect_date ?? n.created_at;
}

/** La cliente ne voit jamais une proposition en cours de préparation (brouillon de l'agence). */
const visibleProposals = (ctx: AccessContext, needId: string): Proposal[] =>
  state().proposals.filter((p) => p.need_id === needId && (ctx.side !== 'client' || p.status !== 'in_progress'));

/** Le chiffrage est réservé à l'agence (D108) : nul dans la vue de la cliente. */
const presentProposal = (ctx: AccessContext, p: Proposal): Proposal => (ctx.side === 'client' ? { ...p, cost_status: null } : p);

function factsOf(needId: string, clientView: boolean): Facts {
  const st = state();
  const proposals = st.proposals.filter((p) => p.need_id === needId && (!clientView || p.status !== 'in_progress'));
  return { recruitment: recruitmentOf(needId), proposals, decisions: st.decisions.filter((d) => d.need_id === needId) };
}

function withPositionStatus(ctx: AccessContext, n: Need): Need {
  const status = n.need_state === 'submitted' ? positionStatus(factsOf(n.id, ctx.side === 'client'), clock.date) : null;
  return status === n.position_status ? n : { ...n, position_status: status };
}

function rowFor(ctx: AccessContext, n: Need): PipelineRow {
  const client = ctx.side === 'client';
  const facts = factsOf(n.id, client);
  const today = clock.date;
  const sub = submittedOn(n);
  const span = n.periods.map(resolvePeriod).find((p) => p.start)?.start ?? null;
  const sentNow = sentProposal(facts.proposals);
  const changed = sentNow ? needChangedSince(n, sentNow) : false;
  let next = nextStep({ ...facts, needState: n.need_state, submittedOn: sub, requestedStart: span, needChanged: changed }, today, state().pipelineParams, calOf());
  // Le retard interne de l'agence n'est pas communiqué à la cliente (D108) : elle sait qui doit agir, pas l'échéance interne.
  if (client && next.actor === 'agency') next = { ...next, due: null, urgency: null, lateDays: 0 };
  const proposal = (client ? sentProposal(facts.proposals) : null) ?? activeProposal(facts.proposals) ?? [...facts.proposals].sort((a, b) => b.version - a.version)[0] ?? null;
  const sent = sentProposal(facts.proposals);
  const rec = facts.recruitment;
  const from = rec.reassigned_from_sector_id;
  const recruitment: Recruitment = from && !zoneInScope(zones, from, eff(ctx).scope) ? { ...rec, reassigned_from_sector_id: null } : rec;
  return {
    need: withPositionStatus(ctx, n),
    recruitment,
    funnel: n.need_state === 'submitted' ? funnelState(facts, today) : null,
    positionStatus: n.need_state === 'submitted' ? positionStatus(facts, today) : null,
    execution: n.need_state === 'submitted' ? executionStatus(facts, today) : null,
    proposal: proposal ? presentProposal(ctx, proposal) : null,
    decision: proposal ? validDecisionOn(proposal.id, facts.decisions) : null,
    proposalCount: facts.proposals.length,
    next,
    submittedOn: sub,
    billableFrom: client ? null : billableFrom(rec),
    needChanged: sent ? needChangedSince(n, sent) : false,
    validation: validationViewOf(ctx, n, rec),
  };
}

/** Autorité exercée par ce profil sur ce besoin, délégations comprises : calculée ici, jamais par l'écran. */
const authorityOf = (ctx: AccessContext, need: Need, rec: Recruitment) =>
  need.need_state === 'submitted' && !isClosedRecruitment(rec)
    ? authorityFor(ctx.profileId, ctx.scope, need.sector_id, rec.validation, zones, state().delegations, clock.date)
    : null;

function validationViewOf(ctx: AccessContext, need: Need, rec: Recruitment): ValidationView {
  const auth = authorityOf(ctx, need, rec);
  const cvr = cvrZoneOf(zones, need.sector_id);
  const refs = new Set<string>();
  if (cvr) refs.add(cvr.id);
  const dr = drZoneOf(zones, need.sector_id);
  if (dr) refs.add(dr.id);
  for (const e of rec.validation_log) for (const id of [e.zone_id, e.by_zone_id, e.other_zone_id]) if (id) refs.add(id);
  if (rec.escalation?.other_zone_id) refs.add(rec.escalation.other_zone_id);
  const siblingCvrs = auth?.level === 'cvr' && dr ? zones.filter((z) => z.kind === 'cvr' && z.parent_id === dr.id && z.id !== cvr?.id) : [];
  return {
    state: rec.validation,
    round: rec.validation_round,
    since: rec.validation_on,
    escalation: rec.escalation,
    log: rec.validation_log,
    canAct: auth ? { level: auth.level, zoneId: auth.zoneId, byZoneId: auth.byZoneId } : null,
    canResubmit: need.need_state === 'submitted' && canResubmit(rec) && !isClosedRecruitment(rec) && (RESUBMITTERS.includes(ctx.profileId)) && zoneInScope(zones, need.sector_id, eff(ctx).scope),
    zones: Object.fromEntries(zones.filter((z) => refs.has(z.id)).map((z) => [z.id, z])),
    siblingCvrs,
    envelope: envelopeEvaluator(need),
  };
}

function needOfObject(kind: NoteObjectKind, id: string): Need | undefined {
  const st = state();
  const needId = kind === 'proposal' ? st.proposals.find((p) => p.id === id)?.need_id : st.decisions.find((d) => d.id === id)?.need_id;
  return needId ? st.needs.find((n) => n.id === needId) : undefined;
}

function noteReadable(ctx: AccessContext, n: Note): boolean {
  const recipient = n.recipient_zone_id ? zones.find((z) => z.id === n.recipient_zone_id) ?? null : null;
  return noteVisibleTo(n, { side: ctx.side, scope: ctx.scope }, zoneInScope(zones, n.sector_id, ctx.scope), recipient);
}

/** Vrai pour une note de proposition en préparation lue par la cliente : le brouillon n'existe pas de son côté. */
const onHiddenDraft = (ctx: AccessContext, n: Note): boolean =>
  ctx.side === 'client' && n.object_kind === 'proposal' && state().proposals.find((p) => p.id === n.object_id)?.status === 'in_progress';

/**
 * Audience de l'événement d'une note : l'interne et le partage avec un destinataire restent à l'agence (l'existence d'une
 * note adressée à un seul destinataire ne se lit pas dans le journal des autres) ; le partage avec la cliente est commun.
 */
const noteEventAudience = (v: NoteVisibility): Audience => (v === 'shared_client' ? 'both' : 'agency');

/** Invalide les décisions valides d'une proposition ; rien n'est effacé, la décision reste au dossier (EV-12). */
function invalidateDecisions(ctx: AccessContext, need: Need, proposal: Proposal, reason: InvalidationReason, byProposalId: string | null): number {
  let n = 0;
  for (const d of state().decisions.filter((x) => x.proposal_id === proposal.id && x.status === 'valid')) {
    d.status = 'invalidated';
    d.invalidated_on = clock.date;
    d.invalidated_reason = reason;
    d.invalidated_by_proposal_id = byProposalId;
    emit('EV-12', ctx.profileId, need.sector_id, need.id, 'both', { need_code: need.need_code, version: d.version, reason });
    n += 1;
  }
  return n;
}

/** Un besoin soumis a été modifié : toute décision prise sur une proposition qui ne le suit plus est invalidée. */
function reconcileAfterNeedChange(ctx: AccessContext, need: Need) {
  const sent = sentProposal(state().proposals.filter((p) => p.need_id === need.id));
  if (sent && needChangedSince(need, sent)) invalidateDecisions(ctx, need, sent, 'need_changed', null);
}

async function saveProposalImpl(ctx: AccessContext, needId: string, raw: ProposalInput, send: boolean): Promise<ProposalResult> {
  const st = state();
  if (!AGENCY_WRITERS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
  const need = st.needs.find((n) => n.id === needId);
  if (!need || !zoneInScope(zones, need.sector_id, ctx.scope)) return { status: 'refused', reason: 'not_found' };
  const rec = recruitmentOf(need.id);
  if (need.need_state !== 'submitted' || rec.intake !== 'taken' || isClosedRecruitment(rec)) return { status: 'refused', reason: 'not_ready' };
  const parsed = ProposalInputSchema.safeParse(raw);
  if (!parsed.success || !isValidIsoDate(parsed.data.start_date) || !isValidIsoDate(parsed.data.end_date)) return { status: 'refused', reason: 'invalid' };
  const input = parsed.data;
  const allowed = stores.filter((s) => s.sector_id === need.sector_id || s.sector_id === null);
  if (!input.store_codes.every((c) => allowed.some((s) => s.code === c))) return { status: 'refused', reason: 'invalid_store' };

  const all = st.proposals.filter((p) => p.need_id === need.id);
  const latestSent = sentProposal(all);
  if (send) {
    // Une version identique à la précédente est refusée, sauf si le besoin a changé depuis (elle le confirme alors).
    const stale = latestSent ? needChangedSince(need, latestSent) : false;
    const issues = proposalIssues(need, input, stale ? undefined : latestSent ?? undefined);
    if (issues.length > 0) return { status: 'refused', reason: 'issues', issues };
  }

  let target = all.find((p) => p.status === 'in_progress');
  const fields = {
    ...input, deviations: computeDeviations(need, input), deviation_note: input.deviation_note?.trim() || null,
    hours_slot: input.hours_slot?.trim() || null,
  };
  if (target) {
    Object.assign(target, fields);
  } else {
    target = {
      id: crypto.randomUUID(), need_id: need.id, version: all.reduce((m, p) => Math.max(m, p.version), 0) + 1, status: 'in_progress', ...fields,
      author_profile: ctx.profileId, created_on: clock.date, sent_on: null,
      due_on: addWorkingDays(submittedOn(need), st.pipelineParams.proposal_due_days, calOf()), withdrawn_on: null, withdrawn_motive: null, is_demo: true,
    };
    st.proposals.push(target);
  }
  if (!send) return { status: 'saved', proposal: target, sent: false, invalidated: 0 };

  let invalidated = 0;
  if (latestSent) {
    latestSent.status = 'superseded';
    invalidated = invalidateDecisions(ctx, need, latestSent, 'new_version', target.id);
  }
  // Envoyer une proposition suppose une recherche commencée : si elle ne l'était pas, elle l'est, et le journal le dit.
  const recruitment = ensureRecruitment(need.id);
  if (!recruitment.search_started_on) {
    recruitment.search_started_on = clock.date;
    emit('EV-13', ctx.profileId, need.sector_id, need.id, 'both', { need_code: need.need_code, implicit: true });
  }
  target.status = 'proposed';
  target.sent_on = clock.date;
  emit('EV-10', ctx.profileId, need.sector_id, need.id, 'both', { need_code: need.need_code, version: target.version, deviations: target.deviations.length });
  return { status: 'saved', proposal: target, sent: true, invalidated };
}

const isClosedRecruitment = (r: Recruitment) => r.intake === 'rejected' || r.stopped !== null;

function decideOne(ctx: AccessContext, proposalId: string, input: DecisionInput): MutationResult<DecisionRefusal> {
  if (!DECIDERS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
  const st = state();
  const p = st.proposals.find((x) => x.id === proposalId);
  const need = p && st.needs.find((n) => n.id === p.need_id);
  // Un brouillon n'existe pas pour la cliente : même réponse qu'une proposition inconnue.
  if (!p || !need || p.status === 'in_progress' || !zoneInScope(zones, need.sector_id, eff(ctx).scope)) return { status: 'refused', reason: 'not_found' };
  if (!(DECISION_OUTCOMES as readonly string[]).includes(input.outcome)) return { status: 'refused', reason: 'invalid' };
  const motive = (input.motive ?? '').trim();
  if (motive.length > 280) return { status: 'refused', reason: 'invalid' };
  if (input.outcome !== 'approved' && !motive) return { status: 'refused', reason: 'motive_required' };
  // Un besoin stoppé ou rejeté est sorti du circuit : ses propositions ne se décident plus.
  if (p.status !== 'proposed' || isClosedRecruitment(recruitmentOf(need.id))) return { status: 'refused', reason: 'not_decidable' };
  if (validDecisionOn(p.id, st.decisions)) return { status: 'refused', reason: 'already_decided' };
  st.decisions.push({
    id: crypto.randomUUID(), proposal_id: p.id, need_id: need.id, version: p.version, outcome: input.outcome, motive: motive || null, status: 'valid',
    decided_by: ctx.profileId, decided_on: clock.date, decided_time: timeSource(), invalidated_on: null, invalidated_reason: null, invalidated_by_proposal_id: null, is_demo: true,
  });
  if (input.outcome === 'refused') ensureRecruitment(need.id).refusal_count += 1;
  emit('EV-11', ctx.profileId, need.sector_id, need.id, 'both', { need_code: need.need_code, version: p.version, outcome: input.outcome });
  return { status: 'ok' };
}

function recordStepImpl(ctx: AccessContext, needId: string, step: RecruitmentStep, input: StepInput): MutationResult<StepRefusal> {
  const agency = AGENCY_WRITERS.includes(ctx.profileId);
  if (!agency && !(ctx.profileId === 'rs' && FIELD_STEPS.includes(step))) return { status: 'refused', reason: 'forbidden' };
  const st = state();
  const need = st.needs.find((n) => n.id === needId);
  if (!need || !zoneInScope(zones, need.sector_id, ctx.scope)) return { status: 'refused', reason: 'not_found' };
  const today = clock.date;
  const date = input.date ?? today;
  if (!isValidIsoDate(date)) return { status: 'refused', reason: 'invalid' };
  const rec = recruitmentOf(need.id);
  if (need.need_state !== 'submitted' || rec.intake !== 'taken') return { status: 'refused', reason: 'not_taken' };
  if (isClosedRecruitment(rec)) return { status: 'refused', reason: 'closed' };
  const motive = (input.motive ?? '').trim();
  if (motive.length > 280) return { status: 'refused', reason: 'invalid' };
  const sent = sentProposal(st.proposals.filter((p) => p.need_id === need.id));
  const accord = sent ? validDecisionOn(sent.id, st.decisions) : null;
  const target = ensureRecruitment(need.id);
  const base = { need_code: need.need_code };
  const pastOnly = (d: string) => d <= today;

  switch (step) {
    case 'start_search':
      if (target.search_started_on && !target.exits.length) return { status: 'refused', reason: 'already' };
      if (!pastOnly(date)) return { status: 'refused', reason: 'invalid' };
      target.search_started_on = date;
      emit('EV-13', ctx.profileId, need.sector_id, need.id, 'both', base, date);
      return { status: 'ok' };
    case 'hired':
      if (accord?.outcome !== 'approved') return { status: 'refused', reason: 'no_accord' };
      if (target.hired_on) return { status: 'refused', reason: 'already' };
      if (!pastOnly(date) || date < accord.decided_on) return { status: 'refused', reason: 'invalid' };
      target.hired_on = date;
      emit('EV-14', ctx.profileId, need.sector_id, need.id, 'both', { ...base, date }, date);
      return { status: 'ok' };
    case 'training':
      if (!target.hired_on) return { status: 'refused', reason: 'not_hired' };
      if (!pastOnly(date) || date < target.hired_on) return { status: 'refused', reason: 'invalid' };
      target.training_on = date;
      emit('EV-15', ctx.profileId, need.sector_id, need.id, 'both', { ...base, date }, date);
      return { status: 'ok' };
    case 'start_work':
      if (!target.hired_on) return { status: 'refused', reason: 'not_hired' };
      // La prise de poste peut être planifiée ; « En poste » n'apparaît qu'à la date atteinte.
      if (date < target.hired_on || date > addDays(today, 365)) return { status: 'refused', reason: 'invalid' };
      if (input.time && !TIME_RE.test(input.time)) return { status: 'refused', reason: 'invalid' };
      target.start_work_date = date;
      target.start_work_time = input.time || null;
      emit('EV-16', ctx.profileId, need.sector_id, need.id, 'both', { ...base, date }, date);
      return { status: 'ok' };
    case 'vehicle_handover':
      // Événement distinct de la prise de poste (D11) : il ne change ni l'état de l'entonnoir ni le statut de poste.
      if (!target.hired_on) return { status: 'refused', reason: 'not_hired' };
      if (date < target.hired_on || date > addDays(today, 365)) return { status: 'refused', reason: 'invalid' };
      target.vehicle_handover_date = date;
      emit('EV-17', ctx.profileId, need.sector_id, need.id, 'both', { ...base, date }, date);
      return { status: 'ok' };
    case 'reassign': {
      const from = zones.find((z) => z.id === input.fromSectorId && z.kind === 'rs' && z.id !== need.sector_id);
      if (!from) return { status: 'refused', reason: 'invalid_sector' };
      target.situation = 'reassigned';
      target.reassigned_from_sector_id = from.id;
      // Le secteur d'origine ne figure pas dans le journal : il pourrait être hors du périmètre du lecteur.
      emit('EV-18', ctx.profileId, need.sector_id, need.id, 'both', base);
      return { status: 'ok' };
    }
    case 'stop':
      if (!motive) return { status: 'refused', reason: 'motive_required' };
      target.stopped = { reason: motive, on: today };
      emit('EV-19', ctx.profileId, need.sector_id, need.id, 'both', base);
      return { status: 'ok' };
    case 'white_zone':
      if (target.situation === 'white_zone') return { status: 'refused', reason: 'already' };
      target.situation = 'white_zone';
      target.white_zone_since = today;
      emit('EV-20', ctx.profileId, need.sector_id, need.id, 'both', { ...base, action: 'declared' });
      return { status: 'ok' };
    case 'lift_white_zone':
      if (target.situation !== 'white_zone') return { status: 'refused', reason: 'already' };
      target.situation = 'new';
      target.white_zone_since = null;
      emit('EV-20', ctx.profileId, need.sector_id, need.id, 'both', { ...base, action: 'lifted' });
      return { status: 'ok' };
    case 'withdrawal': {
      if (!target.search_started_on && !target.hired_on && !sent) return { status: 'refused', reason: 'nothing_to_withdraw' };
      if (!pastOnly(date)) return { status: 'refused', reason: 'invalid' };
      // Un poste déjà démarré est une rupture ; avant, un désistement. Les deux ramènent à « En recrutement » (D97).
      const kind = target.start_work_date && target.start_work_date <= today ? 'termination' : 'withdrawal';
      target.exits.push({ kind, on: date, hired_on: target.hired_on, start_work_date: target.start_work_date });
      target.withdrawal_count += 1;
      target.hired_on = null;
      target.training_on = null;
      target.start_work_date = null;
      target.start_work_time = null;
      target.vehicle_handover_date = null;
      target.search_started_on = date;
      if (sent) {
        sent.status = 'withdrawn';
        sent.withdrawn_on = date;
        sent.withdrawn_motive = motive || null;
        invalidateDecisions(ctx, need, sent, 'withdrawn', null);
        emit('EV-45', ctx.profileId, need.sector_id, need.id, 'both', { ...base, version: sent.version, cause: kind }, date);
      }
      emit('EV-21', ctx.profileId, need.sector_id, need.id, 'both', { ...base, kind }, date);
      return { status: 'ok' };
    }
    default:
      return { status: 'refused', reason: 'invalid' };
  }
}

/**
 * Alertes dérivées à la lecture (aucun planificateur en démonstrateur). Calculées sur la vue interne du périmètre, puis
 * filtrées par audience dans la couche de données : une alerte d'agence n'atteint jamais la cliente (D108).
 */
function pipelineAlerts(ctx: AccessContext): PipelineAlert[] {
  const st = state();
  const today = clock.date;
  const needs = st.needs.filter((n) => n.need_state === 'submitted' && zoneInScope(zones, n.sector_id, ctx.scope));
  const rows = needs.map((n) => ({ n, f: factsOf(n.id, false) })).map(({ n, f }) => ({
    n, f, next: nextStep({
      ...f, needState: n.need_state, submittedOn: submittedOn(n), requestedStart: n.periods.map(resolvePeriod).find((p) => p.start)?.start ?? null,
      needChanged: (() => { const s = sentProposal(f.proposals); return s ? needChangedSince(n, s) : false; })(),
    }, today, st.pipelineParams, calOf()),
  }));
  const out: PipelineAlert[] = [];
  const push = (key: PipelineAlert['message_key'], audience: Audience, severity: Severity, n: number, extra: Record<string, number> = {}) => {
    if (n > 0) out.push({ id: `pipeline:${key}`, audience, severity, message_key: key, params: { n, ...extra }, created_at: today });
  };
  const PROPOSAL_ACTIONS = ['prepare_proposal', 'send_proposal', 'new_proposal', 'revise_proposal'];
  push('proposalLate', 'agency', 'attention', rows.filter((r) => PROPOSAL_ACTIONS.includes(r.next.action) && r.next.urgency === 'overdue').length);
  push('qualifyLate', 'agency', 'attention', rows.filter((r) => r.next.action === 'qualify' && r.next.urgency === 'overdue').length);
  const costing = st.proposals.filter((p) => (p.status === 'in_progress' || p.status === 'proposed') && p.cost_status !== 'complete' && needs.some((n) => n.id === p.need_id));
  push('costingIncomplete', 'agency', 'risk', costing.length);
  const pending = rows.filter((r) => r.next.action === 'decide');
  push('decisionsPending', 'client', 'attention', pending.length);
  push('decisionsLate', 'client', 'risk', pending.filter((r) => r.next.urgency === 'overdue').length);
  push('clarificationPending', 'both', 'attention', rows.filter((r) => r.next.action === 'clarify').length);
  push('accordLost', 'agency', 'attention', rows.filter((r) => r.next.action === 'reconfirm_proposal').length);
  push('startLate', 'both', 'attention', rows.filter((r) => r.next.action === 'start_work' && r.next.urgency === 'overdue').length);
  // A3c : chaîne managériale et délégations. Aucune notification réelle (A4g consommera ces alertes).
  // Avis managérial en attente : information pour la cliente et l'agence, jamais un blocage.
  const opinion = (state: string) => needs.map((n) => recruitmentOf(n.id)).filter((r) => r.validation === state && r.intake !== 'rejected' && !r.stopped);
  const pendingAvis = opinion('to_validate');
  push('validationPending', 'both', 'info', pendingAvis.length);
  push('validationLate', 'both', 'attention', pendingAvis.filter((r) => addWorkingDays(r.validation_on ?? today, st.pipelineParams.validate_due_days, calOf()) < today).length);
  push('escalationPending', 'both', 'attention', opinion('escalated').length);
  push('resubmitPending', 'both', 'info', opinion('refused').length);
  // Une délégation qui se termine bientôt ne concerne que l'agence, qui la paramètre (audience agence, défaut refus).
  const ending = st.delegations.filter((d) => delegationStatus(d, today) === 'active' && workingDaysBetween(today, d.end_date, calOf()) <= st.pipelineParams.urgent_within_days);
  if (ctx.scope.kind === 'all') push('delegationEnding', 'agency', 'info', ending.length);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Lot A4b1 : chaîne budgétaire (D153, D156). Les calculs sont dans domain/budget.ts ; ici, droits, périmètre, audience, écritures et journal.
// ---------------------------------------------------------------------------------------------
/** Lecture du budget : les profils qui ont l'entrée de menu Budget. Le RS et le CVR n'en lisent ni le détail, ni les alertes, ni le journal. */
const canReadBudgetCtx = (ctx: AccessContext): boolean => MENU_BY_PROFILE[ctx.profileId].includes('budget');
/** Les coûts (consommé, prévisionnel, atterrissage, disponible, coût par besoin) sont réservés à l'agence et au prestataire (D108, défaut refus). */
const canSeeCosts = (ctx: AccessContext): boolean => canReadBudgetCtx(ctx) && ctx.side !== 'client';
const eventReadable = (ctx: AccessContext, e: BusinessEvent): boolean => !(BUDGET_EVENT_CODES as readonly string[]).includes(e.code) || canReadBudgetCtx(ctx);

/** Besoins comptés au budget, avec leur coût estimé : vue interne complète, filtrée ensuite par périmètre et audience. */
function budgetNeeds(): BudgetNeed[] {
  return budgetNeedsOf({ needs: state().needs, zones, rates, today: clock.date, submittedOn, factsOf: (id) => factsOf(id, false) });
}
const budgetLines = () => linesOf(state().allocations);
function budgetStatuses(needs: BudgetNeed[] = budgetNeeds()): Map<string, BudgetStatus> {
  return classifyNeeds(needs, budgetLines());
}

/**
 * Repère de départ des événements budgétaires : l'imputation connue et les besoins déjà au-delà du disponible. Posé avant la première
 * écriture, sans événement (les fixtures portent déjà ceux de l'état initial).
 */
function ensureBudgetBaseline(): void {
  const st = state();
  if (st.budgetBaseline) return;
  const needs = budgetNeeds();
  const statuses = budgetStatuses(needs);
  st.imputations = snapshotOfNeeds(needs);
  st.budgetFlags = Object.fromEntries(needs.filter((n) => statuses.get(n.id) === 'beyond').map((n) => [n.id, true as const]));
  st.budgetBaseline = true;
}

/**
 * Après une écriture qui peut changer le budget : trace les déplacements d'imputation (EV-52, datés, agence) et les besoins qui passent
 * au-delà du disponible (EV-28, cliente et agence, sans montant, D156). Aucun blocage : l'écriture est déjà faite.
 */
function settleBudget(ctx: AccessContext, trigger: 'need' | 'allocation'): void {
  const st = state();
  const needs = budgetNeeds();
  const byId = new Map(needs.map((n) => [n.id, n]));
  for (const m of imputationMoves(st.imputations, needs)) {
    const n = byId.get(m.needId) as BudgetNeed;
    emit('EV-52', ctx.profileId, n.sectorId, n.id, 'agency', {
      need_code: n.code, kind: m.kind,
      from_campaign: m.from.campaign ?? 'none', to_campaign: m.to.campaign ?? 'none',
      from_cvr: m.from.cvrId ?? 'none', to_cvr: m.to.cvrId ?? 'none',
      ...(m.from.cents !== null ? { from_eur: fromCents(m.from.cents) } : {}), ...(m.to.cents !== null ? { to_eur: fromCents(m.to.cents) } : {}),
    });
  }
  st.imputations = snapshotOfNeeds(needs);
  const statuses = budgetStatuses(needs);
  const beyond = needs.filter((n) => statuses.get(n.id) === 'beyond');
  for (const n of beyond) {
    if (!st.budgetFlags[n.id]) emit('EV-28', ctx.profileId, n.sectorId, n.id, 'both', { need_code: n.code, campaign: n.campaign ?? 'none', trigger });
  }
  st.budgetFlags = Object.fromEntries(beyond.map((n) => [n.id, true as const]));
}

const campaignDispositifOf = (code: string): Dispositif => (campaigns.find((c) => c.code === code) as (typeof campaigns)[number]).dispositif;
const currentEnvelope = (): EnvelopeVersion | null => state().envelopes.reduce<EnvelopeVersion | null>((m, e) => (!m || e.version > m.version ? e : m), null);
const sumLines = (rows: readonly AllocationLine[]) => rows.reduce((s, l) => s + toCents(l.amount_eur_ht), 0);

/** Alertes budgétaires dérivées à la lecture. Les montants n'y figurent jamais : la cliente apprend qu'un besoin dépasse, pas ce que coûte l'agence. */
function budgetAlerts(ctx: AccessContext): BudgetAlert[] {
  const today = clock.date;
  const scoped = budgetNeeds().filter((n) => zoneInScope(zones, n.sectorId, ctx.scope));
  const statuses = budgetStatuses();
  const count = (status: BudgetStatus) => scoped.filter((n) => statuses.get(n.id) === status).length;
  const out: BudgetAlert[] = [];
  const push = (key: BudgetAlert['message_key'], audience: Audience, severity: Severity, n: number) => {
    if (n > 0) out.push({ id: `budget:${key}`, audience, severity, message_key: key, params: { n }, created_at: today });
  };
  push('needsBeyond', 'both', 'risk', count('beyond'));
  push('noBudget', 'agency', 'attention', count('no_budget'));
  push('unpriced', 'agency', 'attention', count('unpriced'));
  if (ctx.scope.kind === 'all' && !currentEnvelope()) push('envelopeMissing', 'both', 'info', 1);
  return out;
}


const DEADLINE_BLOCK_RULES: readonly string[] = ['E1', 'E2', 'P3', 'P4'];

/** Profils de la chaîne managériale cliente qui peuvent valider, refuser ou escalader (D45). */
const VALIDATORS: readonly ProfileId[] = ['direction_client', 'dr_client', 'cvr_client'];

/**
 * Validation, refus ou escalade d'un besoin (F-30.1, F-30.2). L'autorité se juge sur le contexte d'origine (qui agit, pour quelle zone,
 * par quelle délégation), la visibilité sur le périmètre effectif : un besoin hors périmètre est inconnu, jamais « interdit ».
 */
function validateOne(ctx: AccessContext, needId: string, input: ValidationInput): MutationResult<ValidationFailure> {
  if (!VALIDATORS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
  const st = state();
  const need = st.needs.find((n) => n.id === needId);
  if (!need || need.need_state !== 'submitted' || !zoneInScope(zones, need.sector_id, eff(ctx).scope)) return { status: 'refused', reason: 'not_found' };
  const rec = recruitmentOf(need.id);
  if (isClosedRecruitment(rec) || (rec.validation !== 'to_validate' && rec.validation !== 'escalated')) return { status: 'refused', reason: 'not_pending' };
  const auth = authorityOf(ctx, need, rec);
  if (!auth) return { status: 'refused', reason: 'forbidden' };
  const issue = validationIssue(input, auth.level, need, zones);
  if (issue) return { status: 'refused', reason: issue };

  const target = ensureRecruitment(need.id);
  const motive = (input.motive ?? '').trim() || null;
  const entry = {
    id: crypto.randomUUID(), round: target.validation_round, level: auth.level, by_profile: ctx.profileId, zone_id: auth.zoneId, by_zone_id: auth.byZoneId,
    delegation_id: auth.delegationId, reason: null, other_zone_id: null, trigger: null, motive, on: clock.date, time: timeSource(),
  };
  const common = { need_code: need.need_code, level: auth.level, round: target.validation_round, ...(auth.delegationId ? { delegated: true } : {}) };
  if (input.outcome === 'validate') {
    target.validation = 'validated';
    target.escalation = null;
    target.validation_log.push({ ...entry, action: 'validate' });
    // Le CVR valide (EV-06) ; le DR arbitre un besoin escaladé (EV-07).
    emit(auth.level === 'cvr' ? 'EV-06' : 'EV-07', ctx.profileId, need.sector_id, need.id, 'both', auth.level === 'cvr' ? common : { ...common, action: 'arbitrated' });
  } else if (input.outcome === 'refuse') {
    target.validation = 'refused';
    target.escalation = null;
    target.validation_log.push({ ...entry, action: 'refuse' });
    emit('EV-08', ctx.profileId, need.sector_id, need.id, 'both', common);
  } else {
    const reason = input.reason as NonNullable<ValidationInput['reason']>;
    const other = reason === 'arbitration' ? (input.otherZoneId as string) : null;
    target.validation = 'escalated';
    // Déclenchement manuel : la règle d'enveloppe n'est pas branchée (D43 ouverte, A4b1).
    target.escalation = { reason, other_zone_id: other, trigger: 'manual', motive: motive as string, on: clock.date };
    target.validation_log.push({ ...entry, action: 'escalate', reason, other_zone_id: other, trigger: 'manual' });
    emit('EV-07', ctx.profileId, need.sector_id, need.id, 'both', { ...common, action: 'escalated', reason });
  }
  target.validation_on = clock.date;
  return { status: 'ok' };
}

const SEVERITY_RANK: Record<Severity, number> = { risk: 0, attention: 1, info: 2 };

export function createMemoryRepository(): Repository {
  const repo: Repository = {
    async getMenu(ctx) {
      return MENU_BY_PROFILE[ctx.profileId].map((key) => ({ key, href: MENU_HREF[key] }));
    },

    async getScopeZones(ctx) {
      // Le suppléant lit les zones de son délégant pendant la délégation (F-30.3), pas davantage.
      const scope = eff(ctx).scope;
      if (scope.kind === 'all') return zones;
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
      return state().needs.filter((n) => zoneInScope(zones, n.sector_id, ctx.scope)).map((n) => withPositionStatus(ctx, n));
    },

    async getNeed(ctx, needId) {
      const n = state().needs.find((x) => x.id === needId);
      return n && zoneInScope(zones, n.sector_id, ctx.scope) ? withPositionStatus(ctx, n) : null;
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
        .filter((e) => audienceAllows(ctx.side, e.audience) && zoneInScope(zones, e.zone_id, ctx.scope) && eventReadable(ctx, e))
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

    async authenticate(username, password) {
      const found = state().accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
      // Un seul calcul de hachage dans tous les cas : un identifiant inconnu ne se distingue pas par le temps de calcul.
      const ok = verifyPassword(password, found?.password ?? dummyHash());
      return found && ok && found.active ? publicOf(found) : null;
    },

    async getAccount(accountId) {
      const found = state().accounts.find((a) => a.id === accountId);
      return found ? publicOf(found) : null;
    },

    async changePassword(accountId, current, next) {
      const found = state().accounts.find((a) => a.id === accountId);
      if (!found || !found.active) return { status: 'refused', reason: 'not_found' };
      if (!verifyPassword(current, found.password)) return { status: 'refused', reason: 'invalid_current' };
      const problem = passwordProblem(next, current);
      if (problem) return { status: 'refused', reason: problem };
      found.password = hashPassword(next);
      found.must_change_password = false;
      return { status: 'ok' };
    },

    canManageAccounts(ctx) {
      return isAgencyAdmin(ctx) && !ctx.impersonated;
    },

    async listAccounts(ctx) {
      if (!this.canManageAccounts(ctx)) return [];
      return state().accounts.map(publicOf);
    },

    async createAccount(ctx, input) {
      if (!this.canManageAccounts(ctx)) return { status: 'refused', reason: 'forbidden' };
      const st = state();
      const username = input.username.trim();
      if (!USERNAME_PATTERN.test(username) || !CREATABLE_PROFILES.includes(input.profile) || !validAssignment(zones, input.profile, input.scope)) {
        return { status: 'refused', reason: 'invalid' };
      }
      if (st.accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) return { status: 'refused', reason: 'username_taken' };
      const temporaryPassword = generatePassword();
      const account: Account = {
        id: crypto.randomUUID(), username, profile: input.profile, scope: input.scope, first_name: null, active: true,
        must_change_password: true, password: hashPassword(temporaryPassword), created_by: ctx.accountId ?? null, is_demo: true,
      };
      st.accounts.push(account);
      emit('EV-40', ctx.profileId, anyDrZone(), null, 'agency', { username, profile: input.profile, scope: input.scope.kind });
      return { status: 'ok', account: publicOf(account), temporaryPassword };
    },

    async setAccountActive(ctx, accountId, active) {
      if (!this.canManageAccounts(ctx)) return { status: 'refused', reason: 'forbidden' };
      const target = state().accounts.find((a) => a.id === accountId);
      if (!target) return { status: 'refused', reason: 'not_found' };
      if (target.profile === 'provider_admin') return { status: 'refused', reason: 'protected' };
      if (target.id === ctx.accountId) return { status: 'refused', reason: 'self' };
      if (target.active === active) return { status: 'ok' };
      target.active = active;
      emit('EV-42', ctx.profileId, anyDrZone(), null, 'agency', { username: target.username, active });
      return { status: 'ok' };
    },

    async assignAccount(ctx, accountId, input) {
      if (!this.canManageAccounts(ctx)) return { status: 'refused', reason: 'forbidden' };
      const target = state().accounts.find((a) => a.id === accountId);
      if (!target) return { status: 'refused', reason: 'not_found' };
      if (target.profile === 'provider_admin') return { status: 'refused', reason: 'protected' };
      if (!CREATABLE_PROFILES.includes(input.profile) || !validAssignment(zones, input.profile, input.scope)) return { status: 'refused', reason: 'invalid' };
      target.profile = input.profile;
      target.scope = input.scope;
      emit('EV-41', ctx.profileId, anyDrZone(), null, 'agency', { username: target.username, profile: input.profile, scope: input.scope.kind });
      return { status: 'ok' };
    },

    async resetAccountPassword(ctx, accountId) {
      if (!this.canManageAccounts(ctx)) return { status: 'refused', reason: 'forbidden' };
      const target = state().accounts.find((a) => a.id === accountId);
      if (!target) return { status: 'refused', reason: 'not_found' };
      if (target.profile === 'provider_admin') return { status: 'refused', reason: 'protected' };
      const temporaryPassword = generatePassword();
      target.password = hashPassword(temporaryPassword);
      target.must_change_password = true;
      emit('EV-43', ctx.profileId, anyDrZone(), null, 'agency', { username: target.username });
      return { status: 'ok', account: publicOf(target), temporaryPassword };
    },

    async getHomeSkin(ctx) {
      const st = state();
      const own = st.userSkins[skinKey(ctx)];
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
      state().userSkins[skinKey(ctx)] = skin;
      return { status: 'ok' };
    },

    // ---------------------------------------------------------------------------------------------
    // Lot A3
    // ---------------------------------------------------------------------------------------------
    async getPipeline(ctx) {
      const scope = eff(ctx).scope;
      return state().needs.filter((n) => zoneInScope(zones, n.sector_id, scope)).map((n) => rowFor(ctx, n));
    },

    async getNeedThread(ctx, needId) {
      const own = ctx;
      ctx = eff(ctx);
      const n = state().needs.find((x) => x.id === needId);
      if (!n || !zoneInScope(zones, n.sector_id, ctx.scope)) return null;
      const row = rowFor(own, n);
      const proposals = visibleProposals(ctx, n.id).map((p) => presentProposal(ctx, p)).sort((a, b) => b.version - a.version);
      const ids = new Set(proposals.map((p) => p.id));
      return {
        row,
        proposals,
        decisions: state().decisions.filter((d) => ids.has(d.proposal_id)).sort((a, b) => b.decided_on.localeCompare(a.decided_on)),
        events: (await this.getEvents(ctx)).filter((e) => e.need_id === n.id),
        stores: ctx.side === 'client' ? [] : stores.filter((s) => s.sector_id === n.sector_id || s.sector_id === null),
        // Une note rattachée à un brouillon de proposition reste à l'agence, quelle que soit sa visibilité.
        notes: state().notes.filter((x) => x.need_id === n.id && noteReadable(ctx, x) && !onHiddenDraft(ctx, x)).sort((a, b) => a.seq - b.seq),
      } satisfies NeedThread;
    },

    async getFunnelReport(ctx) {
      ctx = eff(ctx);
      const st = state();
      const rows = st.needs.filter((n) => n.need_state === 'submitted' && zoneInScope(zones, n.sector_id, ctx.scope));
      const funnelRows: FunnelRow[] = [];
      const samples: NonNullable<ReturnType<typeof delaySampleOf>>[] = [];
      const vacancies: FunnelReport['vacancies'] = [];
      const lags: NonNullable<ReturnType<typeof startLagSample>>[] = [];
      for (const n of rows) {
        const f = factsOf(n.id, ctx.side === 'client');
        const r = f.recruitment;
        funnelRows.push({
          state: funnelState(f, clock.date), situation: r.situation, closed: r.stopped ? 'stopped' : r.intake === 'rejected' ? 'rejected' : null,
          toQualify: r.intake === 'to_qualify' || r.intake === 'clarification', hours: n.weekly_hours, refusals: r.refusal_count, withdrawals: r.withdrawal_count,
          // Stoppé après sa prise de poste : les heures effectuées avant l'arrêt restent comptées (D211).
          performedBeforeStop: Boolean(r.stopped && r.hired_on && r.start_work_date && r.start_work_date <= r.stopped.on),
        });
        const lag = startLagSample(f, clock.date);
        if (lag) lags.push(lag);
        const sample = delaySampleOf({ ...f, submittedOn: submittedOn(n) });
        if (sample) samples.push(sample);
        if (r.situation === 'white_zone' && r.white_zone_since && r.intake === 'taken' && !r.stopped) {
          vacancies.push({ needId: n.id, days: daysBetween(r.white_zone_since, clock.date) });
        }
      }
      return { summary: funnelSummary(funnelRows), delays: delayStats(samples, st.pipelineParams.min_sample), startLags: startLagStats(lags, st.pipelineParams.min_sample), params: st.pipelineParams, vacancies };
    },

    async getPipelineAlerts(ctx) {
      return pipelineAlerts(eff(ctx)).filter((a) => audienceAllows(ctx.side, a.audience));
    },

    canQualify: (ctx) => AGENCY_WRITERS.includes(ctx.profileId),
    canPropose: (ctx) => AGENCY_WRITERS.includes(ctx.profileId),
    canDecide: (ctx) => DECIDERS.includes(ctx.profileId),
    canRecord: (ctx, step) => AGENCY_WRITERS.includes(ctx.profileId) || (ctx.profileId === 'rs' && FIELD_STEPS.includes(step)),
    canWriteNotes: (ctx) => AGENCY_WRITERS.includes(ctx.profileId),

    async qualifyNeed(ctx, needId, input) {
      if (!AGENCY_WRITERS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
      const need = state().needs.find((n) => n.id === needId);
      if (!need || !zoneInScope(zones, need.sector_id, ctx.scope)) return { status: 'refused', reason: 'not_found' };
      if (need.need_state !== 'submitted') return { status: 'refused', reason: 'not_submitted' };
      if (!['take', 'clarify', 'reject'].includes(input.outcome)) return { status: 'refused', reason: 'invalid' };
      const rec = recruitmentOf(need.id);
      if (rec.intake !== 'to_qualify' && rec.intake !== 'clarification') return { status: 'refused', reason: 'already' };
      // A3c : l'avis managérial est facultatif. Un avis refusé ne bloque pas : la prise en charge se confirme, et la trace le dit.
      const overRefused = input.outcome === 'take' && rec.validation === 'refused';
      if (overRefused && input.confirmRefusedAvis !== true) return { status: 'refused', reason: 'confirm_required' };
      const motive = (input.motive ?? '').trim();
      if (motive.length > 280) return { status: 'refused', reason: 'invalid' };
      if (input.outcome !== 'take' && !motive) return { status: 'refused', reason: 'motive_required' };
      const target = ensureRecruitment(need.id);
      target.intake = input.outcome === 'take' ? 'taken' : input.outcome === 'clarify' ? 'clarification' : 'rejected';
      target.intake_motive = input.outcome === 'take' ? null : motive;
      if (input.outcome === 'take') target.qualified_on = clock.date;
      emit('EV-09', ctx.profileId, need.sector_id, need.id, 'both', { need_code: need.need_code, outcome: input.outcome, ...(overRefused ? { over_refused_avis: true } : {}) });
      return { status: 'ok' };
    },

    async saveProposal(ctx, needId, input, options = {}) {
      return saveProposalImpl(ctx, needId, input, options.send === true);
    },

    async withdrawProposal(ctx, proposalId, motive) {
      if (!AGENCY_WRITERS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
      const st = state();
      const p = st.proposals.find((x) => x.id === proposalId);
      const need = p && st.needs.find((n) => n.id === p.need_id);
      if (!p || !need || !zoneInScope(zones, need.sector_id, ctx.scope)) return { status: 'refused', reason: 'not_found' };
      if (p.status === 'in_progress') {
        st.proposals = st.proposals.filter((x) => x.id !== p.id);
        return { status: 'ok' };
      }
      if (p.status !== 'proposed') return { status: 'refused', reason: 'not_withdrawable' };
      const reason = motive.trim();
      if (!reason || reason.length > 280) return { status: 'refused', reason: 'motive_required' };
      p.status = 'withdrawn';
      p.withdrawn_on = clock.date;
      p.withdrawn_motive = reason;
      invalidateDecisions(ctx, need, p, 'withdrawn', null);
      emit('EV-45', ctx.profileId, need.sector_id, need.id, 'both', { need_code: need.need_code, version: p.version });
      return { status: 'ok' };
    },

    async decideProposal(ctx, proposalId, input) {
      return decideOne(ctx, proposalId, input);
    },

    async decideBatch(ctx, proposalIds, input): Promise<BatchDecisionResult> {
      const items: BatchDecisionResult['items'] = [];
      for (const id of [...new Set(proposalIds)]) {
        const r = decideOne(ctx, id, input);
        items.push(r.status === 'ok' ? { proposalId: id, status: 'ok' } : { proposalId: id, status: 'refused', reason: r.reason });
      }
      const decided = items.filter((i) => i.status === 'ok').length;
      return { items, decided, refused: items.length - decided };
    },

    async recordStep(ctx, needId, step, input = {}) {
      return recordStepImpl(ctx, needId, step, input);
    },

    async getNotes(ctx, objectKind, objectId) {
      const need = needOfObject(objectKind, objectId);
      if (!need || !zoneInScope(zones, need.sector_id, ctx.scope)) return [];
      return state().notes.filter((n) => n.object_kind === objectKind && n.object_id === objectId && noteReadable(ctx, n) && !onHiddenDraft(ctx, n)).sort((a, b) => a.seq - b.seq);
    },

    async addNote(ctx, input) {
      if (!AGENCY_WRITERS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
      const need = needOfObject(input.objectKind, input.objectId);
      if (!need || !zoneInScope(zones, need.sector_id, ctx.scope)) return { status: 'refused', reason: 'not_found' };
      const text = String(input.text ?? '').trim();
      if (!text || text.length > 500 || !(NOTE_VISIBILITIES as readonly string[]).includes(input.visibility)) return { status: 'refused', reason: 'invalid' };
      // Partager exige une confirmation explicite ; l'interne est le défaut et n'en demande aucune.
      if (input.visibility !== 'agency_internal' && input.confirmShare !== true) return { status: 'refused', reason: 'confirm_required' };
      let recipient: string | null = null;
      if (input.visibility === 'shared_recipient') {
        const chain = new Set(lineage(zones, need.sector_id).map((z) => z.id));
        if (!input.recipientZoneId || !chain.has(input.recipientZoneId)) return { status: 'refused', reason: 'invalid_recipient' };
        recipient = input.recipientZoneId;
      }
      const st = state();
      st.notes.push({
        id: crypto.randomUUID(), object_kind: input.objectKind, object_id: input.objectId, need_id: need.id, sector_id: need.sector_id, text,
        visibility: input.visibility, recipient_zone_id: recipient, author_profile: ctx.profileId, created_on: clock.date,
        seq: st.notes.reduce((m, n) => Math.max(m, n.seq), 0) + 1, withdrawn_on: null, withdrawn_by: null, is_demo: true,
      });
      emit('EV-44', ctx.profileId, need.sector_id, need.id, noteEventAudience(input.visibility), { action: 'added', visibility: input.visibility, object: input.objectKind });
      return { status: 'ok' };
    },

    async withdrawNote(ctx, noteId) {
      if (!AGENCY_WRITERS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
      const note = state().notes.find((n) => n.id === noteId);
      if (!note || !zoneInScope(zones, note.sector_id, ctx.scope)) return { status: 'refused', reason: 'not_found' };
      if (note.withdrawn_on) return { status: 'refused', reason: 'already' };
      note.withdrawn_on = clock.date;
      note.withdrawn_by = ctx.profileId;
      emit('EV-44', ctx.profileId, note.sector_id, note.need_id, noteEventAudience(note.visibility), { action: 'withdrawn', visibility: note.visibility, object: note.object_kind });
      return { status: 'ok' };
    },

    // ---------------------------------------------------------------------------------------------
    // Lot A3c : validation managériale, escalade, délégations
    // ---------------------------------------------------------------------------------------------
    async validateNeed(ctx, needId, input) {
      return validateOne(ctx, needId, input);
    },

    async validateBatch(ctx, needIds, input): Promise<BatchValidationResult> {
      const items: BatchValidationResult['items'] = [];
      for (const id of [...new Set(needIds)]) {
        // L'escalade demande un cas et un motif par besoin : elle ne se fait pas en lot.
        const r = input.outcome === 'escalate' ? ({ status: 'refused', reason: 'invalid' } as const) : validateOne(ctx, id, input);
        items.push(r.status === 'ok' ? { needId: id, status: 'ok' } : { needId: id, status: 'refused', reason: r.reason });
      }
      const decided = items.filter((i) => i.status === 'ok').length;
      return { items, decided, refused: items.length - decided };
    },

    async resubmitNeed(ctx, needId) {
      if (!RESUBMITTERS.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
      const need = state().needs.find((n) => n.id === needId);
      if (!need || need.need_state !== 'submitted' || !zoneInScope(zones, need.sector_id, eff(ctx).scope)) return { status: 'refused', reason: 'not_found' };
      const rec = recruitmentOf(need.id);
      if (!canResubmit(rec) || isClosedRecruitment(rec)) return { status: 'refused', reason: 'not_refused' };
      const target = ensureRecruitment(need.id);
      target.validation = 'to_validate';
      target.validation_round += 1;
      target.validation_on = clock.date;
      target.escalation = null;
      target.validation_log.push({
        id: crypto.randomUUID(), round: target.validation_round, action: 'resubmit', level: 'author', by_profile: ctx.profileId, zone_id: null, by_zone_id: null,
        delegation_id: null, reason: null, other_zone_id: null, trigger: null, motive: null, on: clock.date, time: timeSource(),
      });
      emit('EV-47', ctx.profileId, need.sector_id, need.id, 'both', { need_code: need.need_code, round: target.validation_round });
      return { status: 'ok' };
    },

    async getDelegations(ctx): Promise<DelegationView[]> {
      const today = clock.date;
      const mine = ctx.scope.kind === 'cvr' || ctx.scope.kind === 'dr' ? ctx.scope.ids : null;
      const visible = state().delegations.filter((d) => {
        if (ctx.side !== 'client') return true;
        // La cliente lit les délégations où son périmètre est délégant ou suppléant : pas celles des autres.
        return Boolean(mine) && (mine?.includes(d.delegator_zone_id) || mine?.includes(d.substitute_zone_id));
      });
      return visible
        .map((d) => ({ ...d, status: delegationStatus(d, today), delegator: zones.find((z) => z.id === d.delegator_zone_id) as Zone, substitute: zones.find((z) => z.id === d.substitute_zone_id) as Zone }))
        .sort((a, b) => b.start_date.localeCompare(a.start_date) || a.id.localeCompare(b.id));
    },

    canManageDelegations: (ctx) => isAgencyAdmin(ctx),

    async createDelegation(ctx, input) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      if (!isValidIsoDate(input.startDate) || !isValidIsoDate(input.endDate)) return { status: 'refused', reason: 'invalid' };
      const issue = delegationIssue(
        { delegator_zone_id: input.delegatorZoneId, substitute_zone_id: input.substituteZoneId, start_date: input.startDate, end_date: input.endDate },
        zones, state().delegations, clock.date,
      );
      if (issue) return { status: 'refused', reason: issue };
      const st = state();
      const created: Delegation = {
        id: crypto.randomUUID(), delegator_zone_id: input.delegatorZoneId, substitute_zone_id: input.substituteZoneId, start_date: input.startDate, end_date: input.endDate,
        created_by: ctx.profileId, created_on: clock.date, revoked_on: null, revoked_by: null, is_demo: true,
      };
      st.delegations.push(created);
      emit('EV-46', ctx.profileId, created.delegator_zone_id, null, 'agency', {
        action: 'created', delegation: created.id, delegator_zone: created.delegator_zone_id, substitute_zone: created.substitute_zone_id,
        start: created.start_date, end: created.end_date,
      });
      return { status: 'ok' };
    },

    async revokeDelegation(ctx, delegationId) {
      if (!isAgencyAdmin(ctx)) return { status: 'refused', reason: 'forbidden' };
      const d = state().delegations.find((x) => x.id === delegationId);
      if (!d) return { status: 'refused', reason: 'not_found' };
      const status = delegationStatus(d, clock.date);
      if (status !== 'planned' && status !== 'active') return { status: 'refused', reason: 'not_revocable' };
      d.revoked_on = clock.date;
      d.revoked_by = ctx.profileId;
      emit('EV-46', ctx.profileId, d.delegator_zone_id, null, 'agency', {
        action: 'revoked', delegation: d.id, delegator_zone: d.delegator_zone_id, substitute_zone: d.substitute_zone_id, start: d.start_date, end: d.end_date,
      });
      return { status: 'ok' };
    },

    // ---------------------------------------------------------------------------------------------
    // Lot A4b1 : enveloppe cliente, allocation de l'agence, prévisionnel par besoin
    // ---------------------------------------------------------------------------------------------
    canReadBudget: (ctx) => canReadBudgetCtx(ctx),
    canSetEnvelope: (ctx) => ctx.profileId === 'direction_client',
    canAllocate: (ctx) => ctx.profileId === 'agency_admin',

    async getBudget(ctx) {
      ctx = eff(ctx);
      const empty: BudgetView = {
        envelopeVisible: false, envelope: null, allocated_cents: null, unallocated_cents: null, costsVisible: false, figures: null, lines: [],
        groups: { dispositif: [], dr: [], campaign: [], cvr: [] }, beyondCount: 0, noBudgetCount: null, unpricedCount: null,
      };
      if (!canReadBudgetCtx(ctx)) return empty;
      ensureBudgetBaseline();
      const costs = canSeeCosts(ctx);
      const st = state();
      const all = budgetNeeds();
      const statuses = budgetStatuses(all);
      const needs = all.filter((n) => zoneInScope(zones, n.sectorId, ctx.scope));
      const rows = st.allocations.filter((l) => zoneInScope(zones, l.cvr_id, ctx.scope));
      const zoneById = new Map(zones.map((z) => [z.id, z]));
      const drOf = (cvrId: string) => zoneById.get(zoneById.get(cvrId)?.parent_id ?? '') ?? null;
      const forLine = (l: AllocationLine) => needs.filter((n) => n.campaign === l.campaign_code && n.cvrId === l.cvr_id);
      const lines: BudgetLineView[] = rows
        .map((l) => ({
          id: l.id, campaign_code: l.campaign_code, dispositif: campaignDispositifOf(l.campaign_code), cvr: zoneById.get(l.cvr_id) as Zone, dr: drOf(l.cvr_id),
          allocated_cents: toCents(l.amount_eur_ht), revision: l.revision, updated_on: l.updated_on, updated_by_profile: l.updated_by_profile,
          figures: costs ? figuresOf(toCents(l.amount_eur_ht), forLine(l), statuses) : null,
        }))
        .sort((a, b) => a.campaign_code.localeCompare(b.campaign_code) || a.cvr.code.localeCompare(b.cvr.code));
      const group = (keyOfLine: (l: BudgetLineView) => string | null, keyOfNeed: (n: BudgetNeed) => string | null): BudgetGroup[] => {
        const keys = new Set<string>();
        for (const l of lines) { const k = keyOfLine(l); if (k) keys.add(k); }
        for (const n of needs) { const k = keyOfNeed(n); if (k) keys.add(k); }
        return [...keys].sort().map((key) => {
          const ls = lines.filter((l) => keyOfLine(l) === key);
          const allocated = ls.length === 0 ? null : ls.reduce((sum, l) => sum + l.allocated_cents, 0);
          return { key, allocated_cents: allocated, figures: costs ? figuresOf(allocated, needs.filter((n) => keyOfNeed(n) === key), statuses) : null };
        });
      };
      const envelope = ctx.scope.kind === 'all' ? currentEnvelope() : null;
      const allocatedTotal = allocatedSum(linesOf(rows));
      return {
        envelopeVisible: ctx.scope.kind === 'all',
        envelope,
        allocated_cents: allocatedTotal,
        unallocated_cents: envelope && ctx.scope.kind === 'all' ? toCents(envelope.amount_eur_ht) - sumLines(st.allocations) : null,
        costsVisible: costs,
        figures: costs ? figuresOf(allocatedTotal, needs, statuses) : null,
        lines,
        groups: {
          dispositif: group((l) => l.dispositif, (n) => n.dispositif),
          dr: group((l) => l.dr?.id ?? null, (n) => n.drId),
          campaign: group((l) => l.campaign_code, (n) => n.campaign),
          cvr: group((l) => l.cvr.id, (n) => n.cvrId),
        },
        beyondCount: needs.filter((n) => statuses.get(n.id) === 'beyond').length,
        noBudgetCount: costs ? needs.filter((n) => statuses.get(n.id) === 'no_budget').length : null,
        unpricedCount: costs ? needs.filter((n) => statuses.get(n.id) === 'unpriced').length : null,
      };
    },

    async getBudgetNeeds(ctx): Promise<BudgetNeedRow[]> {
      ctx = eff(ctx);
      if (!canSeeCosts(ctx)) return [];
      ensureBudgetBaseline();
      const all = budgetNeeds();
      const statuses = budgetStatuses(all);
      return all
        .filter((n) => zoneInScope(zones, n.sectorId, ctx.scope))
        .map((n) => ({
          needId: n.id, needCode: n.code, sectorId: n.sectorId, cvrId: n.cvrId, campaign: n.campaign, dispositif: n.dispositif, cost: n.cost,
          kind: n.started ? ('consumed' as const) : ('forecast' as const), status: statuses.get(n.id) as BudgetStatus,
        }))
        .sort((a, b) => a.needCode.localeCompare(b.needCode));
    },

    async getEnvelopeVersions(ctx) {
      if (!canReadBudgetCtx(ctx) || ctx.scope.kind !== 'all') return [];
      return [...state().envelopes].sort((a, b) => b.version - a.version);
    },

    async getBudgetRates(ctx) {
      return canSeeCosts(ctx) ? rates : [];
    },

    async getBudgetAlerts(ctx) {
      ctx = eff(ctx);
      if (!canReadBudgetCtx(ctx)) return [];
      ensureBudgetBaseline();
      return budgetAlerts(ctx).filter((a) => audienceAllows(ctx.side, a.audience));
    },

    async getBudgetEvents(ctx) {
      if (!canReadBudgetCtx(ctx)) return [];
      return state().events
        .filter((e) => (BUDGET_EVENT_CODES as readonly string[]).includes(e.code) && audienceAllows(ctx.side, e.audience) && zoneInScope(zones, e.zone_id, eff(ctx).scope))
        .sort((a, b) => b.seq - a.seq);
    },

    async setEnvelope(ctx, input) {
      if (ctx.profileId !== 'direction_client') return { status: 'refused', reason: 'forbidden' };
      const st = state();
      const current = currentEnvelope();
      const issue = envelopeIssue(input, current, sumLines(st.allocations), isValidIsoDate);
      if (issue) return { status: 'refused', reason: issue };
      const motive = (input.motive ?? '').trim();
      const created: EnvelopeVersion = {
        id: crypto.randomUUID(), version: (current?.version ?? 0) + 1, period_start: input.periodStart, period_end: input.periodEnd,
        amount_eur_ht: input.amountEur, currency: 'EUR', basis: 'HT', entered_by_profile: ctx.profileId, entered_on: clock.date,
        motive: motive || null, is_demo: true,
      };
      st.envelopes.push(created);
      // L'enveloppe nationale n'est lisible ni du DR ni du CVR : l'événement reste à l'agence, la direction lit son historique à l'écran.
      emit('EV-50', ctx.profileId, anyDrZone(), null, 'agency', {
        version: created.version, amount_eur: created.amount_eur_ht, period_start: created.period_start, period_end: created.period_end,
        ...(current ? { previous_eur: current.amount_eur_ht } : {}), ...(motive ? { motive } : {}),
      });
      return { status: 'ok' };
    },

    async saveAllocation(ctx, input) {
      if (ctx.profileId !== 'agency_admin') return { status: 'refused', reason: 'forbidden' };
      const st = state();
      const envelope = currentEnvelope();
      const issue = allocationIssue(input, envelope ? toCents(envelope.amount_eur_ht) : null, budgetLines(), {
        campaign: (code) => campaigns.some((c) => c.code === code),
        cvr: (id) => zones.some((z) => z.id === id && z.kind === 'cvr'),
      });
      if (issue) return { status: 'refused', reason: issue };
      const motive = (input.motive ?? '').trim();
      const existing = st.allocations.find((l) => l.campaign_code === input.campaign && l.cvr_id === input.cvrId);
      if (existing) {
        const previous = existing.amount_eur_ht;
        existing.amount_eur_ht = input.amountEur;
        existing.revision += 1;
        existing.updated_on = clock.date;
        existing.updated_by_profile = ctx.profileId;
        emit('EV-51', ctx.profileId, existing.cvr_id, null, 'both', {
          action: 'updated', campaign: existing.campaign_code, previous_eur: previous, amount_eur: existing.amount_eur_ht, revision: existing.revision, motive,
        });
      } else {
        st.allocations.push({
          id: crypto.randomUUID(), campaign_code: input.campaign, cvr_id: input.cvrId, amount_eur_ht: input.amountEur, currency: 'EUR', basis: 'HT',
          revision: 1, updated_on: clock.date, updated_by_profile: ctx.profileId, is_demo: true,
        });
        emit('EV-51', ctx.profileId, input.cvrId, null, 'both', {
          action: 'created', campaign: input.campaign, amount_eur: input.amountEur, revision: 1, ...(motive ? { motive } : {}),
        });
      }
      return { status: 'ok' };
    },

    async removeAllocation(ctx, lineId, motive) {
      if (ctx.profileId !== 'agency_admin') return { status: 'refused', reason: 'forbidden' };
      const st = state();
      const line = st.allocations.find((l) => l.id === lineId);
      if (!line) return { status: 'refused', reason: 'not_found' };
      const reason = (motive ?? '').trim();
      if (!reason || reason.length > 280) return { status: 'refused', reason: 'motive_required' };
      st.allocations = st.allocations.filter((l) => l.id !== lineId);
      emit('EV-51', ctx.profileId, line.cvr_id, null, 'both', {
        action: 'removed', campaign: line.campaign_code, previous_eur: line.amount_eur_ht, revision: line.revision + 1, motive: reason,
      });
      return { status: 'ok' };
    },

    async getBatchDraft(ctx) {
      return state().batchDrafts[draftKey(ctx)] ?? null;
    },

    async saveBatchDraft(ctx, rows) {
      if (!WRITE_PROFILES.includes(ctx.profileId)) return { status: 'refused', reason: 'forbidden' };
      state().batchDrafts[draftKey(ctx)] = { updated_on: clock.date, rows: BatchRowsSchema.parse(rows) };
      return { status: 'ok' };
    },

    async clearBatchDraft(ctx) {
      delete state().batchDrafts[draftKey(ctx)];
    },
  };

  // A4b1 : toute écriture qui peut changer le budget (besoin, qualification, validation, recrutement, enveloppe, allocation) est suivie
  // du calcul des déplacements d'imputation et des dépassements, tracés au journal. Le repère de départ est posé avant la première écriture.
  const WRITES_THAT_MOVE_BUDGET: Record<string, 'need' | 'allocation'> = {
    saveNeed: 'need', duplicateNeed: 'need', saveNeedsBatch: 'need', qualifyNeed: 'need', recordStep: 'need', validateNeed: 'need',
    validateBatch: 'need', resubmitNeed: 'need', saveProposal: 'need', withdrawProposal: 'need', decideProposal: 'need', decideBatch: 'need',
    setEnvelope: 'allocation', saveAllocation: 'allocation', removeAllocation: 'allocation',
  };
  const writable = repo as unknown as Record<string, (ctx: AccessContext, ...args: unknown[]) => Promise<unknown>>;
  for (const [name, trigger] of Object.entries(WRITES_THAT_MOVE_BUDGET)) {
    const original = (writable[name] as (ctx: AccessContext, ...args: unknown[]) => Promise<unknown>).bind(repo);
    writable[name] = async (ctx, ...args) => {
      ensureBudgetBaseline();
      const result = await original(ctx, ...args);
      settleBudget(ctx, trigger);
      return result;
    };
  }
  return repo;

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
      reconcileAfterNeedChange(ctx, mergeTarget);
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
        entered_by_profile: ctx.profileId, on_behalf: isOnBehalf(ctx.profileId),
        created_at: today, modified_at: today, record_version: 1, source_record_id: null, is_demo: true,
      };
      st.needs.push(saved);
      if (deferredFrom) markDeferred(ctx, sector.id, saved, deferredFrom);
      emit('EV-01', ctx.profileId, sector.id, saved.id, 'both', { need_code: saved.need_code, on_behalf: saved.on_behalf });
      // A3d : la saisie pour le compte d'un RS par l'agence a son événement distinct (qui, pour quel secteur, quand).
      if (saved.on_behalf) emit('EV-48', ctx.profileId, sector.id, saved.id, 'both', { need_code: saved.need_code });
    }
    if (state_ === 'submitted') {
      emit('EV-02', ctx.profileId, sector.id, saved.id, 'both', { need_code: saved.need_code, on_behalf: saved.on_behalf });
      // A3c : un besoin soumis entre dans la chaîne managériale cliente (CVR, puis DR sur escalade) avant la qualification de l'agence.
      const entering = ensureRecruitment(saved.id);
      entering.validation = 'to_validate';
      entering.validation_round = 1;
      entering.validation_on = today;
      // A3d : un CVR, un DR ou la direction qui saisit donne son avis à la saisie, sans passage par un supérieur.
      const level = opinionAtEntry(ctx.profileId);
      if (level) {
        const authority = level === 'cvr' ? cvrZoneOf(zones, sector.id) : drZoneOf(zones, sector.id);
        entering.validation = 'validated';
        entering.validation_log.push({
          id: crypto.randomUUID(), round: 1, action: 'validate', level, by_profile: ctx.profileId, zone_id: authority?.id ?? null, by_zone_id: null,
          delegation_id: null, reason: null, other_zone_id: null, trigger: null, motive: null, at_entry: true, on: today, time: timeSource(),
        });
        emit('EV-49', ctx.profileId, sector.id, saved.id, 'both', { need_code: saved.need_code, level, round: 1 });
      }
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
