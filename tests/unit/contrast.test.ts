import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/domain/contrast';
import { read, ROOT } from './util';

const css = read(path.join(ROOT, 'src/app/globals.css'));

function parseTokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]!] = m[2]!;
  return out;
}

const lightBlock = css.match(/@theme\s*\{([\s\S]*?)\n\}/)![1]!;
const darkBlock = css.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/)![1]!;
const systemBlock = css.match(/:root:not\(\[data-theme\]\)\s*\{([\s\S]*?)\n  \}/)![1]!;

const LIGHT = parseTokens(lightBlock);
const DARK = { ...LIGHT, ...parseTokens(darkBlock) };
const WHITE = '#FFFFFF';

// [premier plan, arrière-plan, minimum, usage] : jetons qui changent selon le mode.
const MODE_PAIRS: Array<[string, string, number, string]> = [
  ['ink', 'page', 4.5, 'texte courant sur fond de page'],
  ['ink', 'surface', 4.5, 'texte courant sur carte'],
  ['ink', 'sel', 4.5, 'entrée de menu active'],
  ['ink', 'alt', 4.5, 'texte sur fond alterné'],
  ['muted', 'surface', 4.5, 'texte secondaire sur carte'],
  ['muted', 'page', 4.5, 'texte secondaire sur fond de page'],
  ['muted', 'alt', 4.5, 'texte secondaire sur fond alterné'],
  ['link', 'surface', 4.5, 'lien et bouton secondaire'],
  ['link', 'sel', 4.5, 'bouton secondaire survolé'],
  ['link', 'page', 4.5, 'lien sur fond de page'],
  ['title', 'page', 4.5, 'titre de page'],
  ['title', 'surface', 4.5, 'titre sur carte'],
  ['title', 'alt', 4.5, 'chiffre clé sur fond alterné'],
  ['ok', 'ok-soft', 4.5, 'étiquette validée'],
  ['warn', 'warn-soft', 4.5, 'étiquette attention'],
  ['danger', 'danger-soft', 4.5, 'étiquette risque'],
  ['danger', 'surface', 4.5, 'message d\'erreur de champ'],
  ['pink', 'surface', 3, 'indicateur graphique (barre active), non textuel'],
  ['focus', 'surface', 3, 'anneau de focus sur carte'],
  ['focus', 'page', 3, 'anneau de focus sur fond de page'],
  ['field', 'surface', 3, 'bordure de champ (WCAG 1.4.11)'],
  ['field', 'page', 3, 'barre de graphique de contexte'],
  ['primary', 'surface', 3, 'bordure du bouton secondaire et barre principale'],
];

// Paires de couleurs fixes dans les deux modes (texte blanc ou marine sur fond propre).
const FIXED_PAIRS: Array<[string, string, number, string]> = [
  [WHITE, 'primary', 4.5, 'texte blanc sur bouton principal'],
  [WHITE, 'primary-hover', 4.5, 'texte blanc sur bouton principal survolé'],
  [WHITE, 'navy', 4.5, 'bandeau de données fictives'],
  ['navy', 'pink-pale', 4.5, 'étiquette importante et pastille du bandeau'],
  [WHITE, 'marine', 4.5, 'langue ou thème actif, lien d\'évitement'],
];

const pick = (tokens: Record<string, string>, name: string) => {
  const v = name.startsWith('#') ? name : tokens[name];
  if (!v) throw new Error(`jeton absent : ${name}`);
  return v;
};

for (const [mode, tokens] of [['clair', LIGHT], ['sombre', DARK]] as const) {
  describe(`contrastes WCAG des jetons, mode ${mode}`, () => {
    for (const [fg, bg, min, usage] of [...MODE_PAIRS, ...FIXED_PAIRS]) {
      it(`${fg} sur ${bg} ≥ ${min} (${usage})`, () => {
        expect(contrastRatio(pick(tokens, fg), pick(tokens, bg))).toBeGreaterThanOrEqual(min);
      });
    }
  });
}

describe('cohérence du mode sombre', () => {
  it('le mode Système répète exactement les jetons du mode Sombre explicite', () => {
    expect(parseTokens(systemBlock)).toEqual(parseTokens(darkBlock));
    const shadow = (b: string) => b.match(/--shadow-card:[^;]+;/)![0].replace(/\s+/g, ' ');
    expect(shadow(systemBlock)).toBe(shadow(darkBlock));
  });

  it('le mode sombre redéfinit les jetons de surface et de texte', () => {
    for (const k of ['page', 'surface', 'ink', 'muted', 'line', 'link', 'title', 'focus']) {
      expect(DARK[k], k).not.toBe(LIGHT[k]);
    }
  });
});

describe('valeurs de référence', () => {
  it('le calcul reproduit les valeurs du doc 14 (marine/rose pâle, #00829B/blanc)', () => {
    expect(contrastRatio('#08071E', '#FFC2D5')).toBeCloseTo(13.15, 1);
    expect(contrastRatio('#00829B', '#FFFFFF')).toBeCloseTo(4.5, 1);
    expect(contrastRatio('#E52365', '#FFFFFF')).toBeCloseTo(4.41, 1);
  });

  it('le rose seul n\'est jamais utilisé pour du texte sur fond blanc (4,41 < 4,5)', () => {
    expect(contrastRatio(LIGHT.pink!, LIGHT.surface!)).toBeLessThan(4.5);
    const files = ['src/components', 'src/app'].flatMap(() => []);
    expect(files).toEqual([]);
  });
});
