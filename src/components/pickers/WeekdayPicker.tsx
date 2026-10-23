'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/domain/types';
import { WEEKDAYS } from '@/domain/types';
import { addDays } from '@/domain/week';

const INTL: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

/**
 * Sélecteur de jours (D132) : cases à cocher LUN à DIM. Les jours proposés viennent du dispositif (dimanche désactivé
 * par défaut). Au moins un jour est exigé : l'erreur est affichée par l'écran appelant.
 */
export function WeekdayPicker({ id, label, value, onChange, allowed, error }: {
  id: string;
  label: string;
  value: number[];
  onChange: (days: number[]) => void;
  allowed: readonly number[];
  error?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('weekdays');
  const names = new Intl.DateTimeFormat(INTL[locale], { weekday: 'short', timeZone: 'UTC' });
  const longNames = new Intl.DateTimeFormat(INTL[locale], { weekday: 'long', timeZone: 'UTC' });
  const nameOf = (d: number, f: Intl.DateTimeFormat) => f.format(new Date(`${addDays('2026-11-02', d - 1)}T00:00:00Z`));
  const set = (days: number[]) => onChange([...new Set(days)].filter((d) => allowed.includes(d)).sort((a, b) => a - b));
  const shortcuts: Array<[string, number[]]> = [
    [t('monToFri'), [1, 2, 3, 4, 5]],
    [t('monToSat'), [1, 2, 3, 4, 5, 6]],
    [t('all'), [...WEEKDAYS]],
    [t('none'), []],
  ];
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((d) => {
          const enabled = allowed.includes(d);
          const checked = value.includes(d);
          return (
            <label
              key={d}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 ${checked ? 'bg-sel font-semibold' : 'bg-alt'} ${enabled ? '' : 'cursor-not-allowed text-muted'}`}
            >
              <input
                type="checkbox"
                name={`${id}-day`}
                value={d}
                checked={checked}
                disabled={!enabled}
                onChange={(e) => set(e.target.checked ? [...value, d] : value.filter((x) => x !== d))}
                className="size-5 accent-primary"
                aria-label={nameOf(d, longNames)}
              />
              <span aria-hidden="true" className="capitalize">{nameOf(d, names)}</span>
            </label>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map(([text, days]) => (
          <button
            key={text}
            type="button"
            onClick={() => set(days)}
            className="min-h-11 rounded-full px-4 text-sm font-semibold text-link hover:bg-sel"
          >
            {text}
          </button>
        ))}
      </div>
      {!allowed.includes(7) ? <p className="text-sm text-muted">{t('sundayOff')}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
