import { useLocale } from 'next-intl';
import type { Zone } from '@/data/schemas';
import type { Locale } from '@/domain/types';

/**
 * Seul composant autorisé à afficher un code DR, CVR ou RS (D106) :
 * libellé de zone, nom du responsable, puis code. tests/unit/zone-label.test.ts le vérifie.
 */
export function ZoneLabel({ zone }: { zone: Zone }) {
  const locale = useLocale() as Locale;
  const label = locale === 'en' ? zone.label_en : zone.label_fr;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5" data-zone-kind={zone.kind}>
      <span className="font-semibold text-ink">{label}</span>
      <span aria-hidden="true" className="text-muted">·</span>
      <span className="text-ink">{zone.responsible_name}</span>
      <span aria-hidden="true" className="text-muted">·</span>
      <span className="rounded-md bg-alt px-1.5 font-mono text-xs text-muted">{zone.code}</span>
    </span>
  );
}

/** Version texte (options de liste) : libellé de zone, responsable, puis code, dans le même ordre que ZoneLabel. */
export function zoneText(zone: Zone, locale: Locale): string {
  const label = locale === 'en' ? zone.label_en : zone.label_fr;
  return `${label} · ${zone.responsible_name} · ${zone.code}`;
}

/**
 * Libellé de zone seul, sans nom de personne ni code : pour les résumés de retard de la cliente (doc 24 §5, « secteurs,
 * pas personnes »). Les codes et les noms ne s'affichent toujours que par ZoneLabel (D106).
 */
export function zoneLabelOnly(zone: Zone, locale: Locale): string {
  return locale === 'en' ? zone.label_en : zone.label_fr;
}
