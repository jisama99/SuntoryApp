import { useTranslations } from 'next-intl';
import type { DelegationView } from '@/data/repository';
import type { Locale, Scope } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { StatusTag } from './StatusTag';
import { zoneText } from './ZoneLabel';

/**
 * Rappel des délégations qui concernent le profil (F-30.3) : celles où il est suppléant (il agit alors dans le périmètre du délégant,
 * jamais au-delà) et celles où il est délégant. Rien pour l'agence, qui les gère sur son propre écran.
 */
export function DelegationBanner({ delegations, ctxScope, locale }: { delegations: DelegationView[]; ctxScope: Scope; locale: Locale }) {
  const t = useTranslations('delegations.banner');
  if (ctxScope.kind !== 'cvr' && ctxScope.kind !== 'dr') return null;
  const mine = ctxScope.ids;
  type Line = { id: string; tone: 'info'; key: 'acting' | 'planned' | 'covered'; text: string };
  const lines: Line[] = [];
  for (const d of delegations) {
    const when = { start: formatDate(d.start_date, locale), end: formatDate(d.end_date, locale) };
    if (mine.includes(d.substitute_zone_id)) {
      const key = d.status === 'active' ? 'acting' : 'planned';
      lines.push({ id: d.id, tone: 'info', key, text: t(key, { zone: zoneText(d.delegator, locale), ...when }) });
    } else if (mine.includes(d.delegator_zone_id)) {
      lines.push({ id: d.id, tone: 'info', key: 'covered', text: t('covered', { zone: zoneText(d.substitute, locale), ...when }) });
    }
  }
  if (lines.length === 0) return null;
  return (
    <section aria-label={t('label')} data-testid="delegation-banner" className="mb-6 flex flex-col gap-2">
      {lines.map((l) => (
        <p key={l.id} data-delegation-line={l.key} className="flex flex-wrap items-center gap-3 rounded-ctl bg-alt px-4 py-3">
          <StatusTag tone={l.tone}>{t(`tag.${l.key}`)}</StatusTag>
          <span>{l.text}</span>
        </p>
      ))}
    </section>
  );
}
