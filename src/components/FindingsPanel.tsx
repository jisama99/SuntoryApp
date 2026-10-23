'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { FindingDto } from '@/app/[locale]/(app)/needs/actions';
import type { Locale } from '@/domain/types';
import { Link } from '@/i18n/navigation';
import { formatIsoWeek } from '@/lib/format';
import { StatusTag } from './StatusTag';
import type { Tone } from './StatusTag';

const TONE: Record<FindingDto['gravity'], Tone> = { blocking: 'risk', alert: 'attention', info: 'info' };

/**
 * Constats des règles de semaine et de doublon (W, D, J, B) : gravité en forme et en texte, message, correction en un
 * clic quand elle existe, lien vers le besoin existant quand il est dans le périmètre du profil.
 */
export function FindingsPanel({ findings, onFix }: {
  findings: FindingDto[];
  onFix?: (fix: NonNullable<FindingDto['fix']>) => void;
}) {
  const t = useTranslations('rules');
  const tg = useTranslations('gravity');
  const tf = useTranslations('form');
  const locale = useLocale() as Locale;
  return (
    <ul className="flex flex-col gap-3" data-testid="findings">
      {findings.map((f, i) => (
        <li key={`${f.rule}-${f.periodNo ?? 0}-${i}`} data-rule={f.rule} data-gravity={f.gravity} className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag tone={TONE[f.gravity]}>{tg(f.gravity)}</StatusTag>
            <span className="rounded-md bg-alt px-2 font-mono text-xs text-muted">{f.rule}</span>
            {f.periodNo ? <span className="text-sm text-muted">{tf('periodN', { n: f.periodNo })}</span> : null}
          </div>
          <p>{t(f.rule, f.params)}</p>
          <div className="flex flex-wrap items-center gap-3">
            {f.fix && onFix ? (
              <button
                type="button"
                onClick={() => onFix(f.fix as NonNullable<FindingDto['fix']>)}
                className="min-h-11 rounded-full bg-sel px-4 text-sm font-semibold text-link hover:bg-alt"
              >
                {tf('applyWeek', { week: formatIsoWeek(f.fix.value, locale) })}
              </button>
            ) : null}
            {f.relatedNeedId && f.relatedVisible ? (
              <Link href={`/needs#need-${f.relatedNeedId}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-link">
                {tf('openExisting')}
              </Link>
            ) : null}
            {f.relatedNeedId === undefined && f.relatedVisible === false ? <span className="text-sm text-muted">{tf('otherScope')}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
