import { createHash, createHmac, timingSafeEqual } from 'crypto';

// Clé HMAC de démonstration (étape A). Étape B : variable d'environnement forte, bcrypt.
const DEMO_SECRET = process.env.DEMO_SESSION_SECRET ?? 'suntory-demo-secret-2026';

export const SESSION_COOKIE = 'suntory_session';
export const SESSION_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 heures

// Compteur de tentatives en mémoire (étape A). Étape B : base de données + verrouillage.
const attempts = new Map<string, number>();
const MAX_ATTEMPTS = 5;
// Délai constant pour ne pas révéler l'existence d'un identifiant.
const REPLY_DELAY_MS = 200;

export function hashPassword(password: string): string {
  return createHash('sha256').update(`suntory:${password}`).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function encodeSession(username: string): string {
  const sig = createHmac('sha256', DEMO_SECRET).update(username).digest('hex');
  return `${username}.${sig}`;
}

export function decodeSession(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 1) return null;
  const username = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac('sha256', DEMO_SECRET).update(username).digest('hex');
  try {
    if (timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return username;
  } catch {
    // signature invalide
  }
  return null;
}

export function isRateLimited(username: string): boolean {
  return (attempts.get(username) ?? 0) >= MAX_ATTEMPTS;
}

export function recordAttempt(username: string): void {
  attempts.set(username, (attempts.get(username) ?? 0) + 1);
}

export function clearAttempts(username: string): void {
  attempts.delete(username);
}

export async function constantDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, REPLY_DELAY_MS));
}
