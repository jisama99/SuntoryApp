import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { DelegationCreateForm, RevokeDelegationButton } from '@/components/DelegationAdmin';
import { FilterTabs } from '@/components/FilterTabs';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import type { Tone } from '@/components/StatusTag';
import { ZoneLabel, zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { DelegationView } from '@/data/repository';
import { calendarOf } from '@/domain/deadlines';
import { DELEGATION_STATUSES } from '@/domain/types';
import type { DelegationStatus, Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { getAccessContext } from '@/lib/session';

const FILTERS = ['all', ...DELEGATION_STATUSES] as const;
const TONE: Record<DelegationStatus, Tone> = { planned: 'info', active: 'ok', ended: 'neutral', revoked: 'neutral' };

/** Délégations et suppléants (F-30.3). L'agence administration paramètre ; le prestataire consulte. Chaque changement a sa trace (EV-46). */
export default async function DelegationsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const one = (k: string) => (Array.isArray(query[k]) ? query[k]?.[0] : query[k]);
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const loc = ctx.locale;
  const t = await getTranslations();
  const [delegations, zones, deadline, events] = await Promise.all([
    repository.getDelegations(ctx), repository.getScopeZones(ctx), repository.getDeadlineContext(ctx), repository.getEvents(ctx),
  ]);
  const canManage = repository.canManageDelegations(ctx);
  const byId = new Map(zones.map((z) => [z.id, z]));
  const raw = one('filter') ?? 'all';
  const filter = (FILTERS as readonly string[]).includes(raw) ? raw : 'all';
  const shown = delegations.filter((d) => filter === 'all' || d.status === filter);
  const trace = events.filter(({ code: eventCode }) => eventCode === 'EV-46').slice(0, 20);

  const columns: Column<DelegationView>[] = [
    { key: 'delegator', header: t('delegations.cols.delegator'), rowHeader: true, render: (d) => <ZoneLabel zone={d.delegator} />, sortValue: (d) => zoneText(d.delegator, loc) },
    { key: 'substitute', header: t('delegations.cols.substitute'), render: (d) => <ZoneLabel zone={d.substitute} />, sortValue: (d) => zoneText(d.substitute, loc) },
    {
      key: 'period', header: t('delegations.cols.period'), sortValue: (d) => d.start_date,
      render: (d) => t('delegations.range', { start: formatDate(d.start_date, loc), end: formatDate(d.end_date, loc) }),
    },
    {
      key: 'status', header: t('delegations.cols.status'), sortValue: (d) => DELEGATION_STATUSES.indexOf(d.status),
      render: (d) => (
        <div className="flex flex-col items-start gap-1">
          <StatusTag tone={TONE[d.status]}>{t(`delegations.status.${d.status}`)}</StatusTag>
          {d.revoked_on ? <span className="text-sm text-muted">{t('delegations.revokedOn', { date: formatDate(d.revoked_on, loc) })}</span> : null}
        </div>
      ),
    },
    {
      key: 'trace', header: t('delegations.cols.trace'),
      render: (d) => <span className="text-sm text-muted">{t('delegations.createdOn', { date: formatDate(d.created_on, loc), who: t(`pipeline.actorProfile.${d.created_by}`) })}</span>,
    },
    ...(canManage ? [{
      key: 'actions', header: t('delegations.cols.actions'),
      render: (d: DelegationView) => (d.status === 'planned' || d.status === 'active' ? <RevokeDelegationButton delegationId={d.id} /> : <span className="text-muted">{t('delegations.none')}</span>),
    }] : []),
  ];
  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const sortHref = (key: string, dir: 'asc' | 'desc') => `/settings/delegations?${new URLSearchParams({ ...(filter !== 'all' ? { filter } : {}), sort: key, dir }).toString()}`;
  const keepSort: Record<string, string> = sort ? { sort: sort.key, dir: sort.dir } : {};
  const zoneOptions = zones.filter((z) => z.kind === 'cvr' || z.kind === 'dr').map((z) => ({ value: z.id, text: zoneText(z, loc), kind: z.kind as 'cvr' | 'dr' }));

  return (
    <>
      <Breadcrumb items={[{ label: t('menu.settings'), href: '/settings' }, { label: t('titles.delegations') }]} />
      <PageHeader title={t('titles.delegations')} subtitle={t(`role.${ctx.profileId}`)} />
      <p className="mb-6 max-w-prose text-muted">{t('delegations.intro')}</p>
      {canManage ? (
        <div className="mb-8">
          <DelegationCreateForm zones={zoneOptions} today={deadline.today} nonWorking={calendarOf(deadline.settings)} />
        </div>
      ) : <p className="mb-6 text-muted">{t('settings.readOnly')}</p>}
      <div className="mb-4">
        <FilterTabs
          label={t('delegations.filters.label')}
          basePath="/settings/delegations"
          param="filter"
          current={filter}
          keep={keepSort}
          items={FILTERS.map((f) => ({ value: f, text: t(`delegations.filters.${f}`) }))}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState title={t('delegations.emptyTitle')} body={delegations.length === 0 ? t('delegations.empty') : t('delegations.emptyFilter')} />
      ) : (
        <DataTable
          caption={t('delegations.caption')}
          columns={columns}
          rows={sortRows(shown, columns, sort)}
          rowKey={(d) => d.id}
          rowData={(d) => ({ 'data-delegation-status': d.status })}
          testId="delegations-table"
          sort={sort}
          sortHref={sortHref}
          sortLabels={{ label: t('table.sortLabel'), asc: t('table.asc'), desc: t('table.desc') }}
        />
      )}
      <section aria-labelledby="delegation-trace-title" data-testid="delegation-trace" className="mt-8 flex flex-col gap-3">
        <h2 id="delegation-trace-title" className="text-lg font-semibold">{t('delegations.traceTitle')}</h2>
        {trace.length === 0 ? <p className="text-muted">{t('delegations.traceEmpty')}</p> : (
          <ul className="flex flex-col gap-2">
            {trace.map(({ id, code: eventCode, audience, data, effect_date, actor_profile }) => {
              const a = byId.get(String(data.delegator_zone));
              const b = byId.get(String(data.substitute_zone));
              return (
                <li key={id} data-event-code={eventCode} data-audience={audience} className="flex flex-wrap items-center gap-3 rounded-ctl bg-alt px-4 py-2">
                  <span className="text-sm text-muted">{formatDate(effect_date, loc)}</span>
                  <span className="font-semibold">{t(`delegations.trace.${String(data.action)}`)}</span>
                  {a ? <ZoneLabel zone={a} /> : null}
                  {b ? <ZoneLabel zone={b} /> : null}
                  <span className="text-sm text-muted">{t('delegations.range', { start: formatDate(String(data.start), loc), end: formatDate(String(data.end), loc) })}</span>
                  <span className="text-sm text-muted">{t(`pipeline.actorProfile.${actor_profile}`)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
