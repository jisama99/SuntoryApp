import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { repository } from '@/data';
import type { PublicAccount } from '@/data/schemas';
import { emptyState, isLocked, normalizeKey, recordFailure } from './login-throttle';
import type { AttemptState } from './login-throttle';

export const SESSION_COOKIE = 'demo_session';
export const VIEW_AS_COOKIE = 'demo_view_as';
export const SESSION_MAX_AGE_S = 8 * 60 * 60;

/** Durée minimale d'une réponse de connexion : constante, quel que soit le résultat (D188). */
export const LOGIN_MIN_MS = Number(process.env.DEMO_LOGIN_MIN_MS ?? 400);

// Clé de signature : variable d'environnement, sinon tirée au démarrage (les sessions ne survivent pas au redémarrage).
const g = globalThis as typeof globalThis & { __suntorySessionKey?: string; __suntoryAttempts?: Map<string, AttemptState> };
const key = () => (g.__suntorySessionKey ??= process.env.DEMO_SESSION_SECRET ?? randomBytes(32).toString('hex'));
const attempts = () => (g.__suntoryAttempts ??= new Map<string, AttemptState>());

const mac = (accountId: string) => createHmac('sha256', key()).update(accountId).digest('hex');

export const signSession = (accountId: string): string => `${accountId}.${mac(accountId)}`;

/** Identifiant de compte d'un jeton valide, sinon null. Comparaison à temps constant. */
export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const [id, signature] = token.split('.');
  if (!id || !signature) return null;
  const expected = Buffer.from(mac(id), 'hex');
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Complète le temps écoulé jusqu'à la durée minimale. */
export async function padTo(startedAt: number, minMs: number = LOGIN_MIN_MS): Promise<void> {
  await wait(Math.max(0, minMs - (performance.now() - startedAt)));
}

/**
 * Tentative de connexion. Résultat unique en cas d'échec (null), que l'identifiant soit inconnu, désactivé, bloqué ou
 * que le mot de passe soit faux ; le calcul de hachage et la durée sont les mêmes dans tous les cas.
 */
export async function attemptLogin(username: string, password: string): Promise<PublicAccount | null> {
  const startedAt = performance.now();
  const k = normalizeKey(username);
  const state = attempts().get(k) ?? emptyState();
  const locked = isLocked(state, startedAt);
  const account = await repository.authenticate(username, password);
  const granted = locked ? null : account;
  if (granted) attempts().delete(k);
  else attempts().set(k, locked ? state : recordFailure(state, startedAt));
  await padTo(startedAt);
  return granted;
}

/** Remise à zéro des essais (tests). */
export const resetAttempts = () => attempts().clear();
