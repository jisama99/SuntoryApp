import { z } from 'zod';
import {
  AUDIENCES, COST_STATUSES, DEADLINE_TYPES, DECISION_OUTCOMES, DECISION_STATUSES, DEVIATION_KINDS, DISPOSITIFS, ENTRY_PROFILES,
  ESCALATION_REASONS, EVENT_CODES, INTAKE_STATES, INVALIDATION_REASONS, NEED_STATES, NOTE_OBJECT_KINDS, NOTE_VISIBILITIES, POSITION_STATUSES, PRESET_IDS,
  PROFILE_IDS, PROPOSAL_STATUSES, REOPEN_SCOPES, SEVERITIES, SIDES, SITUATIONS, VALIDATION_ACTIONS, VALIDATION_LEVELS, VALIDATION_STATES,
  ZONE_KINDS,
} from '@/domain/types';

export const ZoneSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(ZONE_KINDS),
  code: z.string(),
  parent_id: z.string().uuid().nullable(),
  label_fr: z.string().min(1),
  label_en: z.string().min(1),
  responsible_name: z.string().min(1),
  is_demo: z.literal(true),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const ScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.enum(ZONE_KINDS), ids: z.array(z.string().uuid()).min(1) }),
]);

export const ProfileSchema = z.object({
  id: z.enum(PROFILE_IDS),
  side: z.enum(SIDES),
  scope: ScopeSchema,
  first_name: z.string().min(1).nullable(),
  is_demo: z.literal(true),
});
export type DemoProfile = z.infer<typeof ProfileSchema>;

// audience : obligatoire, sans valeur par défaut (D108). Une alerte sans audience est invalide.
export const AlertSchema = z.object({
  id: z.string().uuid(),
  audience: z.enum(AUDIENCES),
  severity: z.enum(SEVERITIES),
  message_key: z.string().min(1),
  zone_id: z.string().uuid().nullable(),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_demo: z.literal(true),
});
export type Alert = z.infer<typeof AlertSchema>;

export const DemoClockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  iso_week: z.string().regex(/^\d{4}-S\d{2}$/),
  is_demo: z.literal(true),
});
export type DemoClock = z.infer<typeof DemoClockSchema>;

// ---------------------------------------------------------------------------------------------
// Lot A2a : besoins, magasins, campagnes, clôtures de semaine, journal d'événements.
// ---------------------------------------------------------------------------------------------
const IsoDateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const StoredWeekStr = z.string().regex(/^\d{4}-S\d{2}$/);

export const PeriodSchema = z.object({
  period_no: z.union([z.literal(1), z.literal(2)]),
  start_date: IsoDateStr.nullable(),
  end_date: IsoDateStr.nullable(),
  start_week: StoredWeekStr.nullable(),
  end_week: StoredWeekStr.nullable(),
});
export type Period = z.infer<typeof PeriodSchema>;

export const StoreSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^MAG-DEMO-\d{3}$/),
  label_fr: z.string().min(1),
  label_en: z.string().min(1),
  /** Secteur (zone de type RS) de rattachement ; nul pour un magasin sans rattachement. */
  sector_id: z.string().uuid().nullable(),
  is_demo: z.literal(true),
});
export type Store = z.infer<typeof StoreSchema>;

