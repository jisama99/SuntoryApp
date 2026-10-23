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
 * EV-39 : écriture annulée par son auteur juste après coup, code proposé hors catalogue ; l'événement annulé reste au journal.
 */
export const EVENT_CODES = ['EV-01', 'EV-02', 'EV-03', 'EV-04', 'EV-05', 'EV-32', 'EV-33', 'EV-38', 'EV-39', 'EV-ACCOUNT-CREATE', 'EV-ACCOUNT-DEACTIVATE', 'EV-ACCOUNT-RESET'] as const;
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
