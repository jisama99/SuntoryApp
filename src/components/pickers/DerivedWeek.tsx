'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '@/domain/types';
import { isValidWeek, parseStoredWeek, weekEnd, weekStart } from '@/domain/week';
import { formatDate, formatIsoWeek } from '@/lib/format';
import type { PickerBounds } from './DatePicker';
import { WeekPicker } from './WeekPicker';

/**
 * Semaine déduite des dates (D146) : affichée en lecture seule, jamais demandée. Le lien « corriger la semaine » ouvre
 * le sélecteur de semaine pour les cas particuliers ; l'écart avec les dates est alors signalé par la règle W5.
 */
export function DerivedWeek({ id, label, week, onChange, ...bounds }: PickerBounds & {
  id: string;
  label: string;
  week: string | null;
  /** Absent : affichage seul, sans correction (duplication). */
  onChange?: (week: string) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('picker');
  const tf = useTranslations('form');
  const [editing, setEditing] = useState(false);
  const parsed = week ? parseStoredWeek(week) : null;
  const known = parsed !== null && isValidWeek(parsed);

  if (editing && onChange) {
    return (
      <WeekPicker
        id={id}
        label={label}
        value={week}
        defaultOpen
        onChange={(w) => {
          onChange(w);
          setEditing(false);
        }}
        {...bounds}
      />
    );
  }
  const text = week
    ? known
      ? t('weekValue', { week: formatIsoWeek(week, locale), from: formatDate(weekStart(parsed), locale), to: formatDate(weekEnd(parsed), locale) })
      : formatIsoWeek(week, locale)
    : tf('derivedHint');
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <p id={id} data-testid={id} className={`tabular ${week ? 'text-ink' : 'text-muted'}`}>
        {text}
      </p>
      {onChange && week ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 w-fit rounded-full px-3 text-sm font-semibold text-link hover:bg-sel"
        >
          {tf('correctWeek')}
        </button>
      ) : null}
    </div>
  );
}
