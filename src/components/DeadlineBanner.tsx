'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { DeadlineContext } from '@/data/repository';
import type { DeadlineRow } from '@/domain/deadlines';
import type { Dispositif, Locale } from '@/domain/types';
import { bannerRows } from '@/lib/deadline-view';
import { formatDate, formatMonth } from '@/lib/format';
import { StatusTag } from './StatusTag';
import type { Tone } from './StatusTag';

/**
 * Bannière de saisie (doc 28 §2.5, D79) : dispositif, fenêtre ouverte, prochaine échéance, mois déjà clos et
 * réouvertures en cours. Calculée avec les modules purs de la couche données, sur la date de l'horloge de démonstration.
 */
export function DeadlineBanner({ context, dispositif, sectorId }: {
  context: DeadlineContext;
  dispositif: Dispositif | 'all' | null;
  sectorId: string | null;
}) {
  const t = useTranslations('deadline');
  const td = useTranslations('dispositif');
  const locale = useLocale() as Locale;
  const { closed, upcoming, reopenings } = bannerRows(context, dispositif, sectorId);

  const label = (r: DeadlineRow) => `${t(`type.${r.type}`)} · ${formatMonth(r.month, locale)}${r.dispositif ? ` · ${td(r.dispositif)}` : ''}`;
  const stageTone = (r: DeadlineRow): Tone => (r.status.threshold === null ? 'neutral' : r.status.threshold === 0 ? 'risk' : r.status.threshold <= 2 ? 'attention' : 'info');
  const stageText = (r: DeadlineRow) => (r.status.threshold === null ? null : r.status.threshold === 0 ? t('stage.zero') : t('stage.n', { n: r.status.threshold }));
  const sourceText = (r: DeadlineRow) => t(`source.${r.deadline.source}`);

  return (
    <section aria-labelledby="deadline-banner-title" data-testid="deadline-banner" className="mb-6 flex flex-col gap-3 rounded-card bg-tint-sand p-5 shadow-card">
      <h2 id="deadline-banner-title" className="text-lg font-semibold">{t('banner.title')}</h2>
      {dispositif && dispositif !== 'all' ? <p>{t('banner.scheme', { name: td(dispositif) })}</p> : null}
      {closed.length > 0 ? (
        <ul className="flex flex-col gap-2" data-testid="deadline-closed">
          {closed.map((r) => (
            <li key={`${r.month}-${r.type}-${r.dispositif}`} className="flex flex-wrap items-center gap-2">
              <StatusTag tone="risk">{t('banner.closedTag')}</StatusTag>
              <span>{t('banner.closed', { what: label(r), deadline: formatDate(r.deadline.date, locale) })}</span>
              <span className="text-sm text-muted-strong">{sourceText(r)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {upcoming.length > 0 ? (
        <ul className="flex flex-col gap-2" data-testid="deadline-upcoming">
          {upcoming.map((r) => (
            <li key={`${r.month}-${r.type}-${r.dispositif}`} className="flex flex-wrap items-center gap-2">
              {stageText(r) ? <StatusTag tone={stageTone(r)}>{stageText(r)}</StatusTag> : <StatusTag tone="ok">{t('banner.openTag')}</StatusTag>}
              <span>{t('banner.upcoming', { what: label(r), deadline: formatDate(r.deadline.date, locale), left: r.status.left })}</span>
              <span className="text-sm text-muted-strong">{sourceText(r)}</span>
              {r.deadline.opensOn ? (
                <span className="w-full text-sm text-muted-strong">{t('banner.window', { from: formatDate(r.deadline.opensOn, locale), to: formatDate(r.deadline.date, locale) })}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-strong">{t('banner.none')}</p>
      )}
      {reopenings.map((r) => (
        <p key={r.id} className="flex flex-wrap items-center gap-2" data-testid="deadline-reopened">
          <StatusTag tone="ok">{t('banner.reopenedTag')}</StatusTag>
          <span>
            {t('banner.reopened', {
              target: r.scope === 'month' ? formatMonth(r.target, locale) : (locale === 'en' ? r.target.replace('-S', '-W') : r.target),
              until: formatDate(r.expires_on, locale),
            })}
          </span>
        </p>
      ))}
    </section>
  );
}
