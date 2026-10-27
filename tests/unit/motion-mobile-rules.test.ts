import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { read, rel, ROOT, walk } from './util';

// Règles M (mouvement) et N (mobile natif) : docs/REGLES_MOUVEMENT_ET_MOBILE.md.
const SRC = path.join(ROOT, 'src');
const FILES = existsSync(SRC) ? walk(SRC, (f) => /\.(ts|tsx|css)$/.test(f)) : [];
const CSS = path.join(SRC, 'app/globals.css');

const hits = (re: RegExp, except: (f: string) => boolean = () => false) =>
  FILES.filter((f) => !except(rel(f)) && re.test(read(f))).map(rel);

describe('M : mouvement', () => {
  it('M6 : aucun « transition: all » ni « transition-all »', () => {
    expect(hits(/transition\s*:\s*all\b|\btransition-all\b/)).toEqual([]);
  });
  it('M4 : aucun « ease-in » seul (ease-in-out et la courbe standard restent permis)', () => {
    expect(hits(/\bease-in\b(?!-)|timing-function\s*:\s*ease-in\s*[;)]/)).toEqual([]);
  });
  it('M5 : aucun départ à scale(0)', () => {
    expect(hits(/scale\(\s*0\s*\)|\bscale-0\b|scale:\s*0\s*[;}]/)).toEqual([]);
  });
  it('M9 : prefers-reduced-motion neutralise animations et transitions', () => {
    const css = read(CSS);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    const block = css.slice(css.indexOf('prefers-reduced-motion'));
    expect(block).toMatch(/animation\s*:\s*none/);
    expect(block).toMatch(/transition\s*:\s*none/);
  });
  it('M3 : durées des jetons de mouvement ≤ 300 ms (hors boucle des squelettes)', () => {
    const css = read(CSS);
    const tokens = [...css.matchAll(/--duration-([a-z-]+)\s*:\s*(\d+)ms/g)].filter(([, name]) => name !== 'loop');
    expect(tokens.length).toBeGreaterThan(0);
    for (const [, name, ms] of tokens) expect({ name, ok: Number(ms) <= 300 }).toEqual({ name, ok: true });
  });
  it('M10 : pas de :hover en CSS brut sans condition (hover: hover)', () => {
    const css = read(CSS).replace(/@media\s*\(hover:\s*hover\)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
    expect(css).not.toMatch(/:hover\b/);
  });
});

describe('N : mobile natif', () => {
  it('N1 : pas de 100vh en CSS (l’écart connu « min-h-screen » de AppShell est suivi au §4 du document)', () => {
    expect(hits(/\b100vh\b/)).toEqual([]);
  });
  it('N3 : le zoom n’est jamais bloqué', () => {
    expect(hits(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b|userScalable\s*:\s*false|maximumScale\s*:\s*1\b/)).toEqual([]);
  });
  it('N6 : pas de user-select: none sur body ou html', () => {
    expect(read(CSS)).not.toMatch(/(?:^|[}\s,])(?:body|html)\s*(?:,[^{]*)?\{[^}]*user-select\s*:\s*none/);
  });
  it('N9 : pas de détection par agent utilisateur', () => {
    expect(hits(/navigator\.userAgent|userAgentData/)).toEqual([]);
  });
  it.todo('N2 : viewport-fit=cover et marges safe-area (écart connu, lot « réglages tactiles »)');
  it.todo('N7 : theme-color distinct clair et sombre (écart connu, lot « réglages tactiles »)');
});
