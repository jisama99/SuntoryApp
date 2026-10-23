import path from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import { flatten, read, rel, ROOT, walk } from './util';

const TSX = walk(path.join(ROOT, 'src'), (f) => f.endsWith('.tsx'));
const CSS = read(path.join(ROOT, 'src/app/globals.css'));

/**
 * Règle visuelle ferme (D123, rappelée le 23/10/2026) : aucun rendu « IA ».
 * Pas de trait qui souligne, pas de trait droit décoratif, pas de pointillé, pas de tiret dans les textes.
 */
describe('aucun trait décoratif dans l\'interface', () => {
  it('ni soulignement ni décoration de texte', () => {
    const bad = TSX.filter((f) => /\bunderline\b|\bdecoration-|\bline-through\b/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });

  it('ni bordure de côté, ni séparateur, ni pointillé, ni filet fin', () => {
    const re = /\bborder-(?:[btlrxy])(?:-\d+)?\b|\bborder-(?:dashed|dotted|double)\b|\bdivide-|\bring-(?:\d|inset)|<hr\b|\bh-px\b|\bw-px\b|\boutline-(?:dashed|dotted)\b/;
    const bad = TSX.filter((f) => re.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });

  it('les cartes ne portent aucune bordure (ombre diffuse et teinte seulement)', () => {
    const bad = TSX.filter((f) => /rounded-(?:card|ctl)[^"`]*\bborder\b(?!-)/.test(read(f)) && !f.endsWith('Field.tsx')).map(rel);
    expect(bad).toEqual([]);
  });

  it('aucune barre décorative positionnée (indicateur latéral ou filet)', () => {
    const bad = TSX.filter((f) => /absolute[^"`]*\bw-(?:0\.5|1|px)\b|absolute[^"`]*\bh-(?:0\.5|1|px)\b/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });

  it('le CSS global ne déclare aucune bordure ni soulignement décoratif', () => {
    expect(CSS).not.toMatch(/text-decoration|border-bottom|border-left|border-top|border-right/);
  });
});

describe('aucun tiret dans les textes affichés (FR et EN)', () => {
  const all = [...Object.entries(flatten(fr)), ...Object.entries(flatten(en))];
  it('ni cadratin, ni demi-cadratin, ni trait d\'union utilisé comme tiret entre espaces', () => {
    const bad = all.filter(([, v]) => /[\u2014\u2013\u2012\u2015]|\s-\s|\s--\s/.test(v)).map(([k]) => k);
    expect(bad).toEqual([]);
  });
  it('aucun texte JSX ne contient de tiret long', () => {
    const bad = TSX.filter((f) => /[\u2014\u2013]/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });
});

describe('rose réservé à l\'action', () => {
  it('la teinte rose n\'est utilisée que par la tuile en attention ou l\'étiquette importante', () => {
    const users = TSX.filter((f) => /tint-rose|bg-pink-soft|bg-pink(?![\w-])/.test(read(f))).map(rel);
    expect(users.sort()).toEqual(['src/components/Tile.tsx'].concat([]).sort());
  });
});
