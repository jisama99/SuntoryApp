import { getLocale, getTranslations } from 'next-intl/server';
import type { DerivedAlert } from '@/domain/deadline-views';
import type { Locale } from '@/domain/types';
import { formatDate, formatMonth } from '@/lib/format';
import { StatusTag } from './StatusTag';
import type { Tone } from './StatusTag';

const SEVERITY_TONE: Record<DerivedAlert['severity'], Tone> = { info: 'info', attention: 'attention', risk: 'risk' };

/**
 * Alertes d'échéance (D79, D82) : J-5, J-2, jour J, résumé des retards de la cliente (D81), bilan et file de
 * réouvertures de l'agence. `showAudience` : seule l'agence voit à qui s'adresse chaque alerte.
 */
export async function DeadlineAlertList({ alerts, showAudience }: { alerts: DerivedAlert[]; showAudience: boolean }) {
  const t = await getTranslations('alerts');
  const td = await getTranslations('dispositif');
  const tdl = await getTranslations('deadline');
  const locale = (await getLocale()) as Locale;
  const present = (a: DerivedAlert) => {
    const p: Record<string, string | number> = { ...a.params };
    if (typeof p.month === 'string') p.month = formatMonth(p.month, locale);
    if (typeof p.deadline === 'string') p.deadline = formatDate(p.deadline, locale);
    if (typeof p.stage === 'number') p.stage = p.stage === 0 ? tdl('stage.zero') : tdl('stage.n', { n: p.stage });
    if (typeof p.dispositif === 'string') p.dispositif = td(p.dispositif as never);
    return p;
  };
  return (
    <ul className="flex flex-col gap-3" data-testid="deadline-alerts">
      {alerts.map((a) => (
        <li key={a.id} data-alert-id={a.id} data-audience={a.audience} className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag tone={SEVERITY_TONE[a.severity]}>{t(`severity.${a.severity}`)}</StatusTag>
            {showAudience ? <StatusTag tone="neutral">{t(`audience.${a.audience}`)}</StatusTag> : null}
            <span className="ml-auto text-sm text-muted">{formatDate(a.created_at, locale)}</span>
          </div>
          <p className="font-medium">{t(`derived.${a.message_key}`, present(a))}</p>
        </li>
      ))}
    </ul>
  );
}
