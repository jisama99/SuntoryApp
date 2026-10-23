'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';
import { repository } from '@/data';
import { HOME_SKINS, LOCALES } from '@/domain/types';
import type { HomeSkin, Locale } from '@/domain/types';
import { SESSION_COOKIE } from '@/lib/auth';
import { getAccessContext, getSession, PROFILE_COOKIE, PROFILE_COOKIE_PREFIX, parseProfileCookie } from '@/lib/session';

/** « Visualiser comme » : réservé au compte du prestataire (D188). Choisir son propre profil revient à sa vue. */
export async function setSimulatedProfile(formData: FormData): Promise<void> {
  const session = await getSession();
  if (session?.account.profile !== 'provider_admin') return;
  const raw = String(formData.get('profile') ?? '');
  const id = parseProfileCookie(`${PROFILE_COOKIE_PREFIX}${raw}`);
  const jar = await cookies();
  if (raw === 'provider_admin') jar.delete(PROFILE_COOKIE);
  else jar.set(PROFILE_COOKIE, `${PROFILE_COOKIE_PREFIX}${id}`, { httpOnly: true, sameSite: 'lax', path: '/' });
  revalidatePath('/', 'layout');
}

/** Déconnexion : le cookie de session et celui de visualisation sont supprimés, retour à la connexion. */
export async function signOut(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'fr');
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(PROFILE_COOKIE);
  redirect(`/${(LOCALES as readonly string[]).includes(locale) ? locale : 'fr'}/start`);
}

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
