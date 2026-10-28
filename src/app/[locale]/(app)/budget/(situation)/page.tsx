import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BudgetAlertList } from '@/components/BudgetAlertList';
import { BudgetBar } from '@/components/BudgetBar';
import type { ChartTone } from '@/components/BudgetBar';
import { BudgetHeader, budgetTabsOf } from '@/components/BudgetHeader';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { Tile } from '@/components/Tile';
import { ZoneLabel, zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { BudgetGroup, BudgetLineView } from '@/data/repository';
import type { Zone } from '@/data/schemas';
import type { Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { formatEuros, formatMoney } from '@/lib/money';
import { campaignLabelOf } from '@/lib/labels';
import { getAccessContext } from '@/lib/session';

const AXES = ['dispositif', 'dr', 'campaign', 'cvr'] as const;
type Axis = (typeof AXES)[number];
const DISPOSITIF_TONES: ChartTone[] = ['dispositif1', 'dispositif2', 'dispositif3', 'dispositif4'];

/** Part d'un montant dans un total, en pourcentage entier borné ; un total nul ou inconnu ne donne aucune part. */
const pctOf = (value: number | null, total: number | null): number => (value === null || total === null || total <= 0 ? 0 : Math.round(Math.min(1, Math.max(0, value / total)) * 100));

/**
 * Situation du budget (D153, D154 pour la part qui revient à A4a). La cliente lit l'enveloppe et la répartition ; les coûts
 * (consommé, prévisionnel, atterrissage, disponible) sont réservés à l'agence et décidés par la couche de données.
 */
export default async function BudgetPage({ params, searchParams }: {
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

  const [view, alerts, zones, campaigns] = await Promise.all([
    repository.getBudget(ctx), repository.getBudgetAlerts(ctx), repository.getScopeZones(ctx), repository.getCampaigns(ctx),
  ]);
  const zoneById = new Map<string, Zone>(zones.map((z) => [z.id, z]));
  const campaignLabel = (code: string) => campaignLabelOf(campaigns, code, loc);
  const rawBy = one('by');
  const by: Axis = (AXES as readonly string[]).includes(rawBy ?? '') ? (rawBy as Axis) : 'dispositif';
  const costs = view.costsVisible;
  const money = (cents: number | null, none: string) => (cents === null ? none : formatMoney(cents, loc));

  // ---- Tuiles -------------------------------------------------------------------------------------------------------
  const env = view.envelope;
  const f = view.figures;
  const pctAllocated = env && view.allocated_cents !== null ? pctOf(view.allocated_cents, Math.round(env.amount_eur_ht * 100)) : null;
  const overrun = f?.available !== null && f?.available !== undefined && f.available < 0;

  // ---- Répartition --------------------------------------------------------------------------------------------------
  const groups = view.groups[by];
  const totalAllocated = view.allocated_cents;
  const labelOf = (g: BudgetGroup) => {
    if (by === 'dispositif') return td(g.key);
    if (by === 'campaign') return campaignLabel(g.key);
    const z = zoneById.get(g.key);
    return z ? zoneText(z, loc) : g.key;
  };
  const labelNode = (g: BudgetGroup) => {
    if (by === 'dispositif') return td(g.key);
    if (by === 'campaign') return campaignLabel(g.key);
    const z = zoneById.get(g.key);
    return z ? <ZoneLabel zone={z} /> : g.key;
  };

  // ---- Lignes -------------------------------------------------------------------------------------------------------
  const lineStatus = (l: BudgetLineView) => (l.figures ? (l.figures.available !== null && l.figures.available < 0 ? 'beyond' : l.figures.total === 0 ? null : l.figures.priced < l.figures.total ? 'unpriced' : 'within') : null);
  const columns: Column<BudgetLineView>[] = [
    { key: 'campaign', header: t('cols.campaign'), rowHeader: true, sortValue: (l) => l.campaign_code, render: (l) => <span>{campaignLabel(l.campaign_code)}</span> },
    { key: 'cvr', header: t('cols.cvr'), sortValue: (l) => zoneText(l.cvr, loc), render: (l) => <ZoneLabel zone={l.cvr} /> },
    { key: 'allocated', header: t('cols.allocated'), numeric: true, sortValue: (l) => l.allocated_cents, render: (l) => formatMoney(l.allocated_cents, loc) },
    ...(costs ? [
      { key: 'consumed', header: t('cols.consumed'), numeric: true, sortValue: (l: BudgetLineView) => l.figures?.consumed ?? null, render: (l: BudgetLineView) => money(l.figures?.consumed ?? null, t('notPriced')) },
      { key: 'forecast', header: t('cols.forecast'), numeric: true, sortValue: (l: BudgetLineView) => l.figures?.forecast ?? null, render: (l: BudgetLineView) => money(l.figures?.forecast ?? null, t('notPriced')) },
      { key: 'available', header: t('cols.available'), numeric: true, sortValue: (l: BudgetLineView) => l.figures?.available ?? null, render: (l: BudgetLineView) => money(l.figures?.available ?? null, t('notPriced')) },
      {
        key: 'status', header: t('cols.status'),
        render: (l: BudgetLineView) => {
          const s = lineStatus(l);
          return s ? <StatusTag tone={s === 'within' ? 'ok' : s === 'beyond' ? 'risk' : 'attention'}>{t(`status.${s}`)}</StatusTag> : <span className="text-muted">{t('groups.empty')}</span>;
        },
      },
    ] : []),
    { key: 'updated', header: t('cols.updated'), sortValue: (l) => l.updated_on, render: (l) => formatDate(l.updated_on, loc) },
  ];
  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const keepBy: Record<string, string> = by !== 'dispositif' ? { by } : {};
  const sortHref = (key: string, dir: 'asc' | 'desc') => `/budget?${new URLSearchParams({ ...keepBy, sort: key, dir }).toString()}`;
  const keepSort: Record<string, string> = sort ? { sort: sort.key, dir: sort.dir } : {};

  return (
    <>
      <BudgetHeader current="situation" tabs={budgetTabsOf(view)} subtitle={tr(ctx.profileId)} />

      <section aria-label={t('measuresTitle')} data-testid="budget-tiles" className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {view.envelopeVisible ? (
          <>
            <Tile tone="anchor" label={t('tiles.envelope')} value={env ? formatEuros(env.amount_eur_ht, loc) : t('notFilled')}>
              {env ? t('tiles.envelopeSub', { version: env.version, date: formatDate(env.entered_on, loc) }) : null}
            </Tile>
            <Tile tone="aqua" label={t('tiles.allocated')} value={money(view.allocated_cents, t('notFilled'))}>
              {pctAllocated !== null ? t('tiles.allocatedSub', { pct: pctAllocated }) : null}
            </Tile>
            <Tile tone="sand" label={t('tiles.unallocated')} value={money(view.unallocated_cents, t('notFilled'))}>{t('tiles.unallocatedSub')}</Tile>
          </>
        ) : (
          <Tile tone="aqua" label={t('tiles.allocatedZone')} value={money(view.allocated_cents, t('notFilled'))} />
        )}
        {f ? (
          <>
            <Tile tone="lav" label={t('tiles.consumed')} value={money(f.consumed, t('notPriced'))}>{t('tiles.consumedSub')}</Tile>
            <Tile tone="lav" label={t('tiles.forecast')} value={money(f.forecast, t('notPriced'))}>{t('tiles.forecastSub')}</Tile>
            <Tile tone="lav" label={t('tiles.landing')} value={money(f.landing, t('notPriced'))}>{t('tiles.landingSub')}</Tile>
            <Tile tone="aqua" attention={overrun} label={overrun ? t('tiles.over') : t('tiles.available')} value={f.available === null ? t('notFilled') : formatMoney(overrun ? -f.available : f.available, loc)}>
              {t('tiles.availableSub')}
            </Tile>
            <Tile tone="sand" label={t('tiles.coverageLabel')} value={`${f.priced} / ${f.total}`}>
              {t('tiles.coverage', { priced: f.priced, total: f.total })}
            </Tile>
          </>
        ) : null}
      </section>

      <section aria-labelledby="budget-alerts-title" className="mb-8 flex flex-col gap-3">
        <h2 id="budget-alerts-title" className="text-lg font-semibold">{t('alertsTitle')}</h2>
        {alerts.length === 0 ? <p className="text-muted" data-testid="budget-alerts-empty">{t('alertsEmpty')}</p> : <BudgetAlertList alerts={alerts} showAudience={ctx.side !== 'client'} withLink={false} />}
      </section>

      <section aria-labelledby="budget-groups-title" className="mb-8 flex flex-col gap-4">
        <h2 id="budget-groups-title" className="text-lg font-semibold">{t('groups.title')}</h2>
        <FilterTabs
          label={t('by.label')}
          basePath="/budget"
          param="by"
          current={by}
          keep={keepSort}
          items={AXES.map((a) => ({ value: a, text: t(`by.${a}`) }))}
        />
        {groups.length === 0 ? (
          <EmptyState title={t('lines.emptyTitle')} body={t('groups.empty')} />
        ) : (
          <>
            <ul className="flex flex-col gap-3" data-testid="budget-groups" data-axis={by}>
              {groups.map((g, i) => {
                const gf = g.figures;
                const over = gf?.available !== null && gf?.available !== undefined && gf.available < 0;
                const label = labelOf(g);
                const allocated = g.allocated_cents;
                const consumedPct = gf ? pctOf(gf.consumed, allocated) : 0;
                const forecastPct = gf ? Math.min(100 - consumedPct, pctOf(gf.forecast, allocated)) : 0;
                const sharePct = pctOf(allocated, totalAllocated);
                const tone: ChartTone = DISPOSITIF_TONES[i % DISPOSITIF_TONES.length] as ChartTone;
                return (
                  <li key={g.key} data-group-key={g.key} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{labelNode(g)}</span>
                      <span className="tabular font-semibold" data-testid="group-allocated">{allocated === null ? t('notFilled') : t('groups.allocated', { amount: formatMoney(allocated, loc) })}</span>
                    </div>
                    {gf && allocated !== null ? (
                      <BudgetBar
                        label={t('groups.bar', { label, consumed: money(gf.consumed, t('notPriced')), forecast: money(gf.forecast, t('notPriced')), allocated: formatMoney(allocated, loc) })}
                        segments={over ? [{ pct: 100, tone: 'consumed' }] : [{ pct: consumedPct, tone: 'consumed' }, { pct: forecastPct, tone: 'forecast' }]}
                      />
                    ) : !gf && allocated !== null ? (
                      <BudgetBar label={t('groups.barShare', { label, share: t('groups.share', { pct: sharePct }) })} segments={[{ pct: sharePct, tone }]} />
                    ) : null}
                    {gf ? (
                      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span>{t('groups.consumed')} : <span className="tabular text-ink">{money(gf.consumed, t('notPriced'))}</span></span>
                        <span>{t('groups.forecast')} : <span className="tabular text-ink">{money(gf.forecast, t('notPriced'))}</span></span>
                        {gf.available === null ? (
                          <StatusTag tone="attention">{t('notFilled')}</StatusTag>
                        ) : over ? (
                          <StatusTag tone="risk">{t('groups.overLine', { amount: formatMoney(-gf.available, loc) })}</StatusTag>
                        ) : (
                          <span>{t('groups.availableLine', { amount: formatMoney(gf.available, loc) })}</span>
                        )}
                      </p>
                    ) : allocated !== null ? (
                      <p className="text-sm text-muted">{t('groups.share', { pct: sharePct })}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <p className="max-w-prose text-sm text-muted">{t('groups.legend')}</p>
          </>
        )}
      </section>

      <section aria-labelledby="budget-lines-title" className="flex flex-col gap-3">
        <h2 id="budget-lines-title" className="text-lg font-semibold">{t('lines.title')}</h2>
        {view.lines.length === 0 ? (
          <EmptyState title={t('lines.emptyTitle')} body={t('lines.empty')} />
        ) : (
          <DataTable
            caption={t('lines.caption')}
            columns={columns}
            rows={sortRows(view.lines, columns, sort)}
            rowKey={(l) => l.id}
            rowData={(l) => ({ 'data-campaign': l.campaign_code, 'data-allocated-cents': String(l.allocated_cents) })}
            testId="budget-lines"
            sort={sort}
            sortHref={sortHref}
            sortLabels={{ label: tt('sortLabel'), asc: tt('asc'), desc: tt('desc') }}
          />
        )}
      </section>
    </>
  );
}
