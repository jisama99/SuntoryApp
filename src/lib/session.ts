import { cookies } from 'next/headers';
import { profileDirectory } from '@/data';
import type { DemoProfile } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import type { AccessContext } from '@/domain/access';
import { PROFILE_IDS } from '@/domain/types';
import type { Locale, ProfileId } from '@/domain/types';

/**
 * Cookie de SIMULATION de profil (étape A). Nom et format volontairement distincts d'une
 * future session : il n'authentifie personne et ne doit jamais être présenté comme une connexion.
 */
export const PROFILE_COOKIE = 'demo_profile_simule';
export const PROFILE_COOKIE_PREFIX = 'sim.';
export const DEFAULT_PROFILE: ProfileId = 'direction_client';

export function parseProfileCookie(value: string | undefined): ProfileId {
  if (!value || !value.startsWith(PROFILE_COOKIE_PREFIX)) return DEFAULT_PROFILE;
  const id = value.slice(PROFILE_COOKIE_PREFIX.length);
  return (PROFILE_IDS as readonly string[]).includes(id) ? (id as ProfileId) : DEFAULT_PROFILE;
}

export async function getSimulatedProfile(): Promise<DemoProfile> {
  const jar = await cookies();
  const id = parseProfileCookie(jar.get(PROFILE_COOKIE)?.value);
  const profile = await profileDirectory.get(id);
  if (!profile) throw new Error('Profil de démonstration introuvable');
  return profile;
}

export async function getAccessContext(locale: Locale): Promise<AccessContext> {
  return buildAccessContext(await getSimulatedProfile(), locale);
}
