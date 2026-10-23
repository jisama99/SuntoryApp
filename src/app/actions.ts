'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';
import { accountRepository, repository } from '@/data';
import { HOME_SKINS, LOCALES, PROFILE_IDS } from '@/domain/types';
import type { HomeSkin, Locale } from '@/domain/types';
import { getAccessContext, PROFILE_COOKIE, PROFILE_COOKIE_PREFIX, parseProfileCookie } from '@/lib/session';
import {
  SESSION_COOKIE, SESSION_COOKIE_MAX_AGE, constantDelay, encodeSession,
  hashPassword, isRateLimited, recordAttempt, clearAttempts,
} from '@/lib/auth';

export async function setTheme(formData: FormData): Promise<void> {
  const theme = parseTheme(String(formData.get('theme') ?? ''));
  const jar = await cookies();
  jar.set(THEME_COOKIE, theme, { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  revalidatePath('/', 'layout');
}

export async function setHomeSkinAction(formData: FormData): Promise<void> {
  const skin = String(formData.get('skin') ?? '');
  const locale = String(formData.get('locale') ?? 'fr');
  if (!(HOME_SKINS as readonly string[]).includes(skin) || !(LOCALES as readonly string[]).includes(locale)) return;
  await repository.setUserHomeSkin(await getAccessContext(locale as Locale), skin as HomeSkin);
  revalidatePath('/', 'layout');
}

// ---------------------------------------------------------------------------
// Connexion / déconnexion (D188)
// ---------------------------------------------------------------------------

export type LoginResult =
  | { status: 'ok' }
  | { status: 'error'; messageKey: 'auth.error' | 'auth.locked' | 'auth.temp_password' };

/**
 * Action de connexion. Appelée uniquement à la soumission explicite du formulaire (D188).
 * Renvoie un objet résultat : jamais de redirect dans cette action pour respecter
 * l'usage React (le composant client redirige après réception du résultat).
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    await constantDelay();
    return { status: 'error', messageKey: 'auth.error' };
  }

  if (isRateLimited(username)) {
    await constantDelay();
    return { status: 'error', messageKey: 'auth.locked' };
  }

  const account = await accountRepository.authenticate(username, password);
  if (!account) {
    recordAttempt(username);
    return { status: 'error', messageKey: 'auth.error' };
  }

  clearAttempts(username);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSession(username), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  revalidatePath('/', 'layout');

  if (account.status === 'temp_password') {
    return { status: 'error', messageKey: 'auth.temp_password' };
  }
  return { status: 'ok' };
}

/** Déconnexion : efface le cookie de session et redirige vers l'écran de connexion. */
export async function logoutAction(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr');
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  // Efface aussi l'ancien cookie de profil simulé s'il est encore présent.
  jar.delete(PROFILE_COOKIE);
  revalidatePath('/', 'layout');
  redirect(`/${(LOCALES as readonly string[]).includes(locale) ? locale : 'fr'}/start`);
}

// ---------------------------------------------------------------------------
// Gestion des comptes (D189) — réservée à agency_admin / provider_admin
// ---------------------------------------------------------------------------

export type AccountActionResult =
  | { status: 'ok'; temp_password?: string }
  | { status: 'error'; messageKey: string };

export async function createAccountAction(formData: FormData): Promise<AccountActionResult> {
  const locale = String(formData.get('locale') ?? 'fr') as Locale;
  const ctx = await getAccessContext(locale);
  const username = String(formData.get('username') ?? '').trim();
  const profile_id = String(formData.get('profile_id') ?? '');
  const first_name = String(formData.get('first_name') ?? '').trim() || null;
  const scope_kind = String(formData.get('scope_kind') ?? 'all');
  const scope_ids_raw = String(formData.get('scope_ids') ?? '');
  const scope_ids = scope_ids_raw ? scope_ids_raw.split(',').map((s) => s.trim()).filter(Boolean) : [];

  if (!(PROFILE_IDS as readonly string[]).includes(profile_id)) {
    return { status: 'error', messageKey: 'admin.accounts.error.invalid' };
  }

  const scope = scope_kind === 'all'
    ? { kind: 'all' as const }
    : { kind: scope_kind as 'dr' | 'cvr' | 'rs', ids: scope_ids };

  const result = await accountRepository.createAccount(ctx, { username, profile_id, scope, first_name });
  if (result.status === 'refused') {
    const key = result.reason === 'duplicate' ? 'admin.accounts.error.duplicate'
      : result.reason === 'forbidden' ? 'admin.accounts.error.forbidden'
        : 'admin.accounts.error.invalid';
    return { status: 'error', messageKey: key };
  }
  revalidatePath('/', 'layout');
  return { status: 'ok' };
}

export async function deactivateAccountAction(formData: FormData): Promise<AccountActionResult> {
  const locale = String(formData.get('locale') ?? 'fr') as Locale;
  const ctx = await getAccessContext(locale);
  const username = String(formData.get('username') ?? '');
  const result = await accountRepository.deactivateAccount(ctx, username);
  if (result.status === 'refused') {
    return { status: 'error', messageKey: result.reason === 'forbidden' ? 'admin.accounts.error.forbidden' : 'admin.accounts.error.not_found' };
  }
  revalidatePath('/', 'layout');
  return { status: 'ok' };
}

export async function resetPasswordAction(formData: FormData): Promise<AccountActionResult> {
  const locale = String(formData.get('locale') ?? 'fr') as Locale;
  const ctx = await getAccessContext(locale);
  const username = String(formData.get('username') ?? '');
  const result = await accountRepository.resetAccountPassword(ctx, username);
  if (result.status === 'refused') {
    return { status: 'error', messageKey: result.reason === 'forbidden' ? 'admin.accounts.error.forbidden' : 'admin.accounts.error.not_found' };
  }
  revalidatePath('/', 'layout');
  return { status: 'ok', temp_password: result.temp_password };
}

export async function changePasswordAction(formData: FormData): Promise<AccountActionResult> {
  const username_cookie = formData.get('username_cookie');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (!username_cookie || !password || password !== confirm || password.length < 6) {
    return { status: 'error', messageKey: 'auth.change_password.invalid' };
  }
  const result = await accountRepository.changePassword(String(username_cookie), hashPassword(password));
  if (result.status === 'refused') {
    return { status: 'error', messageKey: 'auth.error' };
  }
  revalidatePath('/', 'layout');
  return { status: 'ok' };
}

// ---------------------------------------------------------------------------
// Compatibilité descendante : ancienne simulation de profil (provider_admin)
// ---------------------------------------------------------------------------

/** @deprecated Conservé pour ProfileSwitcher (provider_admin uniquement). Supprimé à l'étape B. */
export async function setSimulatedProfile(formData: FormData): Promise<void> {
  const raw = String(formData.get('profile') ?? '');
  const id = parseProfileCookie(`${PROFILE_COOKIE_PREFIX}${raw}`);
  const jar = await cookies();
  jar.set(PROFILE_COOKIE, `${PROFILE_COOKIE_PREFIX}${id}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  revalidatePath('/', 'layout');
}

/** @deprecated Remplacé par loginAction. Conservé pour la compatibilité des tests. */
export async function enterAsProfile(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr');
  await setSimulatedProfile(formData);
  redirect(`/${(LOCALES as readonly string[]).includes(locale) ? locale : 'fr'}`);
}
