import type { Campaign, Store } from '@/data/schemas';
import type { Locale } from '@/domain/types';

/** Libellés de magasin et de campagne selon la langue. Les codes de zone passent par ZoneLabel, pas par ici. */
export const storeText = (s: Store, locale: Locale): string => `${locale === 'en' ? s.label_en : s.label_fr} (${s.code})`;
export const campaignText = (c: Campaign, locale: Locale): string => `${locale === 'en' ? c.label_en : c.label_fr} (${c.code})`;

/** Libellé d'une campagne retrouvée par son code ; le code seul si elle est inconnue. */
export const campaignLabelOf = (campaigns: readonly Campaign[], code: string, locale: Locale): string => {
  const found = campaigns.find(({ code: candidate }) => candidate === code);
  return found ? campaignText(found, locale) : code;
};
