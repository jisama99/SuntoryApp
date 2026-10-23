'use server';

import { revalidatePath } from 'next/cache';
import { repository } from '@/data';
import type { ReturnedFinding, SaveRefusal, SaveResult } from '@/data/repository';
import { NeedInputSchema } from '@/data/schemas';
import type { Gravity, RuleId } from '@/domain/rules';
import { LOCALES } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { isValidIsoDate } from '@/domain/week';
import { presentParams } from '@/lib/format';
import { getAccessContext } from '@/lib/session';

/** Constat prêt pour l'écran : paramètres déjà mis en forme dans la langue du profil. */
export interface FindingDto {
  rule: RuleId;
  gravity: Gravity;
  params: Record<string, string | number>;
  periodNo?: 1 | 2;
  relatedNeedId?: string;
  relatedVisible?: boolean;
  fix?: { periodNo: 1 | 2; field: 'start_week' | 'end_week'; value: string };
  defer?: { toMonth: string };
}

export type SaveState =
  | { status: 'saved'; decision: 'draft' | 'submit' | 'merge'; needId: string; needCode: string; deferred: boolean; findings: FindingDto[]; missing: string[] }
  | { status: 'needs_confirmation'; findings: FindingDto[]; missing: string[] }
  | { status: 'refused'; reason: SaveRefusal; findings: FindingDto[]; missing: string[] }
  | { status: 'invalid' };

const toDto = (f: ReturnedFinding, locale: Locale): FindingDto => ({ ...f, params: presentParams(f.params, locale) });

function toState(r: SaveResult, locale: Locale): SaveState {
  const findings = r.findings.map((f) => toDto(f, locale));
  if (r.status === 'saved') {
    return { status: 'saved', decision: r.decision, needId: r.need.id, needCode: r.need.need_code, deferred: Boolean(r.need.deferred_from_month), findings, missing: r.missing };
  }
  if (r.status === 'needs_confirmation') return { status: 'needs_confirmation', findings, missing: r.missing };
  return { status: 'refused', reason: r.reason, findings, missing: r.missing };
}

const asLocale = (v: unknown): Locale | null => ((LOCALES as readonly string[]).includes(String(v)) ? (v as Locale) : null);

export async function saveNeedAction(payload: {
  locale: string;
  input: unknown;
  confirm?: boolean;
  needId?: string;
  mergeInto?: string;
  deferToNextMonth?: boolean;
}): Promise<SaveState> {
  const locale = asLocale(payload.locale);
  const parsed = NeedInputSchema.safeParse(payload.input);
  if (!locale || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const result = await repository.saveNeed(ctx, parsed.data, {
    confirm: payload.confirm === true,
    needId: payload.needId,
    mergeInto: payload.mergeInto,
    deferToNextMonth: payload.deferToNextMonth === true,
  });
  if (result.status === 'saved') revalidatePath('/', 'layout');
  return toState(result, locale);
}

export async function duplicateNeedAction(payload: {
  locale: string;
  needId: string;
  newStart: string;
  confirm?: boolean;
  deferToNextMonth?: boolean;
}): Promise<SaveState> {
  const locale = asLocale(payload.locale);
  if (!locale || !isValidIsoDate(payload.newStart)) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const result = await repository.duplicateNeed(ctx, payload.needId, payload.newStart, { confirm: payload.confirm === true, deferToNextMonth: payload.deferToNextMonth === true });
  if (result.status === 'saved') revalidatePath('/', 'layout');
  return toState(result, locale);
}

export async function requestReopeningAction(payload: {
  locale: string;
  scope: 'month' | 'week';
  target: string;
  motive: string;
  desiredUntil: string;
}): Promise<{ status: 'ok' } | { status: 'refused'; reason: string } | { status: 'invalid' }> {
  const locale = asLocale(payload.locale);
  if (!locale || (payload.scope !== 'month' && payload.scope !== 'week') || !isValidIsoDate(payload.desiredUntil)) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await repository.requestReopening(ctx, {
    scope: payload.scope, target: payload.target, motive: String(payload.motive), desiredUntil: payload.desiredUntil,
  });
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}
