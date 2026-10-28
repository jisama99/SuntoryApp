import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BudgetHeader, budgetTabsOf } from '@/components/BudgetHeader';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { ZoneLabel } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { BusinessEvent, Zone } from '@/data/schemas';
import type { Locale } from '@/domain/types';
import { formatDate, keepTogether } from '@/lib/format';
import { formatEuros } from '@/lib/money';
import { campaignLabelOf } from '@/lib/labels';
import { getAccessContext } from '@/lib/session';

/**
 * Journal du budget : enveloppe (EV-50), allocation (EV-51), dépassement détecté (EV-28), imputation déplacée (EV-52). Chaque ligne
 * porte sa date, son auteur et son motif. L'audience et le périmètre sont appliqués par la couche de données.
 */
export default async function BudgetJournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const loc = ctx.locale;
  const t = await getTranslations('budget');
  const ta = await getTranslations('alerts');
  const tp = await getTranslations('pipeline');
  const tr = await getTranslations('role');

  const [view, events, zones, campaigns] = await Promise.all([
    repository.getBudget(ctx), repository.getBudgetEvents(ctx), repository.getScopeZones(ctx), repository.getCampaigns(ctx),
  ]);
  const zoneById = new Map<string, Zone>(zones.map((z) => [z.id, z]));
  const campaignLabel = (code: string) => campaignLabelOf(campaigns, code, loc);
  const eur = (v: unknown) => (typeof v === 'number' ? formatEuros(v, loc) : t('notFilled'));
  const detail = (e: BusinessEvent): string => {
    const d = e.data;
    const { code: eventCode } = e;
    const motive = typeof d.motive === 'string' && d.motive ? ` ${t('journal.detail.motive', { motive: d.motive })}` : '';
    switch (eventCode) {
      case 'EV-28': return t('journal.detail.EV-28', { need: keepTogether(String(d.need_code)) });
      case 'EV-50': return (typeof d.previous_eur === 'number'
        ? t('journal.detail.EV-50Previous', { version: Number(d.version), amount: eur(d.amount_eur), previous: eur(d.previous_eur) })
        : t('journal.detail.EV-50', { version: Number(d.version), amount: eur(d.amount_eur) })) + motive;
      case 'EV-51': {
        const campaign = campaignLabel(String(d.campaign));
        if (d.action === 'updated') return t('journal.detail.EV-51updated', { campaign, previous: eur(d.previous_eur), amount: eur(d.amount_eur) }) + motive;
        if (d.action === 'removed') return t('journal.detail.EV-51removed', { campaign, previous: eur(d.previous_eur) }) + motive;
        return t('journal.detail.EV-51created', { campaign, amount: eur(d.amount_eur) }) + motive;
      }
      case 'EV-52': return t(d.kind === 'moved' ? 'journal.detail.EV-52moved' : 'journal.detail.EV-52recosted', { need: keepTogether(String(d.need_code)) });
      default: return eventCode;
    }
  };

  return (
    <>
      <BudgetHeader current="journal" tabs={budgetTabsOf(view)} subtitle={tr(ctx.profileId)} />
      <p className="mb-6 max-w-prose text-muted">{t('journal.intro')}</p>
      {events.length === 0 ? (
        <EmptyState title={t('journal.emptyTitle')} body={t('journal.empty')} />
      ) : (
        <section aria-label={t('journal.caption')}>
          <ul className="flex flex-col gap-2" data-testid="budget-journal">
            {events.map((e) => {
              const zone = zoneById.get(e.zone_id);
              const { code: eventCode } = e;
              return (
                <li key={e.id} data-event-code={eventCode} data-audience={e.audience} className="flex flex-wrap items-center gap-3 rounded-ctl bg-alt px-4 py-2">
                  <span className="text-sm text-muted">{formatDate(e.effect_date, loc)}</span>
                  <span className="font-semibold">{tp(`event.${eventCode}`)}</span>
                  <span>{detail(e)}</span>
                  {zone && eventCode === 'EV-51' ? <ZoneLabel zone={zone} /> : null}
                  <span className="text-sm text-muted">{tp(`actorProfile.${e.actor_profile}`)}</span>
                  {ctx.side !== 'client' ? <StatusTag tone="neutral">{ta(`audience.${e.audience}`)}</StatusTag> : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
