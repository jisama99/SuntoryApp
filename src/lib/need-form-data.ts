import { zoneText } from '@/components/ZoneLabel';
import type { NeedFormProps } from '@/components/NeedForm';
import { repository } from '@/data';
import type { AccessContext } from '@/domain/access';
import { DEFAULT_RULE_CONFIG } from '@/domain/rules';
import { campaignText, storeText } from './labels';

/** Données communes aux écrans de saisie : tout vient du Repository, filtré par le contexte d'accès. */
export async function loadFormData(ctx: AccessContext): Promise<Omit<NeedFormProps, 'mode' | 'initial' | 'needId'>> {
  const [zones, stores, campaigns, closures, clock] = await Promise.all([
    repository.getScopeZones(ctx),
    repository.getStores(ctx),
    repository.getCampaigns(ctx),
    repository.getWeekClosures(ctx),
    repository.getClock(ctx),
  ]);
  return {
    sectors: zones.filter((z) => z.kind === 'rs').map((z) => ({ id: z.id, text: zoneText(z, ctx.locale) })),
    stores: stores.map((s) => ({ value: s.code, text: storeText(s, ctx.locale), sectorId: s.sector_id })),
    campaigns: campaigns.map((c) => ({ value: c.code, dispositif: c.dispositif, text: campaignText(c, ctx.locale) })),
    today: clock.date,
    min: DEFAULT_RULE_CONFIG.dateBounds.min,
    max: DEFAULT_RULE_CONFIG.dateBounds.max,
    closedWeeks: closures.map((w) => w.week),
    daysAllowed: [...DEFAULT_RULE_CONFIG.daysAllowed],
  };
}
