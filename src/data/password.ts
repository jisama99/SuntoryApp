import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Hachage de mot de passe du démonstrateur (D188). scrypt du module standard, sel aléatoire par compte. Écart à reprendre
 * à l'étape B : paramètres de coût validés, hachage dans la base, verrouillage et double facteur (compte rendu A1f).
 */
export interface PasswordHash {
  salt: string;
  hash: string;
}

const KEY_LENGTH = 32;

export function hashPassword(plain: string, salt: string = randomBytes(16).toString('hex')): PasswordHash {
  return { salt, hash: scryptSync(plain, salt, KEY_LENGTH).toString('hex') };
}

export function verifyPassword(plain: string, stored: PasswordHash): boolean {
  const candidate = scryptSync(plain, stored.salt, KEY_LENGTH);
  const expected = Buffer.from(stored.hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/** Empreinte de comparaison pour un identifiant inconnu : le calcul coûte autant, la réponse ne révèle rien. */
let dummy: PasswordHash | null = null;
export const dummyHash = (): PasswordHash => (dummy ??= hashPassword('placeholder', '00'.repeat(16)));

/** Sans caractères ambigus (0, O, 1, l, I). */
const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePassword(length = 14): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}