export const CampaignSchema = z.object({
  code: z.string().regex(/^CMP-DEMO-\d{2}$/),
  dispositif: z.enum(DISPOSITIFS),
  label_fr: z.string().min(1),
  label_en: z.string().min(1),
  window_start: IsoDateStr,
  window_end: IsoDateStr,
  is_demo: z.literal(true),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const WeekClosureSchema = z.object({
  week: StoredWeekStr,
  closed_at: IsoDateStr,
  is_demo: z.literal(true),
});
export type WeekClosure = z.infer<typeof WeekClosureSchema>;

const DaysSchema = z.array(z.number().int().min(1).max(7));

/** Champs saisissables d'un besoin. Tout peut manquer sauf le secteur : un besoin incomplet reste un brouillon (W9). */
export const NeedInputSchema = z.object({
  dispositif: z.enum(DISPOSITIFS).nullable(),
  campaign_code: z.string().nullable(),
  sector_id: z.string().uuid(),
  position_label: z.string().max(60).nullable(),
  weekly_hours: z.number().int().min(1).max(60).nullable(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  periods: z.array(PeriodSchema).max(2),
  days: DaysSchema,
  hours_slot: z.string().max(40).nullable(),
  store_codes: z.array(z.string().regex(/^MAG-DEMO-\d{3}$/)),
  client_comment: z.string().max(280).nullable(),
});
export type NeedInput = z.infer<typeof NeedInputSchema>;

export const NeedSchema = NeedInputSchema.extend({
  id: z.string().uuid(),
  need_code: z.string().regex(/^BES-DEMO-\d{3}$/),
  need_state: z.enum(NEED_STATES),
  position_status: z.enum(POSITION_STATUSES).nullable(),
  store_count: z.number().int().min(0),
  entered_by_profile: z.enum(PROFILE_IDS),
  /** Saisie pour le compte du responsable du secteur (D42) : auteur et personne concernée tracés séparément. */
  on_behalf: z.boolean(),
  created_at: IsoDateStr,
  modified_at: IsoDateStr,
  record_version: z.number().int().min(1),
  source_record_id: z.string().nullable(),
  /** Mois d'origine (AAAA-MM) d'une demande reportée sur le mois suivant après une échéance (D82). Absent sinon. */
  deferred_from_month: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  is_demo: z.literal(true),
});
export type Need = z.infer<typeof NeedSchema>;

// audience obligatoire, sans valeur par défaut : un événement sans audience est invalide (D91, D108).
export const BusinessEventSchema = z.object({
  id: z.string().uuid(),
  code: z.enum(EVENT_CODES),
  actor_profile: z.enum(PROFILE_IDS),
  zone_id: z.string().uuid(),
  need_id: z.string().uuid().nullable(),
  effect_date: IsoDateStr,
  recorded_at: IsoDateStr,
  seq: z.number().int().min(1),
  audience: z.enum(AUDIENCES),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  is_demo: z.literal(true),
});
export type BusinessEvent = z.infer<typeof BusinessEventSchema>;

// ---------------------------------------------------------------------------------------------
// Lot A2b : échéances, paramètres par dispositif, réouvertures, saisie en lot.
// ---------------------------------------------------------------------------------------------
export const MonthStr = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const WeekdayNo = z.number().int().min(1).max(7);

/** Règle d'un preset : nombre de jours calendaires ou ouvrés avant le début du mois cible. */
export const PresetRuleSchema = z.object({ unit: z.enum(['calendar', 'working']), days: z.number().int().min(0).max(60) });
export type PresetRule = z.infer<typeof PresetRuleSchema>;

/** Une ligne du calendrier d'échéances (table ECHEANCES, doc 24 §7) : un mois cible, un type, un preset ou une date fixe. */
export const DeadlineEntrySchema = z.object({
  month: MonthStr,
  type: z.enum(DEADLINE_TYPES),
  /** Preset appliqué, ou null pour une date fixe. */
  preset: z.enum(PRESET_IDS).nullable(),
  fixed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  author_profile: z.enum(PROFILE_IDS),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_demo: z.literal(true),
});
export type DeadlineEntry = z.infer<typeof DeadlineEntrySchema>;

const PresetRules = z.record(z.enum(DEADLINE_TYPES), PresetRuleSchema);
export const DeadlineSettingsSchema = z.object({
  default_preset: z.enum(PRESET_IDS),
  presets: z.object({ large: PresetRules, standard: PresetRules, short: PresetRules }),
  /** Seuils de la cascade d'alertes, en jours ouvrés avant l'échéance (5 = J-5, 0 = jour J). */
  cascade: z.array(z.number().int().min(0).max(30)).min(1),
  /** Jours non ouvrés pour le calcul des échéances (1 = lundi … 7 = dimanche). Distinct des jours non ouvrés de mission (W16). */
  non_working_weekdays: z.array(WeekdayNo),
  exclude_holidays: z.boolean(),
  entries: z.array(DeadlineEntrySchema),
  is_demo: z.literal(true),
});
export type DeadlineSettings = z.infer<typeof DeadlineSettingsSchema>;

export const KmFlatRateSchema = z.object({
  applicable: z.boolean(),
  /** Montant HT en euros. Valeur fictive étiquetée au démonstrateur ; null = « Non chiffré », jamais 0. */
  amount_eur_ht: z.number().min(0).nullable(),
});
export const EntryWindowSchema = z.object({
  /** Q-N9-1 : « avant-dernière semaine » du mois précédent, selon la lecture retenue pour « dernière semaine ». */
  reading: z.enum(['last_full_week', 'week_of_last_day']),
});
export const NonWorkingDaysSchema = z.object({ weekdays: z.array(WeekdayNo), holidays: z.boolean() });

/** Paramètres d'un dispositif (F-30.10). Une valeur null signifie « valeur globale » (ou « non défini » pour min_minutes). */
export const DispositifParamsSchema = z.object({
  dispositif: z.enum(DISPOSITIFS),
  min_minutes: z.number().int().min(1).max(600).nullable(),
  km_flat_rate: KmFlatRateSchema,
  entry_window: EntryWindowSchema.nullable(),
  change_effect: z.literal('next_month').nullable(),
  change_lead_days: z.number().int().min(0).max(90).nullable(),
  /** Q-N9-2 : jours calendaires ou ouvrés. */
  change_lead_unit: z.enum(['calendar', 'working']),
  /** null = tous les rôles de saisie (Q-N9-3 : le rôle « CS » n'est pas défini). */
  entry_roles: z.array(z.enum(ENTRY_PROFILES)).nullable(),
  horizon_weeks: z.number().int().min(1).max(156).nullable(),
  non_working_days: NonWorkingDaysSchema.nullable(),
  days_allowed: z.array(WeekdayNo).min(1).nullable(),
  /** Règle de modèle (H1, D128) : une campagne ne relève que d'un dispositif. Non modifiable. */
  campaign_single_dispositif: z.literal(true),
  is_demo: z.literal(true),
});
export type DispositifParams = z.infer<typeof DispositifParamsSchema>;

export const PARAM_KEYS = [
  'min_minutes', 'km_flat_rate', 'entry_window', 'change_effect', 'change_lead_days', 'change_lead_unit',
  'entry_roles', 'horizon_weeks', 'non_working_days', 'days_allowed',
] as const;
export type ParamKey = (typeof PARAM_KEYS)[number];

/** Valeur acceptée pour chaque clé modifiable : le Repository refuse toute autre forme. */
export const PARAM_VALUE_SCHEMAS = {
  min_minutes: DispositifParamsSchema.shape.min_minutes,
  km_flat_rate: KmFlatRateSchema,
  entry_window: DispositifParamsSchema.shape.entry_window,
  change_effect: DispositifParamsSchema.shape.change_effect,
  change_lead_days: DispositifParamsSchema.shape.change_lead_days,
  change_lead_unit: DispositifParamsSchema.shape.change_lead_unit,
  entry_roles: DispositifParamsSchema.shape.entry_roles,
  horizon_weeks: DispositifParamsSchema.shape.horizon_weeks,
  non_working_days: DispositifParamsSchema.shape.non_working_days,
  days_allowed: DispositifParamsSchema.shape.days_allowed,
} as const;

/** Historique des modifications (acteur, date, ancienne et nouvelle valeur). */
export interface ParamChange {
  id: string;
  seq: number;
  dispositif: (typeof DISPOSITIFS)[number];
  key: ParamKey;
  old_value: unknown;
  new_value: unknown;
  actor_profile: (typeof PROFILE_IDS)[number];
  changed_on: string;
}

/** Réouverture décidée par l'agence : mois (AAAA-MM) ou semaine (AAAA-Snn) clôturé, motif, durée, zone concernée, trace. */
export const ReopeningSchema = z.object({
  id: z.string().uuid(),
  scope: z.enum(REOPEN_SCOPES),
  target: z.string().regex(/^(\d{4}-\d{2}|\d{4}-S\d{2})$/),
  zone_id: z.string().uuid(),
  reason: z.string().min(1).max(280),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  decided_by: z.enum(PROFILE_IDS),
  decided_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  request_id: z.string().uuid().nullable(),
  is_demo: z.literal(true),
});
export type Reopening = z.infer<typeof ReopeningSchema>;

/** Demande de réouverture : le CVR seul la dépose (D87), l'agence seule la décide. */
export const ReopeningRequestSchema = z.object({
  id: z.string().uuid(),
  scope: z.enum(REOPEN_SCOPES),
  target: z.string().regex(/^(\d{4}-\d{2}|\d{4}-S\d{2})$/),
  zone_id: z.string().uuid(),
  motive: z.string().min(1).max(280),
  desired_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requested_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['pending', 'granted', 'declined']),
  is_demo: z.literal(true),
});
export type ReopeningRequest = z.infer<typeof ReopeningRequestSchema>;

/** Ligne du tableau de saisie en lot : mêmes champs que le formulaire unitaire, en texte. */
const BatchPeriodSchema = z.object({
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  start_week: z.string().nullable(),
  end_week: z.string().nullable(),
});
const BatchRawSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  start_week: z.string().optional(),
  end_week: z.string().optional(),
});
export const BatchRowSchema = z.object({
  dispositif: z.string().max(40),
  campaign_code: z.string().max(40),
  sector_id: z.string().max(40),
  position_label: z.string().max(60),
  weekly_hours: z.string().max(4),
  priority: z.string().max(2),
  periods: z.array(BatchPeriodSchema).min(1).max(2),
  days: z.array(WeekdayNo).max(7),
  hours_slot: z.string().max(40),
  store_codes: z.array(z.string().max(20)).max(60),
  client_comment: z.string().max(280),
  /** Valeurs brutes collées d'un tableur (W2, W13 à W15). */
  raw: z.object({ 1: BatchRawSchema.optional(), 2: BatchRawSchema.optional() }).optional(),
  /** Explications d'un collage qui n'a pu être converti (valeur inconnue). */
  paste_issues: z.array(z.object({ column: z.string().max(30), raw: z.string().max(80), kind: z.string().max(30) })).max(20).optional(),
});
export type BatchRow = z.infer<typeof BatchRowSchema>;
export const BatchRowsSchema = z.array(BatchRowSchema).max(60);

