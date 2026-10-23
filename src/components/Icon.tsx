import type { LucideIcon } from './icons';

/**
 * Gabarit unique d'affichage des icônes (D125) : quatre tailles, trait ajusté à la taille pour garder le même poids
 * optique partout (menu, étiquettes, états). Aucun écran ne règle la taille ou le trait lui-même.
 */
const SIZES = {
  sm: { box: 'size-4', stroke: 1.9 },
  md: { box: 'size-5', stroke: 1.75 },
  lg: { box: 'size-6', stroke: 1.6 },
  xl: { box: 'size-8', stroke: 1.5 },
} as const;

export type IconSize = keyof typeof SIZES;

export function Icon({ icon: Glyph, size = 'md', className = '' }: { icon: LucideIcon; size?: IconSize; className?: string }) {
  const s = SIZES[size];
  return (
    <Glyph
      aria-hidden="true"
      focusable="false"
      strokeWidth={s.stroke}
      absoluteStrokeWidth={false}
      className={`${s.box} shrink-0 ${className}`.trim()}
    />
  );
}
