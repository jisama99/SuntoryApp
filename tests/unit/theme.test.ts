import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTheme } from '@/lib/theme';
import { read, ROOT, walk } from './util';

describe('préférence d\'affichage (D124)', () => {
  it('valeurs connues conservées, tout le reste retombe sur Système', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('system')).toBe('system');
    expect(parseTheme('sombre')).toBe('system');
    expect(parseTheme(undefined)).toBe('system');
  });

  it('aucune couleur en dur dans les composants : seuls les jetons de la charte sont utilisés', () => {
    const files = walk(path.join(ROOT, 'src'), (f) => f.endsWith('.tsx'));
    const bad = files.filter((f) => /#[0-9a-fA-F]{6}\b|\b(?:bg|text|border)-\[#/.test(read(f)));
    expect(bad).toEqual([]);
  });
});
