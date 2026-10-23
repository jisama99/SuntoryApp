import { describe, expect, it } from 'vitest';
import { read, rel, ROOT, walk } from './util';
import path from 'node:path';

const UI_FILES = walk(path.join(ROOT, 'src'), (f) => /\.(ts|tsx)$/.test(f) && !f.includes(`${path.sep}data${path.sep}fixtures`));
const ZONE_LITERAL = /\b(DR-[A-Z]{3,}|CVR-[A-Z]{2}\d{2}|RS-[A-Z0-9]{4})\b/;

describe('ZoneLabel est le seul chemin d\'affichage d\'un code DR, CVR ou RS (D106)', () => {
  const screens = UI_FILES.filter((f) => /src\/(app|components)\//.test(f.replaceAll(path.sep, '/')) && !f.endsWith('ZoneLabel.tsx'));

  it('aucun écran ni composant (hors ZoneLabel) ne lit la propriété .code', () => {
    const offenders = screens.filter((f) => /\.code\b/.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  it('aucun code de zone en dur dans le code source', () => {
    const offenders = UI_FILES.filter((f) => ZONE_LITERAL.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });

  it('les écrans qui affichent une zone importent ZoneLabel', () => {
    const users = screens.filter((f) => /responsible_name|label_fr|label_en/.test(read(f)));
    expect(users).toEqual([]);
  });

  it('ZoneLabel affiche libellé, responsable et code, dans cet ordre', () => {
    const src = read(path.join(ROOT, 'src/components/ZoneLabel.tsx'));
    const i = (s: string) => src.indexOf(s);
    expect(i('{label}')).toBeGreaterThan(-1);
    expect(i('{label}')).toBeLessThan(i('zone.responsible_name'));
    expect(i('zone.responsible_name')).toBeLessThan(i('zone.code'));
  });

  it('aucun écran n\'importe un fichier de fixtures', () => {
    const offenders = screens.filter((f) => /fixtures/.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });
});
