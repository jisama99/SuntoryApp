import { getLocale, getTranslations } from 'next-intl/server';
import type { Zone } from '@/data/schemas';
import type { DelayMonth, SectorStatus } from '@/domain/deadline-views';
import type { Locale } from '@/domain/types';
import { formatDate, formatMonth } from '@/lib/format';
import { DataTable } from './DataTable';
import { FilterTabs } from './FilterTabs';
import { StatusTag } from './StatusTag';
import { zoneLabelOnly } from './ZoneLabel';
import type { Tone } from './StatusTag';
import { Tile } from './Tile';

const TONE: Record<SectorStatus, Tone> = { up_to_date: 'ok', to_follow: 'attention', late: 'risk' };

/**
 * Résumé des retards de saisie (D81) : par région puis par secteur, état écrit en toutes lettres. Les zones sont
 * désignées par leur libellé seul : aucun nom de personne n'apparaît (doc 24 §5, « secteurs, pas personnes »).
 */
export async function DelaySummary({ months, current, keep }: { months: DelayMonth[]; current: string; keep: Record<string, string> }) {
  const t = await getTranslations('delay');
  const tt = await getTranslations('titles');
  const locale = (await getLocale()) as Locale;
  const month = months.find((m) => m.month === current) ?? months[0];
  if (!month) return null;
  const label = (z: Zone) => zoneLabelOnly(z, locale);
  const open = month.status.state === 'upcoming';
  const toFollow = month.sectors.filter((s) => s.status !== 'up_to_date');
  return (
    <section aria-labelledby="delay-title" data-testid="delay-summary" className="mb-8 flex flex-col gap-4">
      <h2 id="delay-title" className="text-lg font-semibold">{tt('entriesToChase')}</h2>
      <FilterTabs
        label={t('months')}
        basePath="/needs"
        param="month"
        current={month.month}
        keep={keep}
        items={months.map((m) => ({ value: m.month, text: formatMonth(m.month, locale) }))}
      />
      <p className="text-muted">
        {open
          ? t('open', { month: formatMonth(month.month, locale), deadline: formatDate(month.deadline.date, locale), left: month.status.left })
          : t('closed', { month: formatMonth(month.month, locale), deadline: formatDate(month.deadline.date, locale) })}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile tone="aqua" label={t('status.up_to_date')} value={String(month.counts.up_to_date)}>{t('onTotal', { total: month.total })}</Tile>
        <Tile tone="sand" label={t('status.to_follow')} value={String(month.counts.to_follow)} />
        <Tile tone="sand" attention={month.counts.late > 0} label={t('status.late')} value={String(month.counts.late)}>
          {month.counts.late > 0 ? <StatusTag tone="important">{t('toHandle')}</StatusTag> : null}
        </Tile>
      </div>
      {month.regions.length > 0 ? (
        <DataTable<DelayMonth['regions'][number]>
          caption={t('byRegion')}
          rows={month.regions}
          rowKey={(r) => r.zone.id}
          columns={[
            { key: 'region', header: t('cols.region'), rowHeader: true, render: (r) => label(r.zone) },
            { key: 'up_to_date', header: t('status.up_to_date'), numeric: true, render: (r) => r.counts.up_to_date },
            { key: 'to_follow', header: t('status.to_follow'), numeric: true, render: (r) => r.counts.to_follow },
            { key: 'late', header: t('status.late'), numeric: true, render: (r) => r.counts.late },
          ]}
        />
      ) : null}
      {toFollow.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">{t('sectorsTitle')}</h3>
          <ul className="flex flex-col gap-2" data-testid="delay-sectors">
            {toFollow.map((s) => (
              <li key={s.zone.id} className="flex flex-wrap items-center gap-2 rounded-ctl bg-surface px-4 py-2 shadow-card">
                <StatusTag tone={TONE[s.status]}>{t(`status.${s.status}`)}</StatusTag>
                <span>{label(s.zone)}</span>
                {s.drafts > 0 ? <span className="text-sm text-muted">{t('drafts', { n: s.drafts })}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-muted">{t('allDone')}</p>
      )}
    </section>
  );
}
