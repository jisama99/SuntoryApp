import { PROFILE_IDS } from '@/domain/types';
import type { ProfileId } from '@/domain/types';

/** Cookie de « visualisation comme » (réservé au prestataire, D188) : nom, préfixe et lecture, sans dépendance serveur. */
export const PROFILE_COOKIE = 'demo_view_as';
export const PROFILE_COOKIE_PREFIX = 'sim.';
export const DEFAULT_PROFILE: ProfileId = 'direction_client';

export function parseProfileCookie(value: string | undefined): ProfileId {
  if (!value || !value.startsWith(PROFILE_COOKIE_PREFIX)) return DEFAULT_PROFILE;
  const id = value.slice(PROFILE_COOKIE_PREFIX.length);
  return (PROFILE_IDS as readonly string[]).includes(id) ? (id as ProfileId) : DEFAULT_PROFILE;
}
