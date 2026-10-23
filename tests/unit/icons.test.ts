import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { read, rel, ROOT, walk } from './util';

// Symboles de style IA interdits (D113) : étincelles, baguette, robot, cerveau, bulle d'assistant.
const FORBIDDEN = /(sparkle|wand|magic|robot|bot\b|brain|assistant|cpu|stars?\b|message-?(circle|square)|bubble|lightbulb|zap)/i;

describe('icônes (D113)', () => {
  const files = walk(path.join(ROOT, 'src'), (f) => /\.(ts|tsx)$/.test(f));

  it('lucide-react n\'est importé que par src/components/icons.ts', () => {
    const importers = files.filter((f) => /from 'lucide-react'/.test(read(f))).map(rel);
    expect(importers).toEqual(['src/components/icons.ts']);
  });

  it('aucune icône importée ne figure sur la liste interdite', () => {
    const src = read(path.join(ROOT, 'src/components/icons.ts'));
    const block = src.match(/import \{([\s\S]*?)\} from 'lucide-react'/)![1]!;
    const names = block.split(',').map((s) => s.trim()).filter(Boolean);
    expect(names.length).toBeGreaterThan(10);
    expect(names.filter((n) => FORBIDDEN.test(n))).toEqual([]);
  });

  it('aucune icône n\'est chargée depuis une adresse externe', () => {
    const bad = files.filter((f) => /https?:\/\/[^'"\s]*\.(svg|png)/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });

  it('aucun écran ne règle lui-même la taille ou le trait d\'une icône (gabarit Icon, D125)', () => {
    const offenders = files
      .filter((f) => f.endsWith('.tsx') && !f.endsWith('Icon.tsx'))
      .filter((f) => /strokeWidth=/.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it('le gabarit Icon impose quatre tailles et un trait décroissant avec la taille', () => {
    const src = read(path.join(ROOT, 'src/components/Icon.tsx'));
    const strokes = [...src.matchAll(/stroke: ([\d.]+)/g)].map((m) => Number(m[1]));
    expect(strokes).toHaveLength(4);
    expect([...strokes].sort((a, b) => b - a)).toEqual(strokes);
  });

  it('le détecteur reconnaît bien les noms interdits', () => {
    for (const n of ['Sparkles', 'WandSparkles', 'Bot', 'Brain', 'BrainCircuit', 'MessageCircle', 'Wand2']) {
      expect(FORBIDDEN.test(n), n).toBe(true);
    }
    for (const n of ['House', 'Bell', 'Wallet']) expect(FORBIDDEN.test(n), n).toBe(false);
  });
});
