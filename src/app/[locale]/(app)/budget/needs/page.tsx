import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BudgetHeader, budgetTabsOf } from '@/components/BudgetHeader';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import type { Tone } from '@/components/StatusTag';
import { ZoneLabel } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { BudgetNeedRow } from '@/data/repository';
import type { Zone } from '@/data/schemas';
import { BUDGET_STATUSES } from '@/domain/types';
import type { BudgetStatus, Locale } from '@/domain/types';
import { Link } from '@/i18n/navigation';
import { formatDate, keepTogether } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { campaignLabelOf } from '@/lib/labels';
import { getAccessContext } from '@/lib/session';

const FILTERS = ['all', ...BUDGET_STATUSES, 'consumed', 'forecast'] as const;
const TONE: Record<BudgetStatus, Tone> = { within: 'ok', beyond: 'risk', no_budget: 'attention', unpriced: 'attention' };

/**
 * Prévisionnel par besoin (F-50.9) : coût estimé de chaque besoin compté, à la maille (campagne, CVR). Réservé à l'agence : le coût
 * d'un besoin repose sur des tarifs que la cliente ne lit pas par défaut (D108).
 */
export default async function BudgetNeedsPage({ params, searchParams }: {
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
  const td = await getTranslations('dispositif');
  const tr = await getTranslations('role');
  const tt = await getTranslations('table');

  const [view, rows, rates, zones, campaigns] = await Promise.all([
    repository.getBudget(ctx), repository.getBudgetNeeds(ctx), repository.getBudgetRates(ctx), repository.getScopeZones(ctx), repository.getCampaigns(ctx),
  ]);
  if (!view.costsVisible) notFound();
  const zoneById = new Map<string, Zone>(zones.map((z) => [z.id, z]));
  const campaignLabel = (code: string | null) => (code ? campaignLabelOf(campaigns, code, loc) : t('notFilled'));
  const raw = one('filter') ?? 'all';
  const filter = (FILTERS as readonly string[]).includes(raw) ? raw : 'all';
  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'consumed' || filter === 'forecast' ? r.kind === filter : r.status === filter));

  const columns: Column<BudgetNeedRow>[] = [
    {
      key: 'need', header: t('cols.need'), rowHeader: true, sortValue: (r) => r.needCode,
      render: (r) => <Link href={`/proposals/${r.needId}`} className="inline-flex min-h-11 items-center font-mono text-sm font-semibold text-link hover:bg-sel">{keepTogether(r.needCode)}</Link>,
    },
    { key: 'sector', header: t('cols.sector'), render: (r) => (zoneById.get(r.sectorId) ? <ZoneLabel zone={zoneById.get(r.sectorId) as Zone} /> : null) },
    { key: 'campaign', header: t('cols.campaign'), sortValue: (r) => r.campaign ?? '', render: (r) => campaignLabel(r.campaign) },
    { key: 'hours', header: t('cols.hours'), numeric: true, sortValue: (r) => r.cost.hours, render: (r) => (r.cost.hours === null ? t('notFilled') : String(r.cost.hours)) },
    { key: 'weeks', header: t('cols.weeks'), numeric: true, sortValue: (r) => r.cost.weeks, render: (r) => String(r.cost.weeks) },
    { key: 'rate', header: t('cols.rate'), numeric: true, render: (r) => (r.cost.rateCents === null ? t('notFilled') : formatMoney(r.cost.rateCents, loc)) },
    {
      key: 'cost', header: t('cols.cost'), numeric: true, sortValue: (r) => r.cost.cents,
      render: (r) => (r.cost.cents === null ? <span>{t('notPriced')}{r.cost.missing ? <span className="block text-sm text-muted">{t(`missing.${r.cost.missing}`)}</span> : null}</span> : formatMoney(r.cost.cents, loc)),
    },
    { key: 'nature', header: t('cols.nature'), sortValue: (r) => r.kind, render: (r) => t(`nature.${r.kind}`) },
    { key: 'status', header: t('cols.status'), sortValue: (r) => r.status, render: (r) => <StatusTag tone={TONE[r.status]}>{t(`status.${r.status}`)}</StatusTag> },
  ];
  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const keepFilter: Record<string, string> = filter !== 'all' ? { filter } : {};
  const sortHref = (key: string, dir: 'asc' | 'desc') => `/budget/needs?${new URLSearchParams({ ...keepFilter, sort: key, dir }).toString()}`;
  const keepSort: Record<string, string> = sort ? { sort: sort.key, dir: sort.dir } : {};

  return (
    <>
      <BudgetHeader current="needs" tabs={budgetTabsOf(view)} subtitle={tr(ctx.profileId)} />
      <p className="mb-6 max-w-prose text-muted">{t('needs.intro')}</p>
      <div className="mb-4">
        <FilterTabs
          label={t('needs.filters.label')}
          basePath="/budget/needs"
          param="filter"
          current={filter}
          keep={keepSort}
          items={FILTERS.map((f) => ({ value: f, text: t(`needs.filters.${f}`) }))}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState title={t('needs.emptyTitle')} body={t('needs.empty')} />
      ) : (
        <DataTable
          caption={t('needs.caption')}
          columns={columns}
          rows={sortRows(shown, columns, sort)}
          rowKey={(r) => r.needId}
          rowData={(r) => ({ 'data-need-code': r.needCode, 'data-budget-status': r.status, 'data-kind': r.kind })}
          testId="budget-needs"
          sort={sort}
          sortHref={sortHref}
          sortLabels={{ label: tt('sortLabel'), asc: tt('asc'), desc: tt('desc') }}
        />
      )}
      <section aria-labelledby="budget-rates-title" className="mt-8 flex flex-col gap-3">
        <h2 id="budget-rates-title" className="text-lg font-semibold">{t('needs.ratesTitle')}</h2>
        <p className="max-w-prose text-sm text-muted">{t('needs.ratesNote')}</p>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="budget-rates">
          {rates.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 rounded-card bg-surface p-4 shadow-card">
              <span className="font-semibold">{td(r.dispositif)}</span>
              <span className="tabular text-lg font-semibold">{formatMoney(Math.round(r.hourly_rate_eur_ht * 100), loc)}</span>
              <span className="text-sm text-muted">{t('needs.ratesFrom', { date: formatDate(r.valid_from, loc) })}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
