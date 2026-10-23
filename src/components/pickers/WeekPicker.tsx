'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '@/domain/types';
import { isValidWeek, parseStoredWeek, storedWeekOf, weekEnd, weekStart } from '@/domain/week';
import { formatDate, formatIsoWeek } from '@/lib/format';
import { Calendar } from './Calendar';
import type { PickerBounds } from './DatePicker';
import { PickerField } from './PickerField';

/** Sélecteur de semaine ISO (D133). Valeur stockée AAAA-Snn avec l'année ISO (2026-S53, 2027-S01). */
export function WeekPicker({ id, label, value, onChange, hint, error, ...bounds }: PickerBounds & {
  id: string;
  label: string;
  value: string | null;
  onChange: (week: string) => void;
  hint?: string;
  error?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('picker');
  const [open, setOpen] = useState(false);
  const parsed = value ? parseStoredWeek(value) : null;
  const known = parsed !== null && isValidWeek(parsed);
  const text = value
    ? known
      ? t('weekValue', { week: formatIsoWeek(value, locale), from: formatDate(weekStart(parsed), locale), to: formatDate(weekEnd(parsed), locale) })
      : formatIsoWeek(value, locale)
    : null;
  return (
    <PickerField
      id={id}
      label={label}
      valueText={text}
      placeholder={t('chooseWeek')}
      hint={hint}
      error={error}
      open={open}
      onOpenChange={setOpen}
      panelLabel={t('dialogWeek')}
    >
      <Calendar
        mode="week"
        {...bounds}
        closedWeeks={bounds.closedWeeks ?? []}
        start={known ? weekStart(parsed) : null}
        end={null}
        onPick={(d) => {
          onChange(storedWeekOf(d));
          setOpen(false);
        }}
      />
    </PickerField>
  );
}
