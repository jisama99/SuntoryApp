'use server';

import { revalidatePath } from 'next/cache';
import { repository } from '@/data';
import type { DeadlineEntryInput } from '@/data/repository';
import { PARAM_KEYS } from '@/data/schemas';
import type { ParamKey } from '@/data/schemas';
import { DISPOSITIFS, LOCALES, PRESET_IDS } from '@/domain/types';
import type { Dispositif, Locale, PresetId } from '@/domain/types';
import { isValidIsoDate } from '@/domain/week';
import { getAccessContext } from '@/lib/session';
import { undoable } from '@/lib/undoable';

type Outcome = { status: 'ok'; undoToken?: string } | { status: 'refused'; reason: string } | { status: 'invalid' };

const asLocale = (v: unknown): Locale | null => ((LOCALES as readonly string[]).includes(String(v)) ? (v as Locale) : null);

/** Modification d'un paramètre de dispositif (F-30.10) : agence administration seule, vérifié par la couche données. */
export async function updateParamAction(payload: { locale: string; dispositif: string; key: string; value: unknown }): Promise<Outcome> {
  const locale = asLocale(payload.locale);
  if (!locale || !(DISPOSITIFS as readonly string[]).includes(payload.dispositif) || !(PARAM_KEYS as readonly string[]).includes(payload.key)) {
    return { status: 'invalid' };
  }
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.updateDispositifParam(ctx, payload.dispositif as Dispositif, payload.key as ParamKey, payload.value));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}

export async function updateDeadlineAction(payload: { locale: string; entry: DeadlineEntryInput }): Promise<Outcome> {
  const locale = asLocale(payload.locale);
  const e = payload.entry;
  if (!locale || (e.mode === 'fixed' && !isValidIsoDate(e.fixedDate ?? ''))) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.updateDeadlineEntry(ctx, e));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}

export async function setDefaultPresetAction(payload: { locale: string; preset: string }): Promise<Outcome> {
  const locale = asLocale(payload.locale);
  if (!locale || !(PRESET_IDS as readonly string[]).includes(payload.preset)) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.setDefaultPreset(ctx, payload.preset as PresetId));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}

export async function decideReopeningAction(payload: {
  locale: string;
  requestId: string | null;
  decision: 'grant' | 'decline';
  scope: 'month' | 'week';
  target: string;
  zoneId: string;
  reason: string;
  expiresOn: string;
}): Promise<Outcome> {
  const locale = asLocale(payload.locale);
  if (!locale || (payload.decision === 'grant' && !isValidIsoDate(payload.expiresOn))) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.decideReopening(ctx, {
    requestId: payload.requestId, decision: payload.decision, scope: payload.scope, target: payload.target,
    zoneId: payload.zoneId, reason: String(payload.reason), expiresOn: payload.expiresOn,
  }));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}

export async function decideOutboxAction(payload: { locale: string; id: string; decision: 'validated' | 'discarded' }): Promise<Outcome> {
  const locale = asLocale(payload.locale);
  if (!locale) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.decideOutbox(ctx, payload.id, payload.decision));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}
