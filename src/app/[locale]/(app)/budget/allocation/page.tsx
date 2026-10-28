import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AllocationForm, RemoveAllocationButton } from '@/components/BudgetForms';
import { BudgetHeader, budgetTabsOf } from '@/components/BudgetHeader';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/States';
import { ZoneLabel, zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { BudgetLineView } from '@/data/repository';
import type { Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { campaignLabelOf } from '@/lib/labels';
import { getAccessContext } from '@/lib/session';

/**
 * Répartition de l'enveloppe par l'agence (F-50.9, D153) : par campagne et par CVR, en mode administration. Le total réparti ne dépasse
 * jamais l'enveloppe (contrôle de la couche de données). La cliente lit la répartition sur l'écran Situation.
 */
export default async function AllocationPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const one = (k: string) => (Array.isArray(query[k]) ? query[k]?.[0] : query[k]);
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const loc = ctx.locale;
  const t = await getTranslations('budget');
  const tr = await getTranslations('role');
  const tt = await getTranslations('table');

  const [view, zones, campaigns] = await Promise.all([repository.getBudget(ctx), repository.getScopeZones(ctx), repository.getCampaigns(ctx)]);
  if (!view.costsVisible) notFound();
  const canAllocate = repository.canAllocate(ctx);
  const campaignLabel = (code: string) => campaignLabelOf(campaigns, code, loc);
  const remaining = view.unallocated_cents;
  const cvrs = zones.filter((z) => z.kind === 'cvr').map((z) => ({ value: z.id, text: zoneText(z, loc) }));

  const columns: Column<BudgetLineView>[] = [
    { key: 'campaign', header: t('cols.campaign'), rowHeader: true, sortValue: (l) => l.campaign_code, render: (l) => campaignLabel(l.campaign_code) },
    { key: 'cvr', header: t('cols.cvr'), sortValue: (l) => zoneText(l.cvr, loc), render: (l) => <ZoneLabel zone={l.cvr} /> },
    { key: 'allocated', header: t('cols.allocated'), numeric: true, sortValue: (l) => l.allocated_cents, render: (l) => formatMoney(l.allocated_cents, loc) },
    { key: 'revision', header: t('cols.revision'), numeric: true, sortValue: (l) => l.revision, render: (l) => String(l.revision) },
    { key: 'updated', header: t('cols.updated'), sortValue: (l) => l.updated_on, render: (l) => formatDate(l.updated_on, loc) },
    ...(canAllocate ? [{ key: 'actions', header: t('cols.actions'), render: (l: BudgetLineView) => <RemoveAllocationButton lineId={l.id} /> }] : []),
  ];
  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const sortHref = (key: string, dir: 'asc' | 'desc') => `/budget/allocation?${new URLSearchParams({ sort: key, dir }).toString()}`;

  return (
    <>
      <BudgetHeader current="allocation" tabs={budgetTabsOf(view)} subtitle={tr(ctx.profileId)} />
      <p className="mb-6 max-w-prose text-muted">{t('allocation.intro')}</p>
      {!view.envelope ? (
        <p className="mb-6 text-muted" data-testid="allocation-no-envelope">{t('allocation.noEnvelope')}</p>
      ) : canAllocate ? (
        <div className="mb-8">
          <AllocationForm
            campaigns={campaigns.map(({ code }) => ({ value: code, text: campaignLabelOf(campaigns, code, loc) }))}
            cvrs={cvrs}
            lines={view.lines.map((l) => ({ campaign: l.campaign_code, cvrId: l.cvr.id, cents: l.allocated_cents, revision: l.revision }))}
            remainingCents={remaining ?? 0}
          />
        </div>
      ) : <p className="mb-6 text-muted" data-testid="allocation-readonly">{t('allocation.readOnly')}</p>}
      <section aria-labelledby="allocation-lines-title" className="flex flex-col gap-3">
        <h2 id="allocation-lines-title" className="text-lg font-semibold">{t('lines.title')}</h2>
        {view.lines.length === 0 ? (
          <EmptyState title={t('lines.emptyTitle')} body={t('lines.empty')} />
        ) : (
          <DataTable
            caption={t('lines.caption')}
            columns={columns}
            rows={sortRows(view.lines, columns, sort)}
            rowKey={(l) => l.id}
            rowData={(l) => ({ 'data-campaign': l.campaign_code, 'data-allocated-cents': String(l.allocated_cents) })}
            testId="allocation-lines"
            sort={sort}
            sortHref={sortHref}
            sortLabels={{ label: tt('sortLabel'), asc: tt('asc'), desc: tt('desc') }}
          />
        )}
      </section>
    </>
  );
}
