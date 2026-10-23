import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DataTable } from '@/components/DataTable';
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
import { formatDate, formatIsoWeek } from '@/lib/format';
import { getAccessContext } from '@/lib/session';

const linkBtn = 'inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-link hover:bg-sel';

export default async function NeedsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'needs')) notFound();

  const t = await getTranslations();
  const [needs, totals, zones] = await Promise.all([
    repository.getNeeds(ctx),
    repository.getNeedTotals(ctx),
    repository.getScopeZones(ctx),
  ]);
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
    { key: 'need', header: t('needs.cols.need'), render: (n) => <span className="whitespace-nowrap font-mono text-sm">{n.need_code}</span> },
    { key: 'sector', header: t('needs.cols.sector'), render: (n) => (sectors.get(n.sector_id) ? <ZoneLabel zone={sectors.get(n.sector_id)!} /> : null) },
    { key: 'dispositif', header: t('needs.cols.dispositif'), render: (n) => (n.dispositif ? t(`dispositif.${n.dispositif}`) : <span className="text-muted">{t('needs.list.toComplete')}</span>) },
    { key: 'period', header: t('needs.cols.period'), render: periodsOf },
    { key: 'hours', header: t('needs.cols.hours'), numeric: true, render: (n) => (n.weekly_hours === null ? <span className="text-muted">{t('needs.list.toComplete')}</span> : n.weekly_hours) },
    {
      key: 'state', header: t('needs.cols.state'),
      render: (n) => (
        <div className="flex flex-col items-start gap-1">
          <StatusTag tone={n.need_state === 'draft' ? 'attention' : 'info'}>{t(`needs.state.${n.need_state}`)}</StatusTag>
          {n.on_behalf ? <span className="text-sm text-muted">{t('needs.list.onBehalf')}</span> : null}
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

  return (
    <>
      <PageHeader title={t('menu.needs')} subtitle={t(`role.${ctx.profileId}`)} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Tile tone="aqua" label={t('needs.tiles.submitted')} value={String(totals.submitted)} />
        <Tile tone="lav" label={t('needs.tiles.hours')} value={String(totals.weekly_hours)} />
        <Tile tone="sand" label={t('needs.tiles.drafts')} value={String(totals.drafts)}>{t('needs.tiles.draftsNote')}</Tile>
      </div>
      {canWrite ? (
        <div className="mb-6">
          <Link href="/needs/new" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
            {t('needs.new')}
          </Link>
        </div>
      ) : (
        <p className="mb-6 text-muted">{t('needs.readOnly')}</p>
      )}
      {needs.length === 0 ? (
        <EmptyState title={t('states.empty.title')} body={t('needs.empty')} />
      ) : (
        <DataTable caption={t('needs.caption')} columns={columns} rows={needs} rowKey={(n) => n.id} rowId={(n) => `need-${n.id}`} />
      )}
    </>
  );
}
