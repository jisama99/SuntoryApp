// Prépare public/visuels/ à partir des fichiers fournis par T. SOEFOU (D160, D163).
// Usage : VISUELS_SOURCE=<dossier en lecture seule> node scripts/optimize-visuals.mjs
// Les originaux ne sont jamais modifiés ni copiés tels quels : seules des versions WebP recadrées et allégées sont écrites.
import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SRC = process.env.VISUELS_SOURCE;
if (!SRC) throw new Error('VISUELS_SOURCE manquant');
const OUT = path.join('public', 'visuels');
mkdirSync(OUT, { recursive: true });

/** Fichier source, bureau (image entière) et mobile (recadrage distinct, ratio 4:3 centré sur le sujet). */
const VISUALS = [
  { id: 'nature', file: '2.webp', mobileCrop: { left: 100, top: 0, width: 1215, height: 911 } },
  { id: 'products', file: '4.jpg', mobileCrop: { left: 330, top: 0, width: 1015, height: 761 } },
  { id: 'forest', file: '1.webp', mobileCrop: { left: 520, top: 0, width: 815, height: 611 } },
];
const WIDTHS = [640, 1280, 1920];
const QUALITY = 72;

const manifest = {};
for (const v of VISUALS) {
  const input = path.join(SRC, v.file);
  const meta = await sharp(input).metadata();
  manifest[v.id] = { desktop: [], mobile: [] };
  const targets = [
    { kind: 'desktop', pipeline: () => sharp(input), native: meta.width },
    { kind: 'mobile', pipeline: () => sharp(input).extract(v.mobileCrop), native: v.mobileCrop.width },
  ];
  for (const t of targets) {
    // Jamais d'agrandissement : une largeur demandée au-delà de la source est ramenée à la largeur native.
    const widths = [...new Set(WIDTHS.map((w) => Math.min(w, t.native)))];
    for (const w of widths) {
      const name = `${v.id}-${t.kind === 'mobile' ? 'm' : 'd'}-${w}.webp`;
      const info = await t.pipeline().resize({ width: w }).webp({ quality: QUALITY, effort: 5 }).toFile(path.join(OUT, name));
      manifest[v.id][t.kind].push({ file: name, width: info.width, height: info.height, bytes: statSync(path.join(OUT, name)).size });
    }
  }
}

// Logos : conservés avec leur transparence, en deux tailles au plus.
const LOGOS = [
  { id: 'logo-suntory', file: '3.png', widths: [480, 960] },
  { id: 'logo-marvesting', file: '5.webp', widths: [440] },
];
manifest.logos = {};
for (const l of LOGOS) {
  manifest.logos[l.id] = [];
  for (const w of l.widths) {
    const name = `${l.id}-${w}.webp`;
    const info = await sharp(path.join(SRC, l.file)).resize({ width: w }).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(OUT, name));
    manifest.logos[l.id].push({ file: name, width: info.width, height: info.height, bytes: statSync(path.join(OUT, name)).size });
  }
}
writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(readdirSync(OUT).map((f) => `${f} ${statSync(path.join(OUT, f)).size}`).join('\n'));
