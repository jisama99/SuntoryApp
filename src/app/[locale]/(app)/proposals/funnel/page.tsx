import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { Tile } from '@/components/Tile';
import { repository } from '@/data';
import { Link } from '@/i18n/navigation';
import { MILESTONES } from '@/domain/pipeline';
import { FUNNEL_STATES, SITUATIONS, START_LAG_KINDS } from '@/domain/types';
import type { FunnelState, Situation } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

export default async function FunnelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const t = await getTranslations('pipeline');
  const tm = await getTranslations('menu');
  const tr = await getTranslations('role');
  const [report, rows] = await Promise.all([repository.getFunnelReport(ctx), repository.getPipeline(ctx)]);
  const { summary, delays, startLags, params: pp, vacancies } = report;
  const percent = new Intl.NumberFormat(ctx.locale === 'en' ? 'en-GB' : 'fr-FR', { style: 'percent', maximumFractionDigits: 0 });
  // Un taux sans heure demandée n'est jamais affiché 0 % : « Donnée indisponible ».
  const rate = (v: number | null) => (v === null ? t('funnel.unavailable') : percent.format(v));
  const inFunnel = FUNNEL_STATES.reduce((n, s) => n + summary.byState[s].needs, 0);
  const maxNeeds = Math.max(1, ...FUNNEL_STATES.map((s) => summary.byState[s].needs));
  const codeOf = (needId: string) => rows.find((r) => r.need.id === needId)?.need.need_code ?? '';

  // Tableaux en cartes sous 640 px (règle 16) : le composant commun les met en pile, une ligne de libellé par valeur.
  const stockColumns: Column<FunnelState>[] = [
    { key: 'state', header: t('funnelPage.state'), rowHeader: true, render: (s) => t(`funnel.${s}`) },
    { key: 'needs', header: t('funnelPage.needs'), numeric: true, render: (s) => summary.byState[s].needs },
    { key: 'hours', header: t('funnelPage.hours'), numeric: true, render: (s) => summary.byState[s].hours },
    {
      key: 'share', header: t('funnelPage.share'),
      render: (s) => (
        <div aria-hidden="true" className="h-3 w-full min-w-24 rounded-full bg-sel"><div className="h-3 rounded-full bg-primary" style={{ width: `${Math.round((summary.byState[s].needs / maxNeeds) * 100)}%` }} /></div>
      ),
    },
  ];
  const delayColumns: Column<Situation>[] = [
    { key: 'situation', header: t('funnelPage.situation'), rowHeader: true, render: (s) => t(`situation.${s}`) },
    ...MILESTONES.map((m): Column<Situation> => ({
      key: m, header: t(`funnelPage.milestone.${m}`),
      render: (s) => {
        const d = delays[s][m];
        if (s === 'white_zone') return <span className="text-muted">{t('funnelPage.noDelay')}</span>;
        if (d.n === 0) return <span className="text-muted">{t('funnel.unavailable')}</span>;
        if (!d.sufficient) return <span className="text-muted">{t('funnelPage.tooFew', { n: d.n })}</span>;
        return <span>{t('funnelPage.delayValue', { median: d.median ?? 0, min: d.min ?? 0, max: d.max ?? 0, n: d.n })}</span>;
      },
    })),
  ];

  const lagColumns: Column<Situation>[] = [
    { key: 'situation', header: t('funnelPage.situation'), rowHeader: true, render: (s) => t(`situation.${s}`) },
    ...START_LAG_KINDS.map((k): Column<Situation> => ({
      key: k, header: t(`funnelPage.lag.${k}`),
      render: (s) => {
        const d = startLags[s][k];
        if (s === 'white_zone') return <span className="text-muted">{t('funnelPage.noDelay')}</span>;
        if (k === 'later_in_day') return <span className="text-muted">{t('funnelPage.noTime')}</span>;
        if (d.n === 0) return <span className="text-muted">{t('funnel.unavailable')}</span>;
        if (k === 'same_day' || !d.sufficient) return <span>{t('funnelPage.lagCount', { n: d.n })}</span>;
        return <span>{t('funnelPage.delayValue', { median: d.median ?? 0, min: d.min ?? 0, max: d.max ?? 0, n: d.n })}</span>;
      },
    })),
  ];

  return (
    <>
      <Breadcrumb items={[{ label: tm('proposals'), href: '/proposals' }, { label: t('funnelPage.title') }]} />
      <PageHeader title={t('funnelPage.title')} subtitle={tr(ctx.profileId)} />
      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Tile tone="aqua" label={t('funnelPage.demanded')} value={String(summary.demandedHours)}>{t('funnelPage.demandedNote')}</Tile>
        <Tile tone="lav" label={t('funnelPage.hiredRate')} value={rate(summary.hiredRate)}>{t('funnelPage.hiredRateNote')}</Tile>
        <Tile tone="lav" label={t('funnelPage.startedRate')} value={rate(summary.startedRate)}>{t('funnelPage.startedRateNote')}</Tile>
        <Tile tone="sand" label={t('funnelPage.returns')} value={String(summary.refusals + summary.withdrawals)}>
          {t('funnelPage.returnsNote', { refusals: summary.refusals, withdrawals: summary.withdrawals, needs: summary.returned })}
        </Tile>
      </div>

      <section aria-labelledby="stock-title" className="mb-8 flex flex-col gap-3">
        <h2 id="stock-title" className="text-lg font-semibold">{t('funnelPage.stock')}</h2>
        <DataTable
          caption={t('funnelPage.stockCaption', { n: inFunnel })}
          columns={stockColumns}
          rows={[...FUNNEL_STATES]}
          rowKey={(st) => st}
          rowData={(st) => ({ 'data-funnel-state': st })}
          testId="funnel-stock"
        />
      </section>

      <section aria-labelledby="outside-title" className="mb-8 flex flex-col gap-3">
        <h2 id="outside-title" className="text-lg font-semibold">{t('funnelPage.outside')}</h2>
        <p className="max-w-prose text-muted">{t('funnelPage.outsideHelp')}</p>
        <ul data-testid="funnel-outside" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['toQualify', String(summary.toQualify)],
            ['whiteZone', t('funnelPage.needsAndHours', { needs: summary.whiteZone.needs, hours: summary.whiteZone.hours })],
            ['stopped', summary.stoppedPerformedHours > 0 ? t('funnelPage.stoppedValue', { n: summary.stopped, hours: summary.stoppedPerformedHours }) : String(summary.stopped)],
            ['rejected', String(summary.rejected)],
            ['reassigned', String(summary.reassigned)],
          ].map(([k, v]) => (
            <li key={k} data-outside={k} className="flex flex-col gap-1 rounded-card bg-surface p-4 shadow-card">
              <span className="text-sm text-muted">{t(`funnelPage.outsideKinds.${k}`)}</span>
              <span className="text-lg font-semibold tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="delays-title" className="mb-8 flex flex-col gap-3">
        <h2 id="delays-title" className="text-lg font-semibold">{t('funnelPage.delays')}</h2>
        <p className="max-w-prose text-muted">{t('funnelPage.delaysHelp', { min: pp.min_sample })}</p>
        <DataTable
          caption={t('funnelPage.delaysCaption')}
          columns={delayColumns}
          rows={[...SITUATIONS]}
          rowKey={(st) => st}
          rowData={(st) => ({ 'data-situation': st })}
          testId="funnel-delays"
        />
        <p className="max-w-prose text-sm text-muted">{t('funnelPage.delaysNote')}</p>
      </section>

      <section aria-labelledby="lag-title" className="mb-8 flex flex-col gap-3">
        <h2 id="lag-title" className="text-lg font-semibold">{t('funnelPage.lagTitle')}</h2>
        <p className="max-w-prose text-muted">{t('funnelPage.lagHelp')}</p>
        <DataTable
          caption={t('funnelPage.lagCaption')}
          columns={lagColumns}
          rows={[...SITUATIONS]}
          rowKey={(st) => st}
          rowData={(st) => ({ 'data-lag-situation': st })}
          testId="funnel-lags"
        />
        <p className="max-w-prose text-sm text-muted">{t('funnelPage.lagNote')}</p>
      </section>

      <section aria-labelledby="vacancy-title" className="mb-8 flex flex-col gap-3">
        <h2 id="vacancy-title" className="text-lg font-semibold">{t('funnelPage.vacancy')}</h2>
        {vacancies.length === 0 ? <p className="text-muted">{t('funnelPage.noVacancy')}</p> : (
          <ul data-testid="funnel-vacancy" className="flex flex-col gap-2">
            {vacancies.map((v) => (
              <li key={v.needId} className="flex flex-wrap items-center gap-3 rounded-ctl bg-alt px-4 py-2">
                <Link href={`/proposals/${v.needId}`} className="inline-flex min-h-11 items-center font-mono text-sm font-semibold text-link hover:bg-sel">{codeOf(v.needId)}</Link>
                <span>{t('funnelPage.vacancyAge', { n: v.days })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
