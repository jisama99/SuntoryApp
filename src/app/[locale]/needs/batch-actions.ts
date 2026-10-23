'use server';

import { revalidatePath } from 'next/cache';
import { repository } from '@/data';
import type { BatchResult } from '@/data/repository';
import { BatchRowsSchema } from '@/data/schemas';
import { LOCALES } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { presentParams } from '@/lib/format';
import { getAccessContext } from '@/lib/session';
import type { FindingDto } from './actions';

export interface BatchLineDto extends Omit<BatchResult['lines'][number], 'findings'> {
  findings: FindingDto[];
}
export interface BatchDto {
  lines: BatchLineDto[];
  saved: number;
  rejected: number;
  needsConfirmation: number;
  ignored: number;
}
export type BatchState = ({ status: 'done' } & BatchDto) | { status: 'invalid' };

const asLocale = (v: unknown): Locale | null => ((LOCALES as readonly string[]).includes(String(v)) ? (v as Locale) : null);

/** Enregistre un lot : chaque ligne passe par les mêmes règles que la saisie unitaire, les lignes valides seules sont créées. */
export async function saveBatchAction(payload: { locale: string; rows: unknown; confirm?: number[]; defer?: number[] }): Promise<BatchState> {
  const locale = asLocale(payload.locale);
  const parsed = BatchRowsSchema.safeParse(payload.rows);
  if (!locale || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const result = await repository.saveNeedsBatch(ctx, parsed.data, { confirm: payload.confirm ?? [], defer: payload.defer ?? [] });
  if (result.saved > 0) revalidatePath('/', 'layout');
  return {
    status: 'done',
    ...result,
    lines: result.lines.map((l) => ({ ...l, findings: l.findings.map((f) => ({ ...f, params: presentParams(f.params, locale) })) })),
  };
}

/** Brouillon automatique du lot (reprise après fermeture). */
export async function saveBatchDraftAction(payload: { locale: string; rows: unknown }): Promise<{ status: 'ok' | 'invalid' | 'refused' }> {
  const locale = asLocale(payload.locale);
  const parsed = BatchRowsSchema.safeParse(payload.rows);
  if (!locale || !parsed.success) return { status: 'invalid' };
  const r = await repository.saveBatchDraft(await getAccessContext(locale), parsed.data);
  return { status: r.status === 'ok' ? 'ok' : 'refused' };
}

export async function clearBatchDraftAction(payload: { locale: string }): Promise<void> {
  const locale = asLocale(payload.locale);
  if (locale) await repository.clearBatchDraft(await getAccessContext(locale));
}

/** Résout les codes de secteur collés dans le périmètre du profil (agence). */
export async function resolveSectorsAction(payload: { locale: string; codes: string[] }): Promise<Array<{ id: string; code: string }>> {
  const locale = asLocale(payload.locale);
  if (!locale) return [];
  return repository.resolveSectorCodes(await getAccessContext(locale), payload.codes.slice(0, 60).map((c) => String(c).slice(0, 40)));
}
