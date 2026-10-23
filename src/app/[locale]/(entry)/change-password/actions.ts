'use server';

import { repository } from '@/data';
import { LOCALES } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { redirect as nextRedirect } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { safeReturnTo } from '@/lib/return-to';
import { getSession } from '@/lib/session';

type Reason = 'weak' | 'same' | 'invalid';

/** Changement du mot de passe par la personne connectée. Aucun mot de passe n'est renvoyé ni journalisé. */
export async function changePasswordAction(payload: { locale: string; current: string; next: string; returnTo?: string | null }): Promise<{ status: 'ok' } | { status: 'refused'; reason: Reason }> {
  const locale = (LOCALES as readonly string[]).includes(payload.locale) ? (payload.locale as Locale) : 'fr';
  const session = await getSession();
  if (!session || typeof payload.current !== 'string' || typeof payload.next !== 'string') redirect({ href: '/start', locale });
  const r = await repository.changePassword((session as NonNullable<typeof session>).account.id, payload.current, payload.next);
  if (r.status === 'ok') {
    const back = safeReturnTo(payload.returnTo);
    if (back) nextRedirect(back);
    redirect({ href: '/', locale });
  }
  return { status: 'refused', reason: r.status === 'refused' && (r.reason === 'weak' || r.reason === 'same') ? r.reason : 'invalid' };
}
