'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { repository } from '@/data';
import { LOCALES } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';
import { undoable } from '@/lib/undoable';

export type DelegationOutcome = { status: 'ok'; undoToken?: string } | { status: 'refused'; reason: string } | { status: 'invalid' };

const asLocale = (v: unknown): Locale | null => ((LOCALES as readonly string[]).includes(String(v)) ? (v as Locale) : null);
const Id = z.string().uuid();
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Désignation d'un suppléant (F-30.3) : agence administration seule, contrôlée par la couche de données. */
export async function createDelegationAction(p: { locale: string; delegatorZoneId: string; substituteZoneId: string; startDate: string; endDate: string }): Promise<DelegationOutcome> {
  const locale = asLocale(p.locale);
  const parsed = z.object({ delegatorZoneId: Id, substituteZoneId: Id, startDate: IsoDate, endDate: IsoDate }).safeParse(p);
  if (!locale || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.createDelegation(ctx, parsed.data));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

/** Révocation : la délégation reste au dossier avec sa trace. */
export async function revokeDelegationAction(p: { locale: string; delegationId: string }): Promise<DelegationOutcome> {
  const locale = asLocale(p.locale);
  if (!locale || !Id.safeParse(p.delegationId).success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.revokeDelegation(ctx, p.delegationId));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}
