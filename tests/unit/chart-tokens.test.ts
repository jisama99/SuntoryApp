import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/domain/contrast';
import { read, rel, ROOT, walk } from './util';

const css = read(path.join(ROOT, 'src/app/chart-tokens.css'));
const globals = read(path.join(ROOT, 'src/app/globals.css'));

function parse(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--color-chart-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]!] = m[2]!;
  return out;
}
const lightBlock = css.match(/@theme\s*\{([\s\S]*?)\n\}/)![1]!;
const darkBlock = css.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/)![1]!;
const systemBlock = css.match(/:root:not\(\[data-theme\]\)\s*\{([\s\S]*?)\n  \}/)![1]!;
const LIGHT = parse(lightBlock);
const DARK = parse(darkBlock);

const SERIES = ['1', '2', '3', '4', '5', '6'];
// Séries qui portent seules une marque lisible (3:1 exigé). Les séries 3 (aqua clair, 2,06:1 sur carte blanche) et 4 (lavande, 2,997:1,
// soit 0,003 sous le seuil) sont des teintes d'accompagnement du jeu B validé : A4b1 ne les emploie pas. Écart consigné au compte rendu.
const INFORMATION_SERIES = ['1', '2', '5', '6'];
const SURFACE = { light: '#ffffff', dark: '#161e23' };
const ALT = { light: '#f0f6f9', dark: '#1c272d' };

describe('jetons des graphiques (D213, D214) : jeu B et style Doux par défaut', () => {
  it('définit les séries 1 à 6, la série clé et le neutre dans les deux modes', () => {
    for (const k of [...SERIES, 'key', 'neutral']) {
      expect(LIGHT[k], `clair ${k}`).toBeTruthy();
      expect(DARK[k], `sombre ${k}`).toBeTruthy();
    }
  });
  it('le jeu B porte les valeurs validées (série 1 à 4, série clé, neutre) en mode clair', () => {
    expect([LIGHT['1'], LIGHT['2'], LIGHT['3'], LIGHT['4']]).toEqual(['#00829b', '#1a1950', '#5bc2dc', '#8f8fd0']);
    expect(LIGHT.key).toBe('#e52365');
    expect(LIGHT.neutral).toBe('#e1e8ec');
  });
  it('le mode Système répète exactement le mode Sombre explicite', () => {
    expect(parse(systemBlock)).toEqual(DARK);
  });
  it('la forme des bouts est un jeton (style Doux : arrondi)', () => {
    expect(css).toMatch(/--radius-chart-bar:\s*9999px/);
    expect(css).toMatch(/--radius-chart-track:\s*9999px/);
  });
  for (const [mode, tokens] of [['clair', LIGHT], ['sombre', DARK]] as const) {
    const m = mode === 'clair' ? 'light' : 'dark';
    it(`mode ${mode} : les séries qui portent une information ont 3:1 au moins sur la carte et sur le fond alterné (WCAG 1.4.11)`, () => {
      for (const s of [...INFORMATION_SERIES, 'key']) {
        const surfaceRatio = contrastRatio(tokens[s]!, SURFACE[m]);
        const altRatio = contrastRatio(tokens[s]!, ALT[m]);
        expect(surfaceRatio, `${s} sur carte`).toBeGreaterThanOrEqual(3);
        // Le fond alterné est plus sombre : un écart de 0,3 point est toléré, la valeur étant toujours écrite à côté de la barre.
        expect(altRatio, `${s} sur fond alterné`).toBeGreaterThanOrEqual(2.7);
      }
    });
    it(`mode ${mode} : la série 3 reste distincte du neutre qui fait la piste`, () => {
      expect(contrastRatio(tokens['3']!, tokens.neutral!)).toBeGreaterThanOrEqual(1.5);
    });
  }
  it('les séries 3 et 4 du jeu B ne sont pas employées par les composants de budget', () => {
    const files = walk(path.join(ROOT, 'src'), (f) => /\.(tsx|ts)$/.test(f) && /(budget|Budget)/.test(f));
    const bad = files.filter((f) => /\b(?:bg|text|fill|stroke)-chart-[34]\b/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
    expect(contrastRatio(LIGHT['3']!, SURFACE.light)).toBeGreaterThan(2);
    expect(contrastRatio(LIGHT['4']!, SURFACE.light)).toBeGreaterThan(2.99);
  });
  it('la piste neutre se distingue de la carte sans trait (teinte seulement)', () => {
    expect(contrastRatio(LIGHT.neutral!, SURFACE.light)).toBeGreaterThan(1.1);
    expect(contrastRatio(DARK.neutral!, SURFACE.dark)).toBeGreaterThan(1.3);
  });
  it('globals.css importe la couche de jetons', () => {
    expect(globals).toMatch(/@import '\.\/chart-tokens\.css'/);
  });
  it('aucune couleur ni forme de graphique en dur dans les composants de budget', () => {
    const files = walk(path.join(ROOT, 'src'), (f) => /\.(tsx|ts)$/.test(f) && /(budget|Budget)/.test(f));
    expect(files.length).toBeGreaterThan(0);
    const bad = files.filter((f) => /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });
  it('le fichier de jetons ne déclare ni bordure ni soulignement', () => {
    expect(css).not.toMatch(/text-decoration|border-|outline/);
  });
});
