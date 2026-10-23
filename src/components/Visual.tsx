import manifest from '../../public/visuels/manifest.json';

export type VisualId = 'nature' | 'products' | 'forest';
type Variant = { file: string; width: number; height: number; bytes: number };

const srcSet = (list: Variant[]) => list.map((v) => `/visuels/${v.file} ${v.width}w`).join(', ');

/**
 * Visuel décoratif (D160, D163) : versions WebP locales, recadrage distinct sur mobile, aucune requête externe.
 * `priority` : chargement prioritaire de l'image d'accueil. L'image est décorative, le texte porte le sens.
 */
export function Visual({ id, priority = false, className = '' }: { id: VisualId; priority?: boolean; className?: string }) {
  const v = manifest[id] as { desktop: Variant[]; mobile: Variant[] };
  const mid = v.desktop.find((d) => d.width === 1280) ?? v.desktop[v.desktop.length - 1]!;
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={srcSet(v.mobile)} sizes="100vw" />
      <source srcSet={srcSet(v.desktop)} sizes="100vw" />
      {/* Les images sont déjà optimisées et servies depuis public/visuels : next/image n'apporterait qu'une requête de plus. */}
      <img
        src={`/visuels/${mid.file}`}
        alt=""
        width={mid.width}
        height={mid.height}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={`visual ${className}`.trim()}
      />
    </picture>
  );
}
