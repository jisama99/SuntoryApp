'use server';

import { revalidatePath } from 'next/cache';
import { repository } from '@/data';
import type { PublicAccount } from '@/data/schemas';
import { scopeKindFor } from '@/domain/accounts';
import { LOCALES, PROFILE_IDS } from '@/domain/types';
import type { Locale, ProfileId, Scope } from '@/domain/types';
import { getAccessContext } from '@/lib/session';
import { undoable } from '@/lib/undoable';

type Refusal = { status: 'refused'; reason: string };
export type SecretOutcome = { status: 'ok'; account: PublicAccount; temporaryPassword: string; undoToken?: string } | Refusal | { status: 'invalid' };
export type Outcome = { status: 'ok'; undoToken?: string } | Refusal | { status: 'invalid' };

const asLocale = (v: unknown): Locale | null => ((LOCALES as readonly string[]).includes(String(v)) ? (v as Locale) : null);
const asProfile = (v: unknown): ProfileId | null => ((PROFILE_IDS as readonly string[]).includes(String(v)) ? (v as ProfileId) : null);

/** Périmètre d'un compte à partir du profil et de la zone choisie ; tout profil sans zone a le périmètre complet. */
function scopeOf(profile: ProfileId, zoneId: unknown): Scope | null {
  const kind = scopeKindFor(profile);
  if (kind === 'all') return { kind: 'all' };
  return typeof zoneId === 'string' && zoneId ? { kind, ids: [zoneId] } : null;
}

/** Création d'un compte (D189). Le mot de passe temporaire n'est rendu qu'ici, une seule fois ; il n'est jamais journalisé. */
export async function createAccountAction(p: { locale: string; username: string; profile: string; zoneId?: string }): Promise<SecretOutcome> {
  const locale = asLocale(p.locale);
  const profile = asProfile(p.profile);
  const scope = profile ? scopeOf(profile, p.zoneId) : null;
  if (!locale || !profile || !scope || typeof p.username !== 'string') return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.createAccount(ctx, { username: p.username, profile, scope }));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}

export async function setAccountActiveAction(p: { locale: string; accountId: string; active: boolean }): Promise<Outcome> {
  const locale = asLocale(p.locale);
  if (!locale || typeof p.accountId !== 'string') return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.setAccountActive(ctx, p.accountId, p.active === true));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}

export async function assignAccountAction(p: { locale: string; accountId: string; profile: string; zoneId?: string }): Promise<Outcome> {
  const locale = asLocale(p.locale);
  const profile = asProfile(p.profile);
  const scope = profile ? scopeOf(profile, p.zoneId) : null;
  if (!locale || !profile || !scope || typeof p.accountId !== 'string') return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.assignAccount(ctx, p.accountId, { profile, scope }));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}

export async function resetAccountPasswordAction(p: { locale: string; accountId: string }): Promise<SecretOutcome> {
  const locale = asLocale(p.locale);
  if (!locale || typeof p.accountId !== 'string') return { status: 'invalid' };
  const ctx = await getAccessContext(locale);
  const r = await undoable(ctx, () => repository.resetAccountPassword(ctx, p.accountId));
  if (r.status === 'ok') revalidatePath('/', 'layout');
  return r;
}
