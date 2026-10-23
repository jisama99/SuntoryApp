import { getLocale, getTranslations } from 'next-intl/server';
import type { Alert, Zone } from '@/data/schemas';
import type { Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { StatusTag } from './StatusTag';
import type { Tone } from './StatusTag';
import { ZoneLabel } from './ZoneLabel';

const SEVERITY_TONE: Record<Alert['severity'], Tone> = { info: 'info', attention: 'attention', risk: 'risk' };

/** showAudience : l'agence voit à qui chaque alerte est destinée ; les profils cliente ne voient jamais ce champ. */
export async function AlertList({ alerts, zones, showAudience }: { alerts: Alert[]; zones: Zone[]; showAudience: boolean }) {
  const t = await getTranslations('alerts');
  const locale = (await getLocale()) as Locale;
  const byId = new Map(zones.map((z) => [z.id, z]));
  return (
    <ul className="flex flex-col gap-3">
      {alerts.map((a) => {
        const zone = a.zone_id ? byId.get(a.zone_id) : undefined;
        return (
          <li key={a.id} className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag tone={SEVERITY_TONE[a.severity]}>{t(`severity.${a.severity}`)}</StatusTag>
              {showAudience ? <StatusTag tone="neutral">{t(`audience.${a.audience}`)}</StatusTag> : null}
              <span className="ml-auto text-sm text-muted">{formatDate(a.created_at, locale)}</span>
            </div>
            <p className="font-medium">{t(`text.${a.message_key}`)}</p>
            {zone ? <p className="text-sm"><ZoneLabel zone={zone} /></p> : null}
          </li>
        );
      })}
    </ul>
  );
}
