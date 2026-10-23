/**
 * Tests unitaires -- Lot A1f : module d'authentification (D188).
 */
import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  encodeSession,
  decodeSession,
  isRateLimited,
  recordAttempt,
  clearAttempts,
} from '@/lib/auth';

describe('hashPassword / verifyPassword', () => {
  it('produit un hash de 64 caracteres hex', () => {
    const h = hashPassword('MonMotDePasse!');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('verification correcte : meme mot de passe', () => {
    const h = hashPassword('Demo_Agence_2026');
    expect(verifyPassword('Demo_Agence_2026', h)).toBe(true);
  });

  it('verification incorrecte : mauvais mot de passe', () => {
    const h = hashPassword('Demo_Agence_2026');
    expect(verifyPassword('mauvais', h)).toBe(false);
  });

  it('deux mots de passe differents -> hashs differents', () => {
    expect(hashPassword('abc')).not.toBe(hashPassword('def'));
  });
});

describe('encodeSession / decodeSession', () => {
  it('cycle encode -> decode retrouve le nom utilisateur', async () => {
    const value = encodeSession('AgAdmin01');
    expect(decodeSession(value)).toBe('AgAdmin01');
  });

  it('cookie altere -> null', () => {
    const value = encodeSession('AgAdmin01');
    const tampered = value.slice(0, -2) + 'XX';
    expect(decodeSession(tampered)).toBeNull();
  });

  it('cookie absent -> null', () => {
    expect(decodeSession(undefined)).toBeNull();
    expect(decodeSession('')).toBeNull();
  });

  it('cookie sans point -> null', () => {
    expect(decodeSession('nopointhere')).toBeNull();
  });
});

describe('rate limiting', () => {
  const user = `test-rate-${Date.now()}`;

  it('pas limite au depart', () => {
    expect(isRateLimited(user)).toBe(false);
  });

  it('bloque apres 5 tentatives', () => {
    for (let i = 0; i < 5; i++) recordAttempt(user);
    expect(isRateLimited(user)).toBe(true);
  });

  it('clearAttempts leve le verrou', () => {
    clearAttempts(user);
    expect(isRateLimited(user)).toBe(false);
  });
});
