import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import profilesJson from '@/data/fixtures/profiles.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import { ProfileSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { HOME_SKINS, PROFILE_IDS } from '@/domain/types';
import type { ProfileId } from '@/domain/types';
import { read, rel, ROOT, walk } from './util';

const VISUELS = path.join(ROOT, 'public/visuels');
const manifest = JSON.parse(read(path.join(VISUELS, 'manifest.json'))) as Record<string, { desktop: Variant[]; mobile: Variant[] } | Record<string, Variant[]>>;
type Variant = { file: string; width: number; height: number; bytes: number };
const VISUAL_IDS = ['nature', 'products', 'forest'] as const;
const visual = (id: (typeof VISUAL_IDS)[number]) => manifest[id] as { desktop: Variant[]; mobile: Variant[] };

describe('visuels optimisés (D160, D163)', () => {
  it('chaque variante annoncée existe, avec le poids annoncé, en WebP', () => {
    for (const id of VISUAL_IDS) {
      for (const v of [...visual(id).desktop, ...visual(id).mobile]) {
        expect(statSync(path.join(VISUELS, v.file)).size, v.file).toBe(v.bytes);
        expect(v.file.endsWith('.webp')).toBe(true);
      }
    }
  });

  it('trois largeurs au plus par visuel et par format, jamais d\'agrandissement, recadrage mobile distinct', () => {
    for (const id of VISUAL_IDS) {
      const { desktop, mobile } = visual(id);
      expect(desktop.map((d) => d.width)).toContain(640);
      expect(desktop.map((d) => d.width)).toContain(1280);
      expect(Math.max(...desktop.map((d) => d.width))).toBeGreaterThanOrEqual(1900);
      expect(mobile.length).toBeGreaterThan(0);
      // Le recadrage mobile n'a pas le même rapport largeur sur hauteur que la version bureau.
      const ratio = (v: Variant) => v.width / v.height;
      expect(Math.abs(ratio(mobile[0]!) - ratio(desktop[0]!))).toBeGreaterThan(0.1);
    }
  });

  it('poids : l\'image d\'accueil en mobile pèse moins de 250 Ko (toutes les variantes mobiles de chaque visuel aussi)', () => {
    for (const id of VISUAL_IDS) {
      for (const v of visual(id).mobile) expect(v.bytes, `${id} ${v.file}`).toBeLessThan(250 * 1024);
    }
    for (const id of ['nature', 'products'] as const) {
      for (const v of visual(id).mobile) expect(v.bytes).toBeLessThan(250 * 1024);
    }
  });

  it('aucune image hors public/visuels (hors captures et documents), aucune origine externe', () => {
    const images = walk(ROOT, (f) => /\.(webp|jpe?g|png|gif|svg)$/i.test(f) && !f.includes('node_modules') && !f.includes('/.next/') && !f.includes('/docs/') && !f.includes('/test-results/'));
    const outside = images.map(rel).filter((f) => !f.startsWith('public/visuels/') && f !== 'src/app/icon.png');
    expect(outside).toEqual([]);
    expect(readdirSync(VISUELS).filter((f) => !f.endsWith('.webp') && f !== 'manifest.json')).toEqual([]);
    const code = walk(path.join(ROOT, 'src'), (f) => /\.(tsx?|css)$/.test(f)).filter((f) => /https?:\/\/[^\s'"`)]+\.(webp|jpe?g|png|svg)/i.test(read(f)));
    expect(code.map(rel)).toEqual([]);
  });

  it('l\'image d\'accueil est chargée en priorité, les visuels sont décoratifs', () => {
    const visualSrc = read(path.join(ROOT, 'src/components/Visual.tsx'));
    expect(visualSrc).toContain("fetchPriority={priority ? 'high' : 'auto'}");
    expect(visualSrc).toContain('alt=""');
    expect(read(path.join(ROOT, 'src/app/[locale]/(app)/page.tsx'))).toMatch(/<HeroHeader[\s\S]*?priority/);
  });
});

/** Contraste du texte sur visuel (règle 16) : pixels réels de chaque image sous le voile, dans les trois blocs de mode. */
describe('contraste du texte sur visuel', () => {
  const css = read(path.join(ROOT, 'src/app/globals.css'));
  const token = (block: string, name: string) => block.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))![1]!;
  const lightTheme = css.match(/@theme\s*\{([\s\S]*?)\n\}/)![1]!;
  const darkBlock = css.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/)![1]!;
  const systemBlock = css.match(/:root:not\(\[data-theme\]\)\s*\{([\s\S]*?)\n  \}/)![1]!;
  const alpha = (block: string) => Number(block.match(/--veil-alpha:\s*([0-9.]+)/)![1]);
  const rootBlock = css.match(/:root\s*\{[^}]*--veil-alpha:[^}]*\}/)![0];

  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lin = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : Math.pow((v / 255 + 0.055) / 1.055, 2.4));
  const lum = (c: number[]) => 0.2126 * lin(c[0]!) + 0.7152 * lin(c[1]!) + 0.0722 * lin(c[2]!);
  const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  async function worst(file: string, page: string, textHex: string, a: number) {
    const { data } = await sharp(path.join(VISUELS, file)).resize(48, 48, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const bg = rgb(page);
    let min = Infinity;
    for (let i = 0; i < data.length; i += 3) {
      const mixed = [0, 1, 2].map((k) => a * bg[k]! + (1 - a) * data[i + k]!);
      min = Math.min(min, ratio(lum(mixed), lum(rgb(textHex))));
    }
    return min;
  }

  const MODES = [
    { name: 'clair', colors: lightTheme, a: alpha(rootBlock) },
    { name: 'sombre explicite', colors: darkBlock, a: alpha(darkBlock) },
    { name: 'sombre système', colors: systemBlock, a: alpha(systemBlock) },
  ];

  it('le voile est plus fort en mode sombre', () => {
    expect(alpha(darkBlock)).toBeGreaterThan(alpha(rootBlock));
    expect(alpha(systemBlock)).toBe(alpha(darkBlock));
  });

  for (const mode of MODES) {
    it(`titre, texte courant et texte secondaire fort atteignent 4,5 sur chaque visuel : ${mode.name}`, async () => {
      for (const id of VISUAL_IDS) {
        for (const v of [visual(id).desktop.find((d) => d.width === 1280)!, visual(id).mobile[0]!]) {
          for (const t of ['title', 'ink', 'muted-strong']) {
            const colors = mode.name === 'clair' ? mode.colors : mode.colors;
            const textHex = colors.match(new RegExp(`--color-${t}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? token(lightTheme, t);
            const pageHex = colors.match(/--color-page:\s*(#[0-9a-fA-F]{6})/)?.[1] ?? token(lightTheme, 'page');
            expect(await worst(v.file, pageHex, textHex, mode.a), `${mode.name} ${v.file} ${t}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    });
  }
});

describe('skin d\'accueil : audience et personnalisation (D118, D161)', () => {
  const profiles = z.array(ProfileSchema).parse(profilesJson);
  const repo = createMemoryRepository();
  const ctxOf = (id: ProfileId) => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr');
  beforeEach(() => resetDemoState());

  it('le défaut de l\'agence est Nature (visuel C) ; seule l\'agence administration le lit et le modifie', async () => {
    expect(await repo.getHomeSkinDefault(ctxOf('agency_admin'))).toBe('nature');
    for (const id of PROFILE_IDS.filter((p) => p !== 'agency_admin')) {
      expect(await repo.getHomeSkinDefault(ctxOf(id)), `lecture ${id}`).toBeNull();
      expect(await repo.setHomeSkinDefault(ctxOf(id), 'plain'), `écriture ${id}`).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect((await repo.getHomeSkin(ctxOf('direction_client'))).skin).toBe('nature');
  });

  it('aucun profil cliente n\'a de menu Réglages ni de Gestion de la mission', async () => {
    for (const id of ['direction_client', 'dr_client', 'cvr_client'] as const) {
      const keys = (await repo.getMenu(ctxOf(id))).map((e) => e.key);
      expect(keys).not.toContain('settings');
      expect(keys).not.toContain('admin');
    }
  });

  it('le défaut de l\'agence vaut pour qui n\'a pas choisi ; le choix d\'un profil ne touche que lui', async () => {
    expect(await repo.setHomeSkinDefault(ctxOf('agency_admin'), 'plain')).toEqual({ status: 'ok' });
    expect(await repo.getHomeSkin(ctxOf('rs'))).toEqual({ skin: 'plain', source: 'agency' });
    expect(await repo.setUserHomeSkin(ctxOf('rs'), 'products')).toEqual({ status: 'ok' });
    expect(await repo.getHomeSkin(ctxOf('rs'))).toEqual({ skin: 'products', source: 'user' });
    expect(await repo.getHomeSkin(ctxOf('dr_client'))).toEqual({ skin: 'plain', source: 'agency' });
    // Un nouveau défaut ne retire pas un choix personnel.
    await repo.setHomeSkinDefault(ctxOf('agency_admin'), 'nature');
    expect((await repo.getHomeSkin(ctxOf('rs'))).skin).toBe('products');
  });

  it('valeur inconnue refusée, changement du défaut tracé au journal (EV-38), annulable', async () => {
    const admin = ctxOf('agency_admin');
    expect(await repo.setHomeSkinDefault(admin, 'neon' as never)).toEqual({ status: 'refused', reason: 'invalid' });
    expect(await repo.setUserHomeSkin(ctxOf('rs'), 'neon' as never)).toEqual({ status: 'refused', reason: 'invalid' });
    const before = (await repo.getEvents(admin)).length;
    const { undoToken } = await repo.withUndo(admin, () => repo.setHomeSkinDefault(admin, 'products'), (r) => r.status === 'ok');
    expect(undoToken).toBeTruthy();
    expect((await repo.getEvents(admin)).length).toBe(before + 1);
    expect((await repo.undoWrite(admin, undoToken as string)).status).toBe('ok');
    expect(await repo.getHomeSkinDefault(admin)).toBe('nature');
  });

  it('les trois skins sont traduits dans les deux langues avec le même jeu de clés', () => {
    for (const skin of HOME_SKINS) {
      expect((fr.skin as Record<string, string>)[skin]).toBeTruthy();
      expect((en.skin as Record<string, string>)[skin]).toBeTruthy();
    }
    expect(fr.skin.label).toBe("Skin d'accueil");
    expect(en.skin.label).toBe('Home theme');
  });
});

/** Titres et menus : seuls les termes du glossaire validé (D149, D160). */
describe('titres et menus conformes au glossaire', () => {
  const glossary = read(path.join(ROOT, 'docs/GLOSSAIRE_FR_EN.md'));
  const EXPECTED: Array<[keyof typeof fr.menu, string, string]> = [
    ['home', 'Mon cockpit', 'My cockpit'],
    ['dashboard', 'Pilotage', 'Steering'],
    ['needs', 'Besoins merch', 'Merch needs'],
    ['proposals', "Réponses de l'agence", 'Agency responses'],
    ['field', 'Équipes terrain', 'Field teams'],
    ['budget', 'Budget', 'Budget'],
    ['alerts', 'À traiter', 'To handle'],
    ['settings', 'Réglages', 'Settings'],
    ['admin', 'Gestion de la mission', 'Mission management'],
  ];
  it('les neuf entrées de menu reprennent le glossaire, mot pour mot', () => {
    for (const [key, frLabel, enLabel] of EXPECTED) {
      expect(fr.menu[key]).toBe(frLabel);
      expect(en.menu[key]).toBe(enLabel);
      expect(glossary, key).toContain(frLabel);
      expect(glossary, key).toContain(enLabel);
    }
  });
  it('titre de l\'application et titre de la page des besoins', () => {
    expect(fr.app.name).toBe('Pilotage merchandising');
    expect(en.app.name).toBe('Merchandising steering');
    expect(fr.needs.title).toBe('Vos besoins en merchandising');
    expect(en.needs.title).toBe('Your merchandising needs');
    expect(glossary).toContain('Vos besoins en merchandising | Your merchandising needs');
  });
});

/** Textes affichés sans références internes (D182). Ces mentions restent dans la documentation et les comptes rendus. */
describe('aucune référence interne dans les textes affichés (D182)', () => {
  const flat = (o: Record<string, unknown>, pre = ''): Array<[string, string]> =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v as Record<string, unknown>, `${pre}${k}.`) : [[`${pre}${k}`, String(v)] as [string, string]]));
  const FORBIDDEN = /\bD\d{1,3}\b|\b(?:Lecture|Reading) [AB]\b|Hypoth[eè]se|Hypothesis|SOEFOU|\bH\d\b|\bQ-N\d/;
  it('fr.json et en.json', () => {
    for (const [name, dict] of [['fr', fr], ['en', en]] as const) {
      const hits = flat(dict as Record<string, unknown>).filter(([, v]) => FORBIDDEN.test(v)).map(([k, v]) => `${name} ${k}: ${v}`);
      expect(hits).toEqual([]);
    }
  });
  it('l\'icône du site vient du logo (PNG), plus d\'icône provisoire', () => {
    expect(statSync(path.join(ROOT, 'src/app/icon.png')).size).toBeGreaterThan(300);
    expect(() => statSync(path.join(ROOT, 'src/app/icon.svg'))).toThrow();
  });
});
