import manifest from '../../public/visuels/manifest.json';

type Variant = { file: string; width: number; height: number };

/** Logos fournis (D113, D160) : décoratifs, le nom de l'application est écrit à côté. Servis en local. */
export function BrandLogo({ brand, className = '' }: { brand: 'suntory' | 'marvesting'; className?: string }) {
  const list = (brand === 'suntory' ? manifest.logos['logo-suntory'] : manifest.logos['logo-marvesting']) as Variant[];
  const first = list[0]!;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/visuels/${first.file}`}
      srcSet={list.map((v) => `/visuels/${v.file} ${v.width}w`).join(', ')}
      sizes="12rem"
      width={first.width}
      height={first.height}
      alt=""
      decoding="async"
      className={`visual-logo w-auto ${className}`.trim()}
    />
  );
}

/**
 * Marvesting en pied de page : même silhouette que le logo fourni, une seule teinte (celle du texte secondaire), donc
 * fondu dans la page en clair comme en sombre, sans pastille ni fond rapporté.
 */
export function BrandMark({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`brand-mark inline-block aspect-[22/5] h-5 ${className}`.trim()} />;
}