// ---------------------------------------------------------------------------------------------
// Lot A1f : comptes de connexion (D188, D189). Le mot de passe n'existe qu'en empreinte (sel et hachage).
export const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9]{3,19}$/;

export const AccountSchema = z.object({
  id: z.string().uuid(),
  username: z.string().regex(USERNAME_PATTERN),
  profile: z.enum(PROFILE_IDS),
  scope: ScopeSchema,
  first_name: z.string().min(1).nullable(),
  active: z.boolean(),
  must_change_password: z.boolean(),
  password: z.object({ salt: z.string().min(1), hash: z.string().min(1) }),
  created_by: z.string().nullable(),
  is_demo: z.literal(true),
});
export type Account = z.infer<typeof AccountSchema>;

/** Compte tel que l'écran le voit : jamais d'empreinte. */
export type PublicAccount = Omit<Account, 'password'>;

// ---------------------------------------------------------------------------------------------
// Lot A3 : qualification et recrutement, propositions versionnées, décisions, notes (D162).
// ---------------------------------------------------------------------------------------------
const Uuid = z.string().uuid();
const NullableDate = IsoDateStr.nullable();

/** Une sortie du poste (désistement ou rupture) : rien n'est effacé, le cycle terminé reste au dossier (D97). */
export const RecruitmentExitSchema = z.object({
  kind: z.enum(['withdrawal', 'termination']),
  on: IsoDateStr,
  hired_on: NullableDate,
  start_work_date: NullableDate,
});
export type RecruitmentExit = z.infer<typeof RecruitmentExitSchema>;

