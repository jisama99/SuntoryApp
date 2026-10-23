import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import { DeadlineBanner } from '@/components/DeadlineBanner';
import { DelaySummary } from '@/components/DelaySummary';
import { FilterTabs } from '@/components/FilterTabs';
import { ReopenRequestForm } from '@/components/ReopenRequestForm';
import type { Column } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { Tile } from '@/components/Tile';
import { ZoneLabel } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { Need } from '@/data/schemas';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/domain/types';
import { resolvePeriod } from '@/domain/week-rules';
import { addMonths } from '@/domain/working-days';
import { bannerRows } from '@/lib/deadline-view';
import { formatDate, formatIsoWeek, formatMonth } from '@/lib/format';
import { getAccessContext } from '@/lib/session';

const linkBtn = 'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-link hover:bg-sel';

const LIST_FILTERS = ['all', 'draft', 'submitted', 'deferred'] as const;

export default async function NeedsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const one = (k: string) => (Array.isArray(query[k]) ? query[k]?.[0] : query[k]);
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'needs')) notFound();

  const t = await getTranslations();
  const [allNeeds, totals, zones, deadline, delays, closures, requests] = await Promise.all([
    repository.getNeeds(ctx),
    repository.getNeedTotals(ctx),
    repository.getScopeZones(ctx),
    repository.getDeadlineContext(ctx),
    repository.getDelaySummary(ctx),
    repository.getWeekClosures(ctx),
    repository.getReopeningRequests(ctx),
  ]);
  // Filtres portés par l'adresse (règle commune 14) : valeur inconnue = valeur par défaut.
  const rawFilter = one('filter') ?? 'all';
  const filter = (LIST_FILTERS as readonly string[]).includes(rawFilter) ? rawFilter : 'all';
  const rawMonth = one('month') ?? '';
  const month = delays.some((d) => d.month === rawMonth) ? rawMonth : (delays[0]?.month ?? '');
  const needs = allNeeds.filter((n) =>
    filter === 'draft' ? n.need_state === 'draft' : filter === 'submitted' ? n.need_state === 'submitted' : filter === 'deferred' ? Boolean(n.deferred_from_month) : true,
  );

  const reopened = new Set(deadline.reopenings.filter((r) => r.scope === 'week').map((r) => r.target));
  const closedMonths = [...new Set(bannerRows(deadline, null, null).closed.map((r) => r.month))];
  const closedWeeks = closures.map((w) => w.week).filter((w) => !reopened.has(w));
  const canWrite = repository.canWriteNeeds(ctx);
  const sectors = new Map(zones.map((z) => [z.id, z]));
  const loc = ctx.locale;

  const periodsOf = (n: Need) =>
    n.periods.length === 0 ? (
      <span className="text-muted">{t('needs.list.noPeriod')}</span>
    ) : (
      <ul className="flex flex-col gap-1">
        {n.periods.map((p) => {
          const r = resolvePeriod(p);
          return (
            <li key={p.period_no}>
              {r.start && r.end
                ? p.start_week === p.end_week
                  ? t('needs.list.periodOneWeek', {
                      n: p.period_no,
                      start: formatDate(r.start, loc),
                      end: formatDate(r.end, loc),
                      week: formatIsoWeek(p.start_week ?? '', loc),
                    })
                  : t('needs.list.period', {
                      n: p.period_no,
                      start: formatDate(r.start, loc),
                      end: formatDate(r.end, loc),
                      from: formatIsoWeek(p.start_week ?? '', loc),
                      to: formatIsoWeek(p.end_week ?? '', loc),
                    })
                : t('needs.list.noPeriod')}
            </li>
          );
        })}
      </ul>
    );


  const columns: Column<Need>[] = [
    { key: 'need', header: t('needs.cols.need'), render: (n) => <span className="whitespace-nowrap font-mono text-sm">{n.need_code}</span>, sortValue: (n) => n.need_code },
    { key: 'sector', header: t('needs.cols.sector'), render: (n) => (sectors.get(n.sector_id) ? <ZoneLabel zone={sectors.get(n.sector_id)!} /> : null) },
    { key: 'dispositif', header: t('needs.cols.dispositif'), render: (n) => (n.dispositif ? t(`dispositif.${n.dispositif}`) : <span className="text-muted">{t('needs.list.toComplete')}</span>), sortValue: (n) => (n.dispositif ? t(`dispositif.${n.dispositif}`) : null) },
    { key: 'period', header: t('needs.cols.period'), render: periodsOf, sortValue: (n) => n.periods.map(resolvePeriod).find((p) => p.start)?.start ?? null },
    { key: 'hours', header: t('needs.cols.hours'), numeric: true, sortValue: (n) => n.weekly_hours, render: (n) => (n.weekly_hours === null ? <span className="text-muted">{t('needs.list.toComplete')}</span> : n.weekly_hours) },
    {
      key: 'state', header: t('needs.cols.state'), sortValue: (n) => t(`needs.state.${n.need_state}`),
      render: (n) => (
        <div className="flex flex-col items-start gap-1">
          <StatusTag tone={n.need_state === 'draft' ? 'attention' : 'info'}>{t(`needs.state.${n.need_state}`)}</StatusTag>
          {n.on_behalf ? <span className="text-sm text-muted">{t('needs.list.onBehalf')}</span> : null}
          {n.deferred_from_month ? (
            <StatusTag tone="important">{t('needs.list.deferred', { from: formatMonth(n.deferred_from_month, loc), to: formatMonth(addMonths(n.deferred_from_month, 1), loc) })}</StatusTag>
          ) : null}
        </div>
      ),
    },
    ...(canWrite
      ? [{
          key: 'actions', header: t('needs.cols.actions'),
          render: (n: Need) => (
            <div className="flex flex-wrap gap-1">
              {n.need_state === 'draft' ? (
                <Link href={`/needs/${n.id}/edit`} className={linkBtn}>{t('needs.actions.complete')}</Link>
              ) : null}
              {n.periods.length > 0 ? <Link href={`/needs/${n.id}/duplicate`} className={linkBtn}>{t('needs.actions.duplicate')}</Link> : null}
            </div>
          ),
        }]
      : []),
  ];

  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const keepSort: Record<string, string> = sort ? { sort: sort.key, dir: sort.dir } : {};
  const keepMonth: Record<string, string> = { ...(month && month !== delays[0]?.month ? { month } : {}), ...keepSort };
  const keepFilter: Record<string, string> = { ...(filter !== 'all' ? { filter } : {}), ...keepSort };
  const sortHref = (key: string, dir: 'asc' | 'desc') => {
    const q = new URLSearchParams({ ...(month && month !== delays[0]?.month ? { month } : {}), ...(filter !== 'all' ? { filter } : {}), sort: key, dir });
    return `/needs?${q.toString()}`;
  };

  return (
    <>
      <Breadcrumb items={[{ label: t('menu.needs') }]} />
      <PageHeader title={t('needs.title')} subtitle={t(`role.${ctx.profileId}`)} />
      <DeadlineBanner context={deadline} dispositif="all" sectorId={null} />
      <DelaySummary months={delays} current={month} keep={keepFilter} />
      {ctx.profileId === 'cvr_client' ? (
        <ReopenRequestForm context={deadline} closedMonths={closedMonths} closedWeeks={closedWeeks} requests={requests} />
      ) : null}
      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <Tile tone="aqua" label={t('needs.tiles.submitted')} value={String(totals.submitted)} />
        <Tile tone="lav" label={t('needs.tiles.hours')} value={String(totals.weekly_hours)} />
        <Tile tone="sand" label={t('needs.tiles.drafts')} value={String(totals.drafts)}>{t('needs.tiles.draftsNote')}</Tile>
      </div>
      {canWrite ? (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/needs/new" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-fill hover:bg-primary-hover">
            {t('needs.new')}
          </Link>
          <Link href="/needs/batch" className="inline-flex min-h-11 items-center rounded-full border-2 border-primary bg-surface px-5 text-sm font-semibold text-link hover:bg-sel">
            {t('needs.batch')}
          </Link>
        </div>
      ) : (
        <p className="mb-6 text-muted">{t('needs.readOnly')}</p>
      )}
      <div className="mb-4">
        <FilterTabs
          label={t('needs.filters.label')}
          basePath="/needs"
          param="filter"
          current={filter}
          keep={keepMonth}
          items={LIST_FILTERS.map((f) => ({ value: f, text: t(`needs.filters.${f}`) }))}
        />
      </div>
      {needs.length === 0 ? (
        <EmptyState title={t('states.empty.title')} body={allNeeds.length === 0 ? t('needs.empty') : t('needs.emptyFilter')} />
      ) : (
        <DataTable
          caption={t('needs.caption')}
          columns={columns}
          rows={sortRows(needs, columns, sort)}
          rowKey={(n) => n.id}
          rowId={(n) => `need-${n.id}`}
          sort={sort}
          sortHref={sortHref}
          sortLabels={{ label: t('table.sortLabel'), asc: t('table.asc'), desc: t('table.desc') }}
        />
      )}
    </>
  );
}
