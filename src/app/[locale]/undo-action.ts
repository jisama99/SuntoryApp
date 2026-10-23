'use server';

import { revalidatePath } from 'next/cache';
import { repository } from '@/data';
import { LOCALES } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Annule la dernière écriture de l'utilisateur, tant qu'aucune autre écriture ne l'a suivie (D159). */
export async function undoWriteAction(payload: { locale: string; token: string }): Promise<{ status: 'ok' | 'expired' | 'forbidden' | 'invalid' }> {
  if (!(LOCALES as readonly string[]).includes(payload.locale) || typeof payload.token !== 'string') return { status: 'invalid' };
  const r = await repository.undoWrite(await getAccessContext(payload.locale as Locale), payload.token);
  if (r.status === 'ok') {
    revalidatePath('/', 'layout');
    return { status: 'ok' };
  }
  return { status: r.reason };
}
