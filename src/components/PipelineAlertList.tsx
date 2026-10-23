import { getLocale, getTranslations } from 'next-intl/server';
import type { PipelineAlert } from '@/data/repository';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { StatusTag } from './StatusTag';
import type { Tone } from './StatusTag';

const SEVERITY_TONE: Record<PipelineAlert['severity'], Tone> = { info: 'info', attention: 'attention', risk: 'risk' };

/**
 * Alertes dérivées du circuit proposition et décision. Le filtrage par audience est fait dans la couche de données ;
 * `showAudience` : seule l'agence voit à qui s'adresse chaque alerte.
 */
export async function PipelineAlertList({ alerts, showAudience }: { alerts: PipelineAlert[]; showAudience: boolean }) {
  const t = await getTranslations('alerts');
  const locale = (await getLocale()) as Locale;
  return (
    <ul className="flex flex-col gap-3" data-testid="pipeline-alerts">
      {alerts.map((a) => (
        <li key={a.id} data-alert-id={a.id} data-audience={a.audience} className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag tone={SEVERITY_TONE[a.severity]}>{t(`severity.${a.severity}`)}</StatusTag>
            {showAudience ? <StatusTag tone="neutral">{t(`audience.${a.audience}`)}</StatusTag> : null}
            <span className="ml-auto text-sm text-muted">{formatDate(a.created_at, locale)}</span>
          </div>
          <p className="font-medium">{t(`pipeline.${a.message_key}`, a.params)}</p>
          {a.message_key === 'delegationActive' ? null : (
            <Link href="/proposals" className="inline-flex min-h-11 w-fit items-center rounded-full px-4 text-sm font-semibold text-link hover:bg-sel">{t('pipeline.open')}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}
