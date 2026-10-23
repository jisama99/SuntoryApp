import { describe, expect, it } from 'vitest';
import { formatDate, formatIsoWeek } from '@/lib/format';
import { DEFAULT_PROFILE, parseProfileCookie } from '@/lib/profile-cookie';

describe('formats selon la langue', () => {
  it('date ISO affichée jj/mm/aaaa dans les deux langues (EN : Royaume-Uni, à confirmer)', () => {
    expect(formatDate('2026-12-28', 'fr')).toBe('28/12/2026');
    expect(formatDate('2026-12-28', 'en')).toBe('28/12/2026');
  });
  it('semaine stockée 2026-S53, affichée W en anglais', () => {
    expect(formatIsoWeek('2026-S53', 'fr')).toBe('2026-S53');
    expect(formatIsoWeek('2026-S53', 'en')).toBe('2026-W53');
  });
  it('une date illisible est rendue telle quelle', () => {
    expect(formatDate('n/a', 'fr')).toBe('n/a');
  });
});

describe('cookie de simulation de profil', () => {
  it('format distinct d\'une session : préfixe sim.', () => {
    expect(parseProfileCookie('sim.rs')).toBe('rs');
    expect(parseProfileCookie('rs')).toBe(DEFAULT_PROFILE);
  });
  it('valeur inconnue ou absente : profil par défaut', () => {
    expect(parseProfileCookie('sim.admin_global')).toBe(DEFAULT_PROFILE);
    expect(parseProfileCookie(undefined)).toBe(DEFAULT_PROFILE);
    expect(parseProfileCookie('')).toBe(DEFAULT_PROFILE);
  });
});
