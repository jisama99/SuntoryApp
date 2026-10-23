/**
 * Limitation des essais de connexion (D188, démonstrateur) : 5 échecs en 10 minutes bloquent l'identifiant 5 minutes.
 * La clé est l'identifiant saisi, qu'il existe ou non : le blocage ne révèle rien sur les comptes. Fonctions pures, le
 * temps est passé en argument. Écarts à reprendre à l'étape B : blocage par adresse, verrouillage de compte, journal.
 */
export const MAX_FAILURES = 5;
export const WINDOW_MS = 10 * 60 * 1000;
export const LOCK_MS = 5 * 60 * 1000;

export interface AttemptState {
  failures: number[];
  lockedUntil: number;
}

export const emptyState = (): AttemptState => ({ failures: [], lockedUntil: 0 });

export const isLocked = (s: AttemptState, now: number): boolean => now < s.lockedUntil;

export function recordFailure(s: AttemptState, now: number): AttemptState {
  const failures = [...s.failures.filter((t) => now - t < WINDOW_MS), now];
  return { failures, lockedUntil: failures.length >= MAX_FAILURES ? now + LOCK_MS : s.lockedUntil };
}

export const recordSuccess = (): AttemptState => emptyState();

export const normalizeKey = (username: string): string => username.trim().toLowerCase().slice(0, 64);
