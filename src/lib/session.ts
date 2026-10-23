import { cookies } from 'next/headers';
import { accountRepository } from '@/data';
import { buildAccessContext } from '@/domain/access';
import type { AccessContext } from '@/domain/access';
import type { Account } from '@/data/schemas';
import { PROFILE_IDS } from '@/domain/types';
import type { Locale, ProfileId, Side } from '@/domain/types';
import { SESSION_COOKIE, decodeSession } from '@/lib/auth';

/**
 * Cookie de SESSION (lot A1f, D188). Remplace le cookie de profil simulé.
 * Valeur signée HMAC-SHA256 : <username>.<signature>.
 * Étape B : vrai jeton de session en base.
 */

function sideOf(profileId: ProfileId): Side {
  if (profileId === 'provider_admin') return 'provider';
  if (profileId === 'agency_admin' || profileId === 'agency_operator') return 'agency';
  return 'client';
}

function accountToProfile(account: Account) {
  return {
    id: account.profile_id,
    side: sideOf(account.profile_id),
    scope: account.scope,
    first_name: account.first_name,
    is_demo: true as const,
  };
}

/** Résout le nom d'utilisateur à partir du cookie de session. Null = non connecté ou cookie invalide. */
async function getSessionUsername(): Promise<string | null> {
  const jar = await cookies();
  return decodeSession(jar.get(SESSION_COOKIE)?.value);
}

/** Renvoie le compte connecté ou null si la session est absente ou invalide. */
export async function getSessionAccount(): Promise<Account | null> {
  const username = await getSessionUsername();
  if (!username) return null;
  return accountRepository.getAccountByUsername(username);
}

/**
 * Renvoie l'AccessContext de la session courante.
 * Si aucune session : repli sur direction_client (protégé par le middleware qui redirige /start).
 */
export async function getAccessContext(locale: Locale): Promise<AccessContext> {
  const account = await getSessionAccount();
  if (account) return buildAccessContext(accountToProfile(account), locale);
  // Repli : le middleware aurait dû rediriger, mais on renvoie un contexte minimal lisible.
  return buildAccessContext(
    { id: 'direction_client', side: 'client', scope: { kind: 'all' }, first_name: null, is_demo: true },
    locale,
  );
}

// ---------------------------------------------------------------------------
// Compatibilité descendante : supprimée progressivement. Conservée pour
// les composants qui lisent encore l'ancien cookie simulé (ProfileSwitcher).
// ---------------------------------------------------------------------------

/** @deprecated — remplacé par SESSION_COOKIE. Supprimé à l'étape B. */
export const PROFILE_COOKIE = 'demo_profile_simule';
export const PROFILE_COOKIE_PREFIX = 'sim.';
export const DEFAULT_PROFILE: ProfileId = 'direction_client';

export function parseProfileCookie(value: string | undefined): ProfileId {
  if (!value || !value.startsWith(PROFILE_COOKIE_PREFIX)) return DEFAULT_PROFILE;
  const id = value.slice(PROFILE_COOKIE_PREFIX.length);
  return (PROFILE_IDS as readonly string[]).includes(id) ? (id as ProfileId) : DEFAULT_PROFILE;
}

/** @deprecated Utiliser getSessionAccount(). Conservé pour ProfileSwitcher (provider_admin seulement). */
export async function getSimulatedProfile() {
  return getSessionAccount().then((acc) => (acc ? accountToProfile(acc) : { id: DEFAULT_PROFILE, side: 'client' as const, scope: { kind: 'all' as const }, first_name: null, is_demo: true as const }));
}
