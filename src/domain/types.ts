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
