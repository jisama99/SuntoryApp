import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BudgetHeader, budgetTabsOf } from '@/components/BudgetHeader';
import { EnvelopeForm } from '@/components/BudgetForms';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { Tile } from '@/components/Tile';
import { repository } from '@/data';
import type { EnvelopeVersion } from '@/data/schemas';
import { calendarOf } from '@/domain/deadlines';
import type { Locale } from '@/domain/types';
import { addDays } from '@/domain/week';
import { formatDate } from '@/lib/format';
import { formatEuros, formatMoney } from '@/lib/money';
import { getAccessContext } from '@/lib/session';

/**
 * Enveloppe de la cliente (F-50.8, D153) : la direction cliente saisit une version datée ; l'agence la lit sans pouvoir la modifier.
 * Le DR et le CVR n'ont pas cet écran : l'enveloppe nationale ne leur est pas ouverte.
 */
export default async function EnvelopePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const loc = ctx.locale;
  const t = await getTranslations('budget');
  const tr = await getTranslations('role');
  const tp = await getTranslations('pipeline.actorProfile');

  const [view, versions, clock, deadline] = await Promise.all([
    repository.getBudget(ctx), repository.getEnvelopeVersions(ctx), repository.getClock(ctx), repository.getDeadlineContext(ctx),
  ]);
  if (!view.envelopeVisible) notFound();
  const current = view.envelope;
  const canSet = repository.canSetEnvelope(ctx);
  const columns: Column<EnvelopeVersion>[] = [
    { key: 'version', header: t('cols.version'), rowHeader: true, render: (v) => <span>{v.version}{v.id === current?.id ? <> <StatusTag tone="ok">{t('envelope.current')}</StatusTag></> : null}</span> },
    { key: 'amount', header: t('cols.amount'), numeric: true, render: (v) => formatEuros(v.amount_eur_ht, loc) },
    { key: 'period', header: t('cols.period'), render: (v) => t('envelope.range', { start: formatDate(v.period_start, loc), end: formatDate(v.period_end, loc) }) },
    { key: 'date', header: t('cols.date'), render: (v) => formatDate(v.entered_on, loc) },
    { key: 'by', header: t('cols.enteredBy'), render: (v) => tp(v.entered_by_profile) },
    { key: 'motive', header: t('cols.motive'), render: (v) => v.motive ?? <span className="text-muted">{t('envelope.firstVersion')}</span> },
  ];

  return (
    <>
      <BudgetHeader current="envelope" tabs={budgetTabsOf(view)} subtitle={tr(ctx.profileId)} />
      <p className="mb-6 max-w-prose text-muted">{t('envelope.intro')}</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Tile tone="anchor" label={t('tiles.envelope')} value={current ? formatEuros(current.amount_eur_ht, loc) : t('notFilled')}>
          {current ? t('tiles.envelopeSub', { version: current.version, date: formatDate(current.entered_on, loc) }) : null}
        </Tile>
        {current && view.allocated_cents !== null ? (
          <Tile tone="aqua" label={t('tiles.allocated')} value={formatMoney(view.allocated_cents, loc)}>
            {t('envelope.allocatedOf', { allocated: formatMoney(view.allocated_cents, loc), amount: formatEuros(current.amount_eur_ht, loc) })}
          </Tile>
        ) : null}
      </div>
      {canSet ? (
        <div className="mb-8">
          <EnvelopeForm
            current={current ? { version: current.version, periodStart: current.period_start, periodEnd: current.period_end } : null}
            today={clock.date}
            min="2026-01-01"
            max={addDays(clock.date, 730)}
            nonWorking={calendarOf(deadline.settings)}
          />
        </div>
      ) : <p className="mb-6 text-muted" data-testid="envelope-readonly">{t('envelope.readOnly')}</p>}
      <section aria-labelledby="envelope-history-title" className="flex flex-col gap-3">
        <h2 id="envelope-history-title" className="text-lg font-semibold">{t('envelope.historyTitle')}</h2>
        {versions.length === 0 ? (
          <EmptyState title={t('lines.emptyTitle')} body={t('envelope.noEnvelope')} />
        ) : (
          <DataTable caption={t('envelope.historyCaption')} columns={columns} rows={versions} rowKey={(v) => v.id} rowData={(v) => ({ 'data-version': String(v.version) })} testId="envelope-versions" />
        )}
      </section>
    </>
  );
}
