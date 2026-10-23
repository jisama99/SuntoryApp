export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const PROFILE_IDS = [
  'direction_client',
  'dr_client',
  'cvr_client',
  'rs',
  'agency_operator',
  'agency_admin',
  'provider_admin',
] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

export const SIDES = ['client', 'agency', 'provider'] as const;
export type Side = (typeof SIDES)[number];

export const AUDIENCES = ['agency', 'client', 'both'] as const;
export type Audience = (typeof AUDIENCES)[number];

export const ZONE_KINDS = ['dr', 'cvr', 'rs'] as const;
export type ZoneKind = (typeof ZONE_KINDS)[number];

export const SEVERITIES = ['info', 'attention', 'risk'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const MENU_KEYS = [
  'home',
  'dashboard',
  'needs',
  'proposals',
  'field',
  'budget',
  'alerts',
  'settings',
  'admin',
] as const;
export type MenuKey = (typeof MENU_KEYS)[number];

export type Scope = { kind: 'all' } | { kind: ZoneKind; ids: string[] };

/** Skins de l'écran d'accueil (D161) : Produits, Nature, Sobre (sans visuel). */
export const HOME_SKINS = ['products', 'nature', 'plain'] as const;
export type HomeSkin = (typeof HOME_SKINS)[number];
export const DEFAULT_HOME_SKIN: HomeSkin = 'nature';

/** Dispositifs (H1, D128) : anciennement les valeurs du champ `campaign`. */
export const DISPOSITIFS = ['permanent', 'seasonal', 'hourly_merch', 'second_placement'] as const;
export type Dispositif = (typeof DISPOSITIFS)[number];

/** Statut du besoin saisi (dimension distincte du statut de poste, STATUTS_ET_ETATS.md). */
export const NEED_STATES = ['draft', 'submitted'] as const;
export type NeedState = (typeof NEED_STATES)[number];

/** Les neuf statuts de poste validés le 23/10/2026 (D54). Renseignés à partir du lot A3 : nul en A2a. */
export const POSITION_STATUSES = [
  'to_recruit',
  'recruiting',
  'proposed',
  'approved',
  'filled',
  'withdrawal',
  'termination',
  'cancelled',
  'refused',
] as const;
export type PositionStatus = (typeof POSITION_STATUSES)[number];

/**
 * Événements métier émis par les lots A2a et A2b (catalogue du doc 26 §3, D91).
 * EV-04 : saisie bloquée ou reportée. EV-32 et EV-33 : réouverture demandée puis décidée.
 * EV-38 : paramètre d'échéance ou de dispositif modifié, code proposé hors catalogue (à inscrire au doc 26).
 * EV-40 à EV-43 (comptes, D189, codes proposés hors catalogue) : compte créé, attribution modifiée, compte désactivé ou réactivé,
 * mot de passe réinitialisé. Jamais de mot de passe dans les données.
 * EV-39 : écriture annulée par son auteur juste après coup, code proposé hors catalogue ; l'événement annulé reste au journal.
 * Lot A3 : EV-09 à EV-21 du catalogue (doc 26 §3). EV-44 (note ajoutée, partagée ou retirée, D162) et EV-45 (proposition
 * retirée) sont des codes proposés hors catalogue, à inscrire au doc 26. EV-06 à EV-08 (validation CVR, escalade DR) ne sont pas émis en A3.
 */
export const EVENT_CODES = [
  'EV-01', 'EV-02', 'EV-03', 'EV-04', 'EV-05', 'EV-09', 'EV-10', 'EV-11', 'EV-12', 'EV-13', 'EV-14', 'EV-15', 'EV-16', 'EV-17',
  'EV-18', 'EV-19', 'EV-20', 'EV-21', 'EV-32', 'EV-33', 'EV-38', 'EV-39', 'EV-40', 'EV-41', 'EV-42', 'EV-43', 'EV-44', 'EV-45',
] as const;
export type EventCode = (typeof EVENT_CODES)[number];

/** Jours de la semaine : 1 = lundi … 7 = dimanche. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Échéances mensuelles (D80) : saisie des besoins et demandes de changement. */
export const DEADLINE_TYPES = ['needs_entry', 'change_request'] as const;
export type DeadlineType = (typeof DEADLINE_TYPES)[number];

/** Presets de calcul des échéances (D82). « Date fixe » n'est pas un preset : c'est une date choisie pour un mois. */
export const PRESET_IDS = ['large', 'standard', 'short'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

/** Profils pouvant saisir des besoins (rôles de saisie, paramètre `entry_roles`). */
export const ENTRY_PROFILES = ['rs', 'agency_operator', 'agency_admin'] as const;
export type EntryProfile = (typeof ENTRY_PROFILES)[number];

export const REOPEN_SCOPES = ['month', 'week'] as const;
export type ReopenScope = (typeof REOPEN_SCOPES)[number];

// ---------------------------------------------------------------------------------------------
// Lot A3 : circuit besoin, proposition, décision, recrutement. Chaque dimension a son propre statut (STATUTS_ET_ETATS.md).
// ---------------------------------------------------------------------------------------------
/** Qualification du besoin par l'agence (F-30.4) : dimension « besoin », distincte du brouillon et du poste. */
export const INTAKE_STATES = ['to_qualify', 'taken', 'clarification', 'rejected'] as const;
export type IntakeState = (typeof INTAKE_STATES)[number];

/** Statut de la proposition (dimension « proposition »). Seule une proposition envoyée est visible de la cliente. */
export const PROPOSAL_STATUSES = ['in_progress', 'proposed', 'withdrawn', 'superseded'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** Décision de la cliente (dimension « décision ») et son état : une décision invalidée reste au dossier. */
export const DECISION_OUTCOMES = ['approved', 'refused', 'revision'] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];
export const DECISION_STATUSES = ['valid', 'invalidated'] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];
export const INVALIDATION_REASONS = ['new_version', 'withdrawn', 'need_changed'] as const;
export type InvalidationReason = (typeof INVALIDATION_REASONS)[number];

/** Les six états de l'entonnoir de recrutement (D92). « En poste » est le « Pourvu » des rapports. */
export const FUNNEL_STATES = ['to_recruit', 'recruiting', 'proposed', 'approved', 'hired', 'started'] as const;
export type FunnelState = (typeof FUNNEL_STATES)[number];

/** Situation du recrutement (D85, D93) : les délais sont mesurés par situation, jamais en moyenne unique. */
export const SITUATIONS = ['new', 'reassigned', 'white_zone'] as const;
export type Situation = (typeof SITUATIONS)[number];

/** État de chiffrage d'une proposition. Un coût inconnu n'est jamais 0 (CLAUDE.md). Réservé à l'agence. */
export const COST_STATUSES = ['complete', 'partial', 'not_priced'] as const;
export type CostStatus = (typeof COST_STATUSES)[number];

export const DEVIATION_KINDS = ['hours', 'days', 'slot', 'period', 'stores'] as const;
export type DeviationKind = (typeof DEVIATION_KINDS)[number];

/** Étapes de recrutement enregistrées par l'agence, ou par le RS pour la prise de poste et la remise du véhicule (F-30.8). */
export const RECRUITMENT_STEPS = [
  'start_search', 'hired', 'training', 'start_work', 'vehicle_handover', 'reassign', 'stop', 'white_zone', 'lift_white_zone', 'withdrawal',
] as const;
export type RecruitmentStep = (typeof RECRUITMENT_STEPS)[number];

export const NEXT_ACTIONS = [
  'complete_need', 'qualify', 'clarify', 'prepare_proposal', 'send_proposal', 'decide', 'revise_proposal', 'new_proposal',
  'finalise_hiring', 'start_work', 'reconfirm_proposal', 'none',
] as const;
export type NextAction = (typeof NEXT_ACTIONS)[number];
export const ACTORS = ['rs', 'agency', 'decider', 'none'] as const;
export type Actor = (typeof ACTORS)[number];
export const URGENCIES = ['overdue', 'urgent', 'soon', 'normal'] as const;
export type Urgency = (typeof URGENCIES)[number];

/** Visibilité d'une note (D162) : interne par défaut ; la visibilité est choisie à chaque note et ne se rouvre pas. */
export const NOTE_VISIBILITIES = ['agency_internal', 'shared_client', 'shared_recipient'] as const;
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];
export const NOTE_OBJECT_KINDS = ['proposal', 'decision'] as const;
export type NoteObjectKind = (typeof NOTE_OBJECT_KINDS)[number];

/** Statut d'exécution (dimension « exécution », distinct du statut de poste calculé) : où en est la prise de poste. */
export const EXECUTION_STATUSES = ['not_started', 'start_planned', 'in_post', 'ended'] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

/**
 * Écart entre l'acceptation de la proposition et le poste démarré (D210). « Plus tard dans la journée » exige l'heure des
 * deux événements ; le démonstrateur n'enregistre que des dates, cette catégorie reste donc vide tant que l'heure n'existe pas.
 */
export const START_LAG_KINDS = ['same_day', 'later_in_day', 'next_working_day_or_more'] as const;
export type StartLagKind = (typeof START_LAG_KINDS)[number];
