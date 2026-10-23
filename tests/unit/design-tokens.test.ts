import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { read, rel, ROOT, walk } from './util';

const SRC_FILES = walk(path.join(ROOT, 'src'), (f) => /\.(tsx|ts)$/.test(f));
const CSS = read(path.join(ROOT, 'src/app/globals.css'));
const CODE = SRC_FILES.map((f) => ({ file: rel(f), text: read(f) }));

const offenders = (re: RegExp) => CODE.filter((c) => re.test(c.text)).map((c) => c.file);

/**
 * Règle 16 (D159) : les couleurs, tailles, espacements et durées viennent des jetons de globals.css.
 * Ce test échoue sur toute valeur écrite en dur dans le code.
 */
describe('jetons de design (D159)', () => {
  it('globals.css déclare les échelles d\'espacement, de typographie et de mouvement', () => {
    expect(CSS).toMatch(/--spacing:\s*0\.25rem/);
    const sizes = [...CSS.matchAll(/--text-(xs|sm|base|lg|xl|2xl):/g)].map((m) => m[1]);
    expect(new Set(sizes)).toEqual(new Set(['xs', 'sm', 'base', 'lg', 'xl', '2xl']));
    expect(CSS).toMatch(/--duration-fast:/);
    expect(CSS).toMatch(/--duration-base:/);
    expect(CSS).toMatch(/--duration-slow:/);
    expect(CSS).toMatch(/--ease-standard:/);
  });

  it('les durées de transition sont comprises entre 150 et 250 ms', () => {
    for (const name of ['fast', 'base', 'slow']) {
      const m = CSS.match(new RegExp(`--duration-${name}:\\s*(\\d+)ms`));
      expect(m, `--duration-${name}`).not.toBeNull();
      const ms = Number(m?.[1]);
      expect(ms).toBeGreaterThanOrEqual(150);
      expect(ms).toBeLessThanOrEqual(250);
    }
  });

  it('la police de base fait 16 px', () => {
    expect(CSS).toMatch(/--text-base:\s*1rem/);
    expect(CSS).toMatch(/font-size:\s*var\(--text-base\)/);
  });

  it('le mouvement réduit coupe animations et transitions', () => {
    const block = CSS.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(block).toMatch(/animation:\s*none/);
    expect(block).toMatch(/transition:\s*none/);
  });

  it('aucune couleur en dur dans le code (hexadécimal, rgb, hsl, oklch)', () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/)).toEqual([]);
  });

  it('aucune valeur arbitraire de taille, de durée ou de couleur dans les classes', () => {
    // Les valeurs entre crochets doivent être des variables de jeton ou des rapports de grille (fr).
    expect(offenders(/\b[a-z-]+-\[[^\]]*(?:#[0-9a-fA-F]|\d(?:px|rem|em|ms|s|vh|vw|%|deg))[^\]]*\]/)).toEqual([]);
  });

  it('aucun style en ligne portant une taille ou une durée écrite en dur', () => {
    expect(offenders(/style=\{\{[^}]*\b\d+(?:px|rem|ms|s|vh|vw)\b/)).toEqual([]);
  });

  it('aucune durée ou délai Tailwind chiffré (durée de jeton seulement)', () => {
    expect(offenders(/\b(?:duration|delay)-\d+\b/)).toEqual([]);
  });

  it('seules les six tailles de texte du jeu sont employées', () => {
    expect(offenders(/\btext-(?:3xl|4xl|5xl|6xl|7xl|8xl|9xl|xs\/|sm\/|base\/|lg\/)/)).toEqual([]);
  });

  it('espacements : pas de demi-pas ni de pas hors grille de 4 px', () => {
    expect(offenders(/\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\d+\.5\b/)).toEqual([]);
  });

  it('les animations et transitions de globals.css passent par les jetons de durée', () => {
    const lines = CSS.split('\n').filter((l) => /(?:^|\s)(?:animation|transition)(?:-duration)?:/.test(l) && !/none/.test(l));
    for (const l of lines) expect(l, l).toMatch(/var\(--duration-/);
  });

  it('la police Inter est chargée en local (règle 10), sans appel à un service de polices', () => {
    const layout = read(path.join(ROOT, 'src/app/[locale]/layout.tsx'));
    expect(layout).toMatch(/import '@fontsource-variable\/inter'/);
    const pkg = JSON.parse(read(path.join(ROOT, 'package.json'))) as { dependencies: Record<string, string> };
    expect(pkg.dependencies['@fontsource-variable/inter']).toBeTruthy();
    expect(CSS).toMatch(/--font-sans:\s*'Inter Variable'/);
    expect(offenders(/fonts\.googleapis|fonts\.gstatic|use\.typekit/)).toEqual([]);
    expect(CSS).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@import url\(/);
  });

  it('cibles tactiles de 44 px au moins (min-h-11) pour tout élément interactif', () => {
    expect(offenders(/\bmin-h-(?:[1-9]|10)\b/)).toEqual([]);
  });
});
