import { getLocale, getTranslations } from 'next-intl/server';
import type { BudgetAlert } from '@/data/repository';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { StatusTag } from './StatusTag';
import type { Tone } from './StatusTag';

const SEVERITY_TONE: Record<BudgetAlert['severity'], Tone> = { info: 'info', attention: 'attention', risk: 'risk' };

/**
 * Alertes dérivées du budget. Le filtrage par audience, par périmètre et par droit de lecture est fait dans la couche de données ;
 * `showAudience` : seule l'agence voit à qui s'adresse chaque alerte. Aucun montant n'y figure.
 */
export async function BudgetAlertList({ alerts, showAudience, withLink = true }: { alerts: BudgetAlert[]; showAudience: boolean; withLink?: boolean }) {
  const t = await getTranslations('alerts');
  const locale = (await getLocale()) as Locale;
  return (
    <ul className="flex flex-col gap-3" data-testid="budget-alerts">
      {alerts.map((a) => (
        <li key={a.id} data-alert-id={a.id} data-audience={a.audience} className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag tone={SEVERITY_TONE[a.severity]}>{t(`severity.${a.severity}`)}</StatusTag>
            {showAudience ? <StatusTag tone="neutral">{t(`audience.${a.audience}`)}</StatusTag> : null}
            <span className="ml-auto text-sm text-muted">{formatDate(a.created_at, locale)}</span>
          </div>
          <p className="font-medium">{t(`budget.${a.message_key}`, a.params)}</p>
          {withLink ? <Link href="/budget" className="inline-flex min-h-11 w-fit items-center rounded-full px-4 text-sm font-semibold text-link hover:bg-sel">{t('budget.open')}</Link> : null}
        </li>
      ))}
    </ul>
  );
}
