import { zoneText } from '@/components/ZoneLabel';
import type { NeedFormProps } from '@/components/NeedForm';
import { repository } from '@/data';
import type { AccessContext } from '@/domain/access';
import { applyDispositifParams, paramsMapOf } from '@/domain/dispositif-params';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import { DISPOSITIFS } from '@/domain/types';
import { campaignText, storeText } from './labels';

/** Données communes aux écrans de saisie : tout vient du Repository, filtré par le contexte d'accès. */
export async function loadFormData(ctx: AccessContext): Promise<Omit<NeedFormProps, 'mode' | 'initial' | 'needId'>> {
  const [zones, stores, campaigns, closures, clock, deadline] = await Promise.all([
    repository.getScopeZones(ctx),
    repository.getStores(ctx),
    repository.getCampaigns(ctx),
    repository.getWeekClosures(ctx),
    repository.getClock(ctx),
    repository.getDeadlineContext(ctx),
  ]);
  // Jours proposés par dispositif (D132, D145) : le paramètre du dispositif l'emporte sur la valeur globale.
  const byParams = paramsMapOf(deadline.params);
  const daysByDispositif = Object.fromEntries(
    DISPOSITIFS.map((d) => [d, [...applyDispositifParams(DEFAULT_RULE_CONFIG, byParams[d]).daysAllowed]]),
  ) as Record<(typeof DISPOSITIFS)[number], number[]>;
  // Semaines clôturées que l'agence a rouvertes pour ce périmètre : plus désactivées dans le calendrier.
  const reopenedWeeks = new Set(deadline.reopenings.filter((r) => r.scope === 'week' && r.expires_on >= clock.date).map((r) => r.target));
  return {
    sectors: zones.filter((z) => z.kind === 'rs').map((z) => ({ id: z.id, text: zoneText(z, ctx.locale) })),
    stores: stores.map((s) => ({ value: s.code, text: storeText(s, ctx.locale), sectorId: s.sector_id })),
    campaigns: campaigns.map((c) => ({ value: c.code, dispositif: c.dispositif, text: campaignText(c, ctx.locale) })),
    today: clock.date,
    min: DEFAULT_RULE_CONFIG.dateBounds.min,
    max: DEFAULT_RULE_CONFIG.dateBounds.max,
    closedWeeks: closures.map((w) => w.week).filter((w) => !reopenedWeeks.has(w)),
    daysAllowed: [...DEFAULT_RULE_CONFIG.daysAllowed],
    daysByDispositif,
    deadline,
  };
}
