import { cookies } from 'next/headers';
import { profileDirectory, repository } from '@/data';
import type { DemoProfile, PublicAccount } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import type { AccessContext } from '@/domain/access';
import type { Locale } from '@/domain/types';
import { redirect } from '@/i18n/navigation';
import { readSession, SESSION_COOKIE, VIEW_AS_COOKIE } from './auth';
import { DEFAULT_PROFILE, PROFILE_COOKIE, PROFILE_COOKIE_PREFIX, parseProfileCookie } from './profile-cookie';

export { DEFAULT_PROFILE, PROFILE_COOKIE, PROFILE_COOKIE_PREFIX, parseProfileCookie };

export interface Session {
  account: PublicAccount;
  /** Profil effectif : celui du compte, ou celui consulté par le prestataire. */
  profile: DemoProfile;
  impersonated: boolean;
}

/** Session valide : cookie signé, compte existant et actif (une désactivation coupe l'accès à la requête suivante). */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const accountId = readSession(jar.get(SESSION_COOKIE)?.value);
  if (!accountId) return null;
  const account = await repository.getAccount(accountId);
  if (!account || !account.active) return null;
  const own = await profileDirectory.get(account.profile);
  if (!own) return null;
  const base: DemoProfile = { ...own, id: account.profile, scope: account.scope, first_name: account.first_name };
  const viewAs = jar.get(VIEW_AS_COOKIE)?.value;
  if (account.profile === 'provider_admin' && viewAs) {
    const target = await profileDirectory.get(parseProfileCookie(viewAs));
    if (target && target.id !== 'provider_admin') return { account, profile: target, impersonated: true };
  }
  return { account, profile: base, impersonated: false };
}

/** Session exigée : sans session, redirection vers la connexion ; mot de passe temporaire : vers son changement. */
export async function requireSession(locale: Locale): Promise<Session> {
  const session = await getSession();
  if (!session) redirect({ href: '/start', locale });
  return session as Session;
}

export async function getAccessContext(locale: Locale): Promise<AccessContext> {
  const session = await requireSession(locale);
  return buildAccessContext(session.profile, locale, { accountId: session.account.id, impersonated: session.impersonated });
}
