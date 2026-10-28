'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { repository } from '@/data';
import { LOCALES } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';
import { undoable } from '@/lib/undoable';

export type BudgetOutcome = { status: 'ok'; undoToken?: string } | { status: 'refused'; reason: string } | { status: 'invalid' };

const asLocale = (v: unknown): Locale | null => ((LOCALES as readonly string[]).includes(String(v)) ? (v as Locale) : null);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Motive = z.string().max(280).optional();

/** Nouvelle version de l'enveloppe nationale : direction cliente seule, contrôlée par la couche de données (D153). */
export async function setEnvelopeAction(p: { locale: string; amountEur: number; periodStart: string; periodEnd: string; motive?: string }): Promise<BudgetOutcome> {
  const locale = asLocale(p.locale);
  const parsed = z.object({ amountEur: z.number().finite(), periodStart: IsoDate, periodEnd: IsoDate, motive: Motive }).safeParse(p);
  if (!locale || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.setEnvelope(ctx, parsed.data));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

/** Création ou modification d'une ligne d'allocation : agence administration seule, total borné par l'enveloppe. */
export async function saveAllocationAction(p: { locale: string; campaign: string; cvrId: string; amountEur: number; motive?: string }): Promise<BudgetOutcome> {
  const locale = asLocale(p.locale);
  const parsed = z.object({ campaign: z.string().max(20), cvrId: z.string().uuid(), amountEur: z.number().finite(), motive: Motive }).safeParse(p);
  if (!locale || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.saveAllocation(ctx, parsed.data));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

/** Retrait d'une ligne : motif obligatoire, la trace reste au journal. */
export async function removeAllocationAction(p: { locale: string; lineId: string; motive: string }): Promise<BudgetOutcome> {
  const locale = asLocale(p.locale);
  const parsed = z.object({ lineId: z.string().uuid(), motive: z.string().max(280) }).safeParse(p);
  if (!locale || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.removeAllocation(ctx, parsed.data.lineId, parsed.data.motive));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}
