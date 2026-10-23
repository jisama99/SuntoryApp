import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { DelegationCreateForm, DelegationStopButton } from '@/components/DelegationsAdmin';
import type { DelegationZoneOption } from '@/components/DelegationsAdmin';
import { FilterTabs } from '@/components/FilterTabs';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { ZoneLabel, zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { Delegation } from '@/data/schemas';
import { calendarOf } from '@/domain/deadlines';
import type { Locale } from '@/domain/types';
import { delegationStatus } from '@/domain/validation';
import { formatDate } from '@/lib/format';
import { DELEGATION_TONE } from '@/lib/pipeline-tones';
import { getAccessContext } from '@/lib/session';

const FILTERS = ['all', 'active', 'planned', 'ended'] as const;

/**
 * Délégations et suppléants (F-30.3, D09 ouverte). L'agence administration crée et arrête ; le prestataire consulte. La cliente
 * n'a pas cet écran : le menu Paramètres ne lui est pas ouvert (D118) et la liste n'est jamais lue côté cliente.
 */
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
  const [delegations, zones, deadline] = await Promise.all([repository.getDelegations(ctx), repository.getScopeZones(ctx), repository.getDeadlineContext(ctx)]);
  const byId = new Map(zones.map((z) => [z.id, z]));
  const today = deadline.today;
  const canEdit = repository.canManageDelegations(ctx);
  const zoneOptions: DelegationZoneOption[] = zones
    .filter((z): z is typeof z & { kind: 'cvr' | 'dr' } => z.kind === 'cvr' || z.kind === 'dr')
    .map((z) => ({ value: z.id, text: zoneText(z, loc), kind: z.kind }));

  const rawFilter = one('filter') ?? 'all';
  const filter = (FILTERS as readonly string[]).includes(rawFilter) ? rawFilter : 'all';
  const statusOf = (d: Delegation) => delegationStatus(d, today);
  const shown = delegations.filter((d) => (filter === 'all' ? true : filter === 'ended' ? ['ended', 'cancelled'].includes(statusOf(d)) : statusOf(d) === filter));

  const zoneCell = (id: string) => (byId.get(id) ? <ZoneLabel zone={byId.get(id)!} /> : null);
  const columns: Column<Delegation>[] = [
    { key: 'absent', header: t('delegations.cols.absent'), render: (d) => zoneCell(d.absent_zone_id) },
    { key: 'substitute', header: t('delegations.cols.substitute'), render: (d) => zoneCell(d.substitute_zone_id) },
    {
      key: 'period', header: t('delegations.cols.period'), sortValue: (d) => d.starts_on,
      render: (d) => t('delegations.period', { start: formatDate(d.starts_on, loc), end: formatDate(d.ends_on, loc) }),
    },
    {
      key: 'status', header: t('delegations.cols.status'), sortValue: (d) => statusOf(d),
      render: (d) => <StatusTag tone={DELEGATION_TONE[statusOf(d)]}>{t(`delegations.status.${statusOf(d)}`)}</StatusTag>,
    },
    {
      key: 'trace', header: t('delegations.cols.trace'),
      render: (d) => (
        <div className="flex flex-col items-start gap-1 text-sm">
          <span>{t('delegations.createdBy', { date: formatDate(d.created_on, loc) })}</span>
          {d.stopped_on ? <span>{t('delegations.stoppedOn', { date: formatDate(d.stopped_on, loc) })}</span> : null}
          {d.motive ? <span className="text-muted">{d.motive}</span> : null}
        </div>
      ),
    },
    ...(canEdit ? [{
      key: 'actions', header: t('delegations.cols.actions'),
      render: (d: Delegation) => (['active', 'planned'].includes(statusOf(d)) ? <DelegationStopButton delegationId={d.id} planned={statusOf(d) === 'planned'} /> : null),
    }] : []),
  ];
  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const keepSort: Record<string, string> = sort ? { sort: sort.key, dir: sort.dir } : {};
  const sortHref = (key: string, dir: 'asc' | 'desc') => `/settings/delegations?${new URLSearchParams({ ...(filter !== 'all' ? { filter } : {}), sort: key, dir }).toString()}`;

  return (
    <>
      <Breadcrumb items={[{ label: t('menu.settings'), href: '/settings' }, { label: t('titles.delegations') }]} />
      <PageHeader title={t('titles.delegations')} subtitle={t(`role.${ctx.profileId}`)} />
      {canEdit ? <DelegationCreateForm zones={zoneOptions} today={today} nonWorking={calendarOf(deadline.settings)} /> : <p className="mb-6 text-muted">{t('delegations.readOnly')}</p>}
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
        <EmptyState title={t('states.empty.title')} body={t('delegations.empty')} />
      ) : (
        <DataTable
          caption={t('delegations.caption')}
          columns={columns}
          rows={sortRows(shown, columns, sort)}
          rowKey={(d) => d.id}
          rowData={(d) => ({ 'data-delegation-status': statusOf(d) })}
          testId="delegations-table"
          sort={sort}
          sortHref={sortHref}
          sortLabels={{ label: t('table.sortLabel'), asc: t('table.asc'), desc: t('table.desc') }}
        />
      )}
      {canEdit ? <p className="mt-6 text-sm text-muted">{t('delegations.stopHelp')}</p> : null}
    </>
  );
}
