import type { MenuKey, ProfileId } from './types';

/**
 * Entrées de menu par profil (proposition du lot A1, à valider).
 * Le menu est fourni par le Repository : un écran ne décide jamais de ses propres droits.
 */
export const MENU_BY_PROFILE: Record<ProfileId, readonly MenuKey[]> = {
  direction_client: ['home', 'dashboard', 'needs', 'proposals', 'budget', 'alerts'],
  dr_client: ['home', 'dashboard', 'needs', 'proposals', 'budget', 'alerts'],
  cvr_client: ['home', 'dashboard', 'needs', 'proposals', 'alerts'],
  rs: ['home', 'needs', 'proposals', 'field', 'alerts'],
  agency_operator: ['home', 'dashboard', 'needs', 'proposals', 'field', 'budget', 'alerts'],
  agency_admin: ['home', 'dashboard', 'needs', 'proposals', 'field', 'budget', 'alerts', 'settings'],
  provider_admin: ['home', 'dashboard', 'needs', 'proposals', 'field', 'budget', 'alerts', 'settings', 'admin'],
};

export const MENU_HREF: Record<MenuKey, string> = {
  home: '/',
  dashboard: '/dashboard',
  needs: '/needs',
  proposals: '/proposals',
  field: '/field',
  budget: '/budget',
  alerts: '/alerts',
  settings: '/settings',
  admin: '/admin',
};