/**
 * Une ligne du dossier de validation managériale (lot A3c) : jamais réécrite. `zone_id` est la zone dont l'autorité s'exerce (le CVR
 * ou le DR du besoin) ; `by_zone_id` est la zone de la personne qui a agi quand c'est un suppléant (délégation), sinon nul.
 */
export const ValidationEntrySchema = z.object({
  id: z.string().uuid(),
  round: z.number().int().min(1),
  action: z.enum(VALIDATION_ACTIONS),
  level: z.enum(VALIDATION_LEVELS),
  by_profile: z.enum(PROFILE_IDS),
  zone_id: z.string().uuid().nullable(),
  by_zone_id: z.string().uuid().nullable(),
  delegation_id: z.string().uuid().nullable(),
  reason: z.enum(ESCALATION_REASONS).nullable(),
  /** Autre CVR en cause dans un arbitrage entre CVR. */
  other_zone_id: z.string().uuid().nullable(),
  /** Escalade déclenchée à la main par le CVR (A3c) ou par une règle d'enveloppe (A4b1). */
  trigger: z.enum(['manual', 'rule']).nullable(),
  motive: z.string().max(280).nullable(),
  /** Avis réputé donné à la saisie par un CVR, un DR ou la direction (A3d) : aucune décision séparée. */
  at_entry: z.boolean().optional(),
  on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
});
export type ValidationEntry = z.infer<typeof ValidationEntrySchema>;

/**
 * Suivi de recrutement d'un besoin. Un besoin soumis sans enregistrement est « à qualifier ». Les jalons sont des dates :
 * l'état de l'entonnoir s'en déduit (domain/pipeline.ts), il n'est jamais stocké en un champ unique.
 */
