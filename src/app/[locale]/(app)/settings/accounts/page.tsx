import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AccountCreateForm, AccountRowActions } from '@/components/AccountsAdmin';
import type { ZoneOption } from '@/components/AccountsAdmin';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { FilterTabs } from '@/components/FilterTabs';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { ZoneLabel, zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { PublicAccount } from '@/data/schemas';
import { CREATABLE_PROFILES } from '@/domain/accounts';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

const FILTERS = ['all', 'active', 'disabled'] as const;

/** Gestion des comptes (D189) : agence administration seule ; toute autre personne reçoit une page introuvable. */
export default async function AccountsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const one = (k: string) => (Array.isArray(query[k]) ? query[k]?.[0] : query[k]);
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  if (!repository.canManageAccounts(ctx)) notFound();

  const t = await getTranslations();
  const [accounts, zones] = await Promise.all([repository.listAccounts(ctx), repository.getScopeZones(ctx)]);
  const byId = new Map(zones.map((z) => [z.id, z]));
  const zoneOptions: ZoneOption[] = zones.map((z) => ({ value: z.id, text: zoneText(z, ctx.locale), kind: z.kind }));

  const rawFilter = one('filter') ?? 'all';
  const filter = (FILTERS as readonly string[]).includes(rawFilter) ? rawFilter : 'all';
  const shown = accounts.filter((a) => (filter === 'active' ? a.active : filter === 'disabled' ? !a.active : true));

  const columns: Column<PublicAccount>[] = [
    { key: 'username', header: t('accounts.cols.username'), rowHeader: true, render: (a) => <span className="font-mono font-semibold">{a.username}</span>, sortValue: (a) => a.username.toLowerCase() },
    { key: 'profile', header: t('accounts.cols.profile'), render: (a) => t(`profile.${a.profile}`), sortValue: (a) => t(`profile.${a.profile}`) },
    {
      key: 'scope', header: t('accounts.cols.scope'),
      render: (a) =>
        a.scope.kind === 'all' ? (
          t('home.scope.all')
        ) : (
          <ul className="flex flex-col gap-1">
            {a.scope.ids.map((id) => (byId.get(id) ? <li key={id}><ZoneLabel zone={byId.get(id)!} /></li> : null))}
          </ul>
        ),
    },
    {
      key: 'status', header: t('accounts.cols.status'), sortValue: (a) => (a.active ? 0 : 1),
      render: (a) => (
        <div className="flex flex-col items-start gap-1">
          <StatusTag tone={a.active ? 'ok' : 'neutral'}>{t(`accounts.status.${a.active ? 'active' : 'disabled'}`)}</StatusTag>
          {a.must_change_password ? <StatusTag tone="attention">{t('auth.temporaryPassword')}</StatusTag> : null}
        </div>
      ),
    },
    {
      key: 'actions', header: t('accounts.cols.actions'),
      render: (a) => (
        <AccountRowActions accountId={a.id} username={a.username} active={a.active} profile={a.profile} protectedAccount={a.profile === 'provider_admin'} self={a.id === ctx.accountId} profiles={CREATABLE_PROFILES} zones={zoneOptions} />
      ),
    },
  ];
  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const keepSort: Record<string, string> = sort ? { sort: sort.key, dir: sort.dir } : {};
  const sortHref = (key: string, dir: 'asc' | 'desc') => `/settings/accounts?${new URLSearchParams({ ...(filter !== 'all' ? { filter } : {}), sort: key, dir }).toString()}`;

  return (
    <>
      <Breadcrumb items={[{ label: t('menu.settings'), href: '/settings' }, { label: t('accounts.title') }]} />
      <PageHeader title={t('accounts.title')} subtitle={t(`role.${ctx.profileId}`)} />
      <AccountCreateForm profiles={CREATABLE_PROFILES} zones={zoneOptions} />
      <div className="mb-4">
        <FilterTabs
          label={t('accounts.filters.label')}
          basePath="/settings/accounts"
          param="filter"
          current={filter}
          keep={keepSort}
          items={FILTERS.map((f) => ({ value: f, text: t(`accounts.filters.${f}`) }))}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState title={t('states.empty.title')} body={t('states.empty.body')} />
      ) : (
        <DataTable
          caption={t('accounts.caption')}
          columns={columns}
          rows={sortRows(shown, columns, sort)}
          rowKey={(a) => a.id}
          rowData={(a) => ({ 'data-username': a.username })}
          testId="accounts-table"
          sort={sort}
          sortHref={sortHref}
          sortLabels={{ label: t('table.sortLabel'), asc: t('table.asc'), desc: t('table.desc') }}
        />
      )}
    </>
  );
}
