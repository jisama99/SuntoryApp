'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';
import { PROFILE_COOKIE, PROFILE_COOKIE_PREFIX, parseProfileCookie } from '@/lib/session';

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

export async function setTheme(formData: FormData): Promise<void> {
  const theme = parseTheme(String(formData.get('theme') ?? ''));
  const jar = await cookies();
  jar.set(THEME_COOKIE, theme, { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  revalidatePath('/', 'layout');
}
