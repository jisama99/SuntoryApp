'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { repository } from '@/data';
import type { StepInput } from '@/data/repository';
import { ProposalInputSchema } from '@/data/schemas';
import type { ProposalIssue } from '@/domain/pipeline';
import { DECISION_OUTCOMES, ESCALATION_CASES, LOCALES, NOTE_OBJECT_KINDS, NOTE_VISIBILITIES, RECRUITMENT_STEPS } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';
import { undoable } from '@/lib/undoable';

/** Résultat d'écriture rendu à l'écran : jamais de donnée interne, seulement l'issue, la raison et le jeton d'annulation. */
export type WriteState =
  | { status: 'ok'; undoToken?: string; detail?: Record<string, number> }
  | { status: 'refused'; reason: string; issues?: ProposalIssue[] }
  | { status: 'invalid' };

const asLocale = (v: unknown): Locale | null => ((LOCALES as readonly string[]).includes(String(v)) ? (v as Locale) : null);
const Id = z.string().uuid();
const done = <T extends { status: string }>(r: T & { undoToken?: string }): void => {
  if (r.status === 'ok' || r.status === 'saved') revalidatePath('/', 'layout');
};

export async function qualifyNeedAction(payload: { locale: string; needId: string; outcome: string; motive?: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  if (!locale || !Id.safeParse(payload.needId).success || !['take', 'clarify', 'reject'].includes(payload.outcome)) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.qualifyNeed(ctx, payload.needId, { outcome: payload.outcome as 'take', motive: String(payload.motive ?? '') }));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

export async function saveProposalAction(payload: { locale: string; needId: string; input: unknown; send: boolean }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  const parsed = ProposalInputSchema.safeParse(payload.input);
  if (!locale || !Id.safeParse(payload.needId).success || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.saveProposal(ctx, payload.needId, parsed.data, { send: payload.send === true }));
  done(r);
  if (r.status === 'saved') return { status: 'ok', undoToken: r.undoToken, detail: { sent: r.sent ? 1 : 0, invalidated: r.invalidated } };
  return { status: 'refused', reason: r.reason, ...(r.issues ? { issues: r.issues } : {}) };
}

export async function withdrawProposalAction(payload: { locale: string; proposalId: string; motive: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  if (!locale || !Id.safeParse(payload.proposalId).success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.withdrawProposal(ctx, payload.proposalId, String(payload.motive ?? '')));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

const Decision = z.object({ outcome: z.enum(DECISION_OUTCOMES), motive: z.string().max(280).optional() });

export async function decideAction(payload: { locale: string; proposalId: string; outcome: string; motive?: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  const parsed = Decision.safeParse({ outcome: payload.outcome, motive: payload.motive });
  if (!locale || !Id.safeParse(payload.proposalId).success || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.decideProposal(ctx, payload.proposalId, parsed.data));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

/** Validation en lot : une seule annulation défait tout le lot. */
export async function decideBatchAction(payload: { locale: string; proposalIds: string[]; outcome: string; motive?: string }): Promise<
  | { status: 'ok'; undoToken?: string; decided: number; refused: number; reasons: string[] }
  | { status: 'invalid' }
> {
  const locale = asLocale(payload.locale);
  const parsed = Decision.safeParse({ outcome: payload.outcome, motive: payload.motive });
  if (!locale || !parsed.success || !Array.isArray(payload.proposalIds) || payload.proposalIds.length === 0 || payload.proposalIds.length > 60 || !payload.proposalIds.every((i) => Id.safeParse(i).success)) {
    return { status: 'invalid' };
  }
  const ctx = await getAccessContext(locale);
  const { result, undoToken } = await repository.withUndo(ctx, () => repository.decideBatch(ctx, payload.proposalIds, parsed.data), (r) => r.decided > 0);
  if (result.decided > 0) revalidatePath('/', 'layout');
  return {
    status: 'ok', ...(undoToken ? { undoToken } : {}), decided: result.decided, refused: result.refused,
    reasons: [...new Set(result.items.flatMap((i) => (i.reason ? [i.reason] : [])))],
  };
}

const Step = z.object({ step: z.enum(RECRUITMENT_STEPS), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), motive: z.string().max(280).optional(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), fromSectorId: Id.optional() });

export async function recordStepAction(payload: { locale: string; needId: string; step: string; date?: string; motive?: string; time?: string; fromSectorId?: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  const parsed = Step.safeParse({ step: payload.step, date: payload.date || undefined, motive: payload.motive || undefined, time: payload.time || undefined, fromSectorId: payload.fromSectorId || undefined });
  if (!locale || !Id.safeParse(payload.needId).success || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const { step, ...rest } = parsed.data;
  const input: StepInput = rest;
  const r = await undoable(ctx, () => repository.recordStep(ctx, payload.needId, step, input));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

const NoteIn = z.object({
  objectKind: z.enum(NOTE_OBJECT_KINDS), objectId: Id, text: z.string().min(1).max(500), visibility: z.enum(NOTE_VISIBILITIES),
  recipientZoneId: Id.optional(), confirmShare: z.boolean().optional(),
});

export async function addNoteAction(payload: { locale: string } & Record<string, unknown>): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  const parsed = NoteIn.safeParse({ ...payload, recipientZoneId: payload.recipientZoneId || undefined });
  if (!locale || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.addNote(ctx, parsed.data));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

export async function withdrawNoteAction(payload: { locale: string; noteId: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  if (!locale || !Id.safeParse(payload.noteId).success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.withdrawNote(ctx, payload.noteId));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

// ---- Lot A3c : validation managériale (CVR, DR) ----
const ValidationIn = z.object({ outcome: z.enum(['validated', 'refused']), motive: z.string().max(280).optional() });

export async function validateNeedAction(payload: { locale: string; needId: string; outcome: string; motive?: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  const parsed = ValidationIn.safeParse({ outcome: payload.outcome, motive: payload.motive });
  if (!locale || !Id.safeParse(payload.needId).success || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.validateNeed(ctx, payload.needId, parsed.data));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

const EscalationIn = z.object({ case: z.enum(ESCALATION_CASES), motive: z.string().max(280), concernedZoneId: Id.optional() });

export async function escalateNeedAction(payload: { locale: string; needId: string; case: string; motive: string; concernedZoneId?: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  const parsed = EscalationIn.safeParse({ case: payload.case, motive: payload.motive ?? '', concernedZoneId: payload.concernedZoneId || undefined });
  if (!locale || !Id.safeParse(payload.needId).success || !parsed.success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.escalateNeed(ctx, payload.needId, parsed.data));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

export async function resubmitNeedAction(payload: { locale: string; needId: string }): Promise<WriteState> {
  const locale = asLocale(payload.locale);
  if (!locale || !Id.safeParse(payload.needId).success) return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.resubmitNeed(ctx, payload.needId));
  done(r);
  return r.status === 'ok' ? { status: 'ok', undoToken: r.undoToken } : { status: 'refused', reason: r.reason };
}

/** Validation en lot avec motif commun : une seule annulation défait tout le lot. */
export async function validateBatchAction(payload: { locale: string; needIds: string[]; outcome: string; motive?: string }): Promise<
  | { status: 'ok'; undoToken?: string; done: number; refused: number; reasons: string[] }
  | { status: 'invalid' }
> {
  const locale = asLocale(payload.locale);
  const parsed = ValidationIn.safeParse({ outcome: payload.outcome, motive: payload.motive });
  if (!locale || !parsed.success || !Array.isArray(payload.needIds) || payload.needIds.length === 0 || payload.needIds.length > 60 || !payload.needIds.every((i) => Id.safeParse(i).success)) {
    return { status: 'invalid' };
  }
  const ctx = await getAccessContext(locale);
  const { result, undoToken } = await repository.withUndo(ctx, () => repository.validateBatch(ctx, payload.needIds, parsed.data), (r) => r.done > 0);
  if (result.done > 0) revalidatePath('/', 'layout');
  return {
    status: 'ok', ...(undoToken ? { undoToken } : {}), done: result.done, refused: result.refused,
    reasons: [...new Set(result.items.flatMap((i) => (i.reason ? [i.reason] : [])))],
  };
}
