import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { read, rel, ROOT, walk } from './util';

// Racine du dépôt Git pour les contrôles d'index et d'historique (C5, C7).
const GUARD_ROOT = process.env.GUARD_ROOT ?? ROOT;
const GIT_TIMEOUT_MS = 25_000;
const GIT_TEST_TIMEOUT_MS = 30_000;

const SCAN = ['src', 'messages', 'scripts', 'tests'].flatMap((d) =>
  existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d), (f) => /\.(ts|tsx|json|css|mjs)$/.test(f)) : [],
).filter((f) => !f.endsWith('guards.test.ts'));
const CONFIG = ['package.json', 'next.config.ts', 'playwright.config.ts', 'vitest.config.mts', 'eslint.config.mjs']
  .map((f) => path.join(ROOT, f)).filter(existsSync);
const FILES = [...SCAN, ...CONFIG];

describe('C4 : aucune donnée personnelle ni réelle dans le code, les messages, les scripts et les tests', () => {
  const RULES: Array<[string, RegExp]> = [
    ['adresse e-mail', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/],
    ['téléphone français', /(?<![\w'])(?:\+33|0033|0)\s?[1-9](?:[\s.-]?\d{2}){4}(?![\w'])/],
    ['IBAN', /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/],
    ['code postal à 5 chiffres isolé', /(?<![\w#.-])(?:0[1-9]|[1-8]\d|9[0-5])\d{3}(?![\w.-])/],
  ];
  for (const [name, re] of RULES) {
    it(`aucun(e) ${name}`, () => {
      const hits: string[] = [];
      for (const f of FILES) {
        if (path.basename(f) === 'package-lock.json') continue;
        const txt = read(f);
        const m = txt.match(re);
        if (m) hits.push(`${rel(f)}: ${m[0]}`);
      }
      expect(hits).toEqual([]);
    });
  }

  it('aucun nom de domaine hors localhost et hors licences/registre de paquets', () => {
    const hits: string[] = [];
    for (const f of FILES) {
      if (path.basename(f) === 'package-lock.json') continue;
      for (const m of read(f).matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
        const host = m[1]!.toLowerCase();
        if (['localhost', '127.0.0.1', 'www.w3.org', 'nextjs.org', 'json.schemastore.org'].includes(host)) continue;
        hits.push(`${rel(f)}: ${host}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

/**
 * Sortie d'une commande Git, ou null si le dépôt n'est pas joignable (signalé dans le compte rendu). Un dépassement de délai
 * n'est jamais pris pour une absence de dépôt : il fait échouer le test. Délai du processus : 25 s, dans le délai du test (30 s).
 * Cause de l'échec observé (5,9 s pour un test qui dure 20 à 80 ms) : non reproduite, même sous trois suites en parallèle ;
 * hypothèse : tâche de fond de Git (maintenance après récupération). Le délai absorbe ce cas sans masquer un blocage réel.
 */
function gitFiles(args: string[]): string[] | null {
  try {
    return execFileSync('git', ['-C', GUARD_ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: GIT_TIMEOUT_MS })
      .split('\n').filter(Boolean);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ETIMEDOUT') throw error;
    return null;
  }
}

const BANNED_EXT = /\.(xlsx|xlsm|xls|csv|pdf|pptx|docx|zip|sqlite|db)$/i;
const BANNED_NAME = /(^|\/)(data_real|ref_reel|ref_magasins|communes_|\.denylist\.local|\.env($|\.))/i;

describe('C5 : aucun fichier interdit suivi par Git ou présent dans l\'arborescence', () => {
  it('index Git : pas d\'extension ni de nom interdit', () => {
    const tracked = gitFiles(['ls-files']);
    if (tracked === null) {
      // Repli : analyse du système de fichiers si Git est indisponible.
      const fsHits = walk(ROOT, (f) => BANNED_EXT.test(f) || BANNED_NAME.test(rel(f))).map(rel);
      expect(fsHits).toEqual([]);
      return;
    }
    const bad = tracked.filter((f) => (BANNED_EXT.test(f) && !f.startsWith('docs/')) || BANNED_NAME.test(f));
    expect(bad).toEqual([]);
  }, GIT_TEST_TIMEOUT_MS);

  it('arborescence de travail : aucun classeur ni export dans src, messages, scripts, tests', () => {
    const hits = ['src', 'messages', 'scripts', 'tests', 'public']
      .filter((d) => existsSync(path.join(ROOT, d)))
      .flatMap((d) => walk(path.join(ROOT, d), (f) => BANNED_EXT.test(f)))
      .map(rel);
    expect(hits).toEqual([]);
  });
});

describe('C7 : aucune trace interdite dans l\'historique Git', () => {
  it('aucun fichier interdit n\'a jamais été ajouté', () => {
    const all = gitFiles(['log', '--all', '--name-only', '--pretty=format:']);
    if (all === null) return; // pas de dépôt joignable : signalé dans le compte rendu
    const bad = [...new Set(all)].filter((f) => (BANNED_EXT.test(f) && !f.startsWith('docs/')) || BANNED_NAME.test(f));
    expect(bad).toEqual([]);
  }, GIT_TEST_TIMEOUT_MS);
});

// C3 : liste de refus locale (hachages SHA-256 de termes réels), jamais versionnée.
// SAFE_WORDS : vocabulaire générique du code (français courant + anglais technique) présent dans
// la vraie donnée Suntory — faux positifs confirmés le 23/10/2026, aucune fuite réelle.
const C3_SAFE_WORDS = new Set([
  'annulée', 'anticipée', 'comprises', 'fermé', 'ignorées', 'matin', 'prochains', 'résolu',
  'intitule', 'marquer',
  'chain', 'email', 'euros', 'never', 'paste', 'programmation', 'switch', 'teams',
]);
const DENY = path.join(GUARD_ROOT, '.denylist.local');
describe.skipIf(!existsSync(DENY))('C3 : liste de refus locale (non exécuté si absente)', () => {
  it('aucun mot des fichiers suivis ne correspond à un haché de la liste', () => {
    const hashes = new Set(readFileSync(DENY, 'utf8').split('\n').map((l) => l.trim().toLowerCase()).filter((l) => /^[0-9a-f]{64}$/.test(l)));
    const hits: string[] = [];
    for (const f of FILES) {
      for (const w of read(f).toLowerCase().match(/[a-zà-ÿ0-9]{3,}/g) ?? []) {
        if (!C3_SAFE_WORDS.has(w) && hashes.has(createHash('sha256').update(w).digest('hex'))) hits.push(`${rel(f)}`);
      }
    }
    expect([...new Set(hits)]).toEqual([]);
  });
});
