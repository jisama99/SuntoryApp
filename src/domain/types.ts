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

/** Événements métier émis par le lot A2a (catalogue du doc 26 §3, D91). */
export const EVENT_CODES = ['EV-01', 'EV-02', 'EV-03', 'EV-05'] as const;
export type EventCode = (typeof EVENT_CODES)[number];

/** Jours de la semaine : 1 = lundi … 7 = dimanche. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