export const RecruitmentSchema = z.object({
  need_id: Uuid,
  intake: z.enum(INTAKE_STATES),
  intake_motive: z.string().max(280).nullable(),
  qualified_on: NullableDate,
  situation: z.enum(SITUATIONS),
  reassigned_from_sector_id: Uuid.nullable(),
  white_zone_since: NullableDate,
  stopped: z.object({ reason: z.string().min(1).max(280), on: IsoDateStr }).nullable(),
  search_started_on: NullableDate,
  hired_on: NullableDate,
  training_on: NullableDate,
  start_work_date: NullableDate,
  /** D231 : heure de prise de poste (HH:MM, Paris), saisie en option. */
  start_work_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  vehicle_handover_date: NullableDate,
  refusal_count: z.number().int().min(0),
  withdrawal_count: z.number().int().min(0),
  exits: z.array(RecruitmentExitSchema),
  /**
   * Validation managériale (A3c, dimension distincte de `intake`). Un enregistrement sans ces champs est réputé validé par la chaîne
   * cliente (D209, hypothèse H-A3-1 d'avant A3c) ; un besoin soumis après A3c démarre « à valider ».
   */
  validation: z.enum(VALIDATION_STATES).default('validated'),
  /** Tour de validation : s'incrémente à chaque nouvelle soumission après un refus. */
  validation_round: z.number().int().min(1).default(1),
  /** Date d'entrée dans l'état de validation courant (base de l'échéance). */
  validation_on: NullableDate.default(null),
  /** Escalade en cours (état « escaladé »). */
  escalation: z.object({
    reason: z.enum(ESCALATION_REASONS), other_zone_id: z.string().uuid().nullable(), trigger: z.enum(['manual', 'rule']), motive: z.string().max(280), on: IsoDateStr,
  }).nullable().default(null),
  validation_log: z.array(ValidationEntrySchema).default([]),
  is_demo: z.literal(true),
});
export type Recruitment = z.infer<typeof RecruitmentSchema>;

const DaysArray = z.array(z.number().int().min(1).max(7));
const INT_REF = /^INT-\d{3}$/;

/** Ce que l'agence saisit. Les éléments déterminants sont comparés à ceux de la version précédente (domain/pipeline.ts). */
export const ProposalInputSchema = z.object({
  candidate_ref: z.string().regex(INT_REF),
  weekly_hours: z.number().int().min(1).max(60),
  days: DaysArray.min(1),
  hours_slot: z.string().max(40).nullable(),
  start_date: IsoDateStr,
  end_date: IsoDateStr,
  store_codes: z.array(z.string().regex(/^MAG-DEMO-\d{3}$/)),
  deviation_note: z.string().max(280).nullable(),
  cost_status: z.enum(COST_STATUSES),
});
export type ProposalInput = z.infer<typeof ProposalInputSchema>;

export const ProposalSchema = ProposalInputSchema.extend({
  /** Chiffrage : réservé à l'agence. Nul dans la vue de la cliente ; un coût inconnu n'est jamais 0. */
  cost_status: z.enum(COST_STATUSES).nullable(),
  id: Uuid,
  need_id: Uuid,
  version: z.number().int().min(1),
  status: z.enum(PROPOSAL_STATUSES),
  deviations: z.array(z.enum(DEVIATION_KINDS)),
  author_profile: z.enum(PROFILE_IDS),
  created_on: IsoDateStr,
  sent_on: NullableDate,
  /** Date cible de la proposition (délai de proposition, valeur de départ à valider D93). */
  due_on: NullableDate,
  withdrawn_on: NullableDate,
  withdrawn_motive: z.string().max(280).nullable(),
  is_demo: z.literal(true),
});
export type Proposal = z.infer<typeof ProposalSchema>;

