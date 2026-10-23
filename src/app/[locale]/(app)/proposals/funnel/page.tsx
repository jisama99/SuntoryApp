import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageHeader } from '@/components/PageHeader';
import { Tile } from '@/components/Tile';
import { repository } from '@/data';
import { Link } from '@/i18n/navigation';
import { MILESTONES } from '@/domain/pipeline';
import { FUNNEL_STATES, SITUATIONS } from '@/domain/types';
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
  const { summary, delays, params: pp, vacancies } = report;
  const percent = new Intl.NumberFormat(ctx.locale === 'en' ? 'en-GB' : 'fr-FR', { style: 'percent', maximumFractionDigits: 0 });
  // Un taux sans heure demandée n'est jamais affiché 0 % : « Donnée indisponible ».
  const rate = (v: number | null) => (v === null ? t('funnel.unavailable') : percent.format(v));
  const inFunnel = FUNNEL_STATES.reduce((n, s) => n + summary.byState[s].needs, 0);
  const maxNeeds = Math.max(1, ...FUNNEL_STATES.map((s) => summary.byState[s].needs));
  const codeOf = (needId: string) => rows.find((r) => r.need.id === needId)?.need.need_code ?? '';

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
        <div className="overflow-auto rounded-card bg-surface shadow-card">
          <table data-testid="funnel-stock" className="w-full border-collapse text-left text-sm">
            <caption className="px-4 py-3 text-left text-sm font-semibold text-muted">{t('funnelPage.stockCaption', { n: inFunnel })}</caption>
            <thead>
              <tr className="bg-alt">
                <th scope="col" className="px-4 py-2 font-semibold">{t('funnelPage.state')}</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">{t('funnelPage.needs')}</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">{t('funnelPage.hours')}</th>
                <th scope="col" className="px-4 py-2 font-semibold"><span className="sr-only">{t('funnelPage.share')}</span></th>
              </tr>
            </thead>
            <tbody>
              {FUNNEL_STATES.map((s) => (
                <tr key={s} data-funnel-state={s} className="even:bg-alt/60">
                  <th scope="row" className="px-4 py-3 text-left font-semibold">{t(`funnel.${s}`)}</th>
                  <td className="px-4 py-3 text-right tabular-nums">{summary.byState[s].needs}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{summary.byState[s].hours}</td>
                  <td className="w-1/3 px-4 py-3" aria-hidden="true">
                    <div className="h-3 rounded-full bg-sel"><div className="h-3 rounded-full bg-primary" style={{ width: `${Math.round((summary.byState[s].needs / maxNeeds) * 100)}%` }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="outside-title" className="mb-8 flex flex-col gap-3">
        <h2 id="outside-title" className="text-lg font-semibold">{t('funnelPage.outside')}</h2>
        <p className="max-w-prose text-muted">{t('funnelPage.outsideHelp')}</p>
        <ul data-testid="funnel-outside" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['toQualify', String(summary.toQualify)],
            ['whiteZone', t('funnelPage.needsAndHours', { needs: summary.whiteZone.needs, hours: summary.whiteZone.hours })],
            ['stopped', String(summary.stopped)],
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
        <div className="overflow-auto rounded-card bg-surface shadow-card">
          <table data-testid="funnel-delays" className="w-full border-collapse text-left text-sm">
            <caption className="px-4 py-3 text-left text-sm font-semibold text-muted">{t('funnelPage.delaysCaption')}</caption>
            <thead>
              <tr className="bg-alt">
                <th scope="col" className="px-4 py-2 font-semibold">{t('funnelPage.situation')}</th>
                {MILESTONES.map((m) => <th key={m} scope="col" className="px-4 py-2 font-semibold">{t(`funnelPage.milestone.${m}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {SITUATIONS.map((s) => (
                <tr key={s} data-situation={s} className="even:bg-alt/60">
                  <th scope="row" className="px-4 py-3 text-left font-semibold">{t(`situation.${s}`)}</th>
                  {MILESTONES.map((m) => {
                    const d = delays[s][m];
                    return (
                      <td key={m} data-milestone={m} className="px-4 py-3 align-top">
                        {s === 'white_zone' ? <span className="text-muted">{t('funnelPage.noDelay')}</span>
                          : d.n === 0 ? <span className="text-muted">{t('funnel.unavailable')}</span>
                          : !d.sufficient ? <span className="text-muted">{t('funnelPage.tooFew', { n: d.n })}</span>
                          : <span>{t('funnelPage.delayValue', { median: d.median ?? 0, min: d.min ?? 0, max: d.max ?? 0, n: d.n })}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-prose text-sm text-muted">{t('funnelPage.delaysNote')}</p>
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
