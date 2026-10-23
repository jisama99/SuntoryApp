import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import { flatten, read, rel, ROOT, walk } from './util';

const F = flatten(fr);
const E = flatten(en);

describe('exhaustivité FR / EN', () => {
  it('mêmes clés dans les deux langues', () => {
    expect(Object.keys(F).sort()).toEqual(Object.keys(E).sort());
  });
  it('aucune valeur vide', () => {
    for (const [k, v] of [...Object.entries(F), ...Object.entries(E)]) expect(v.trim(), k).not.toBe('');
  });
  it('mêmes variables {x} dans les deux langues', () => {
    const vars = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort().join(',');
    for (const k of Object.keys(F)) expect(vars(F[k]!), k).toBe(vars(E[k]!));
  });
  it('les clés d\'alerte des fixtures existent dans les deux langues', async () => {
    const alerts = (await import('../../src/data/fixtures/alerts.json')).default as { message_key: string }[];
    for (const a of alerts) {
      expect(F[`alerts.text.${a.message_key}`], a.message_key).toBeTruthy();
      expect(E[`alerts.text.${a.message_key}`], a.message_key).toBeTruthy();
    }
  });
  it('chaque clé utilisée par t(\'…\') littéral dans le code existe', () => {
    const files = walk(path.join(ROOT, 'src'), (f) => f.endsWith('.tsx'));
    const missing: string[] = [];
    for (const f of files) {
      const src = read(f);
      const nsList = [...src.matchAll(/use(?:Translations)\('([\w.]+)'\)|getTranslations\('([\w.]+)'\)/g)].map((m) => m[1] ?? m[2]);
      for (const m of src.matchAll(/\bt\('([\w.]+)'/g)) {
        const key = m[1]!;
        const ok = F[key] !== undefined || nsList.some((ns) => F[`${ns}.${key}`] !== undefined);
        if (!ok) missing.push(`${rel(f)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('aucune chaîne en dur dans les composants (analyse syntaxique)', () => {
  const files = walk(path.join(ROOT, 'src'), (f) => f.endsWith('.tsx'));
  const LETTERS = /[A-Za-zÀ-ÿ]{2,}/;
  const ATTRS = new Set(['aria-label', 'title', 'placeholder', 'alt', 'aria-description']);

  it('ni texte JSX ni attribut d\'accessibilité littéral', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const sf = ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node) && LETTERS.test(node.text)) offenders.push(`${rel(f)}: texte « ${node.text.trim()} »`);
        if (ts.isJsxAttribute(node) && ATTRS.has(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer) && LETTERS.test(node.initializer.text)) {
          offenders.push(`${rel(f)}: ${node.name.getText()}="${node.initializer.text}"`);
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    expect(offenders).toEqual([]);
  });
});

describe('style des textes (D62, D63) : fichiers de traduction FR et EN', () => {
  const all = [...Object.entries(F).map(([k, v]) => ['fr', k, v] as const), ...Object.entries(E).map(([k, v]) => ['en', k, v] as const)];

  it('aucun cadratin ni demi-cadratin', () => {
    const bad = all.filter(([, , v]) => /[—–]/.test(v));
    expect(bad).toEqual([]);
  });

  it('aucune phrase antithétique repérable par motif', () => {
    const FR = [/\bce n['’]est pas\b.*\b(c['’]est|mais)\b/i, /\bnon pas\b.*\bmais\b/i, /\bne\b[^.]*\bpas\b[^.]*\bmais\b/i, /\bplus qu['’]un\b/i, /\bpas seulement\b.*\bmais\b/i];
    const EN = [/\b(it['’]s|this is|that['’]s) not\b.*\b(it['’]s|but)\b/i, /\bnot just\b.*\bbut\b/i, /\bnot only\b.*\bbut\b/i, /\bisn['’]t\b.*\bit['’]s\b/i, /\bmore than just\b/i];
    const bad = all.filter(([lang, , v]) => (lang === 'fr' ? FR : EN).some((re) => re.test(v)));
    expect(bad).toEqual([]);
  });
});