export const DecisionSchema = z.object({
  id: Uuid,
  proposal_id: Uuid,
  need_id: Uuid,
  /** Version de la proposition décidée. */
  version: z.number().int().min(1),
  outcome: z.enum(DECISION_OUTCOMES),
  motive: z.string().max(280).nullable(),
  status: z.enum(DECISION_STATUSES),
  decided_by: z.enum(PROFILE_IDS),
  decided_on: IsoDateStr,
  /** D231 : heure d'acceptation, horodatée automatiquement (HH:MM, Paris). */
  decided_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  invalidated_on: NullableDate,
  invalidated_reason: z.enum(INVALIDATION_REASONS).nullable(),
  /** Proposition dont l'envoi a invalidé la décision, le cas échéant. */
  invalidated_by_proposal_id: Uuid.nullable(),
  is_demo: z.literal(true),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const NoteSchema = z.object({
  id: Uuid,
  object_kind: z.enum(NOTE_OBJECT_KINDS),
  object_id: Uuid,
  need_id: Uuid,
  /** Secteur du besoin : sert au filtrage par périmètre. */
  sector_id: Uuid,
  text: z.string().min(1).max(500),
  visibility: z.enum(NOTE_VISIBILITIES),
  /** Zone du destinataire (DR, CVR ou RS) pour une note partagée avec un destinataire. */
  recipient_zone_id: Uuid.nullable(),
  author_profile: z.enum(PROFILE_IDS),
  created_on: IsoDateStr,
  seq: z.number().int().min(1),
  withdrawn_on: NullableDate,
  withdrawn_by: z.enum(PROFILE_IDS).nullable(),
  is_demo: z.literal(true),
});
export type Note = z.infer<typeof NoteSchema>;

// ---------------------------------------------------------------------------------------------
// Lot A3c : délégations et suppléants (F-30.3). D09 (RACI, suppléants, délais) reste ouverte : aucun délai de réponse n'est figé.
// ---------------------------------------------------------------------------------------------
/**
 * Un suppléant désigné pour l'absence d'un CVR ou d'un DR. Un seul suppléant à la fois par délégant (hypothèse). Les deux zones sont du
 * même niveau : le suppléant agit dans le périmètre du délégant, jamais au-delà. Une délégation n'est jamais supprimée : elle est
 * révoquée avec sa trace.
 */
export const DelegationSchema = z.object({
  id: z.string().uuid(),
  delegator_zone_id: z.string().uuid(),
  substitute_zone_id: z.string().uuid(),
  start_date: IsoDateStr,
  end_date: IsoDateStr,
  created_by: z.enum(PROFILE_IDS),
  created_on: IsoDateStr,
  revoked_on: NullableDate,
  revoked_by: z.enum(PROFILE_IDS).nullable(),
  is_demo: z.literal(true),
});
export type Delegation = z.infer<typeof DelegationSchema>;

// ---------------------------------------------------------------------------------------------
// Lot A4b1 : enveloppe cliente, allocation de l'agence, tarif fictif. Montants fictifs en euros hors taxes (devise et base explicites).
// ---------------------------------------------------------------------------------------------
/** Montant en euros avec au plus deux décimales : le calcul se fait en centimes entiers. */
const MoneyEur = z.number().min(0).max(1_000_000_000).refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'au plus deux décimales');

/** Une version de l'enveloppe nationale, saisie par la cliente. Les versions ne s'effacent pas : la dernière est la version courante. */
export const EnvelopeVersionSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(1),
  period_start: IsoDateStr,
  period_end: IsoDateStr,
  amount_eur_ht: MoneyEur,
  currency: z.literal('EUR'),
  basis: z.literal('HT'),
  entered_by_profile: z.enum(PROFILE_IDS),
  entered_on: IsoDateStr,
  motive: z.string().max(280).nullable(),
  is_demo: z.literal(true),
});
export type EnvelopeVersion = z.infer<typeof EnvelopeVersionSchema>;

/** Une ligne d'allocation de l'agence : une campagne (donc un dispositif) et un CVR (donc un DR). L'absence de ligne vaut « Budget non renseigné ». */
export const AllocationLineSchema = z.object({
  id: z.string().uuid(),
  campaign_code: z.string().regex(/^CMP-DEMO-\d{2}$/),
  cvr_id: z.string().uuid(),
  amount_eur_ht: MoneyEur,
  currency: z.literal('EUR'),
  basis: z.literal('HT'),
  revision: z.number().int().min(1),
  updated_on: IsoDateStr,
  updated_by_profile: z.enum(PROFILE_IDS),
  is_demo: z.literal(true),
});
export type AllocationLine = z.infer<typeof AllocationLineSchema>;

/** Tarif horaire FICTIF par dispositif, daté. Jamais présenté comme un tarif réel (D06 ouvert). */
export const RateSchema = z.object({
  id: z.string().uuid(),
  dispositif: z.enum(DISPOSITIFS),
  hourly_rate_eur_ht: z.number().positive().max(1000).refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'au plus deux décimales'),
  currency: z.literal('EUR'),
  basis: z.literal('HT'),
  valid_from: IsoDateStr,
  is_fictional: z.literal(true),
  is_demo: z.literal(true),
});
export type Rate = z.infer<typeof RateSchema>;
