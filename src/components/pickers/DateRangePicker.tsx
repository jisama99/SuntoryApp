'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '@/domain/types';
import type { IsoDate } from '@/domain/week';
import { formatDate } from '@/lib/format';
import { Calendar } from './Calendar';
import type { PickerBounds } from './DatePicker';
import { PickerField } from './PickerField';

/**
 * Sélecteur de période (D133) : premier clic = premier jour, second clic = dernier jour. Un second clic antérieur au
 * premier jour redémarre la période.
 */
export function DateRangePicker({ id, label, labelHidden, start, end, onChange, hint, error, ...bounds }: PickerBounds & {
  id: string;
  label: string;
  labelHidden?: boolean;
  start: IsoDate | null;
  end: IsoDate | null;
  onChange: (start: IsoDate, end: IsoDate | null) => void;
  hint?: string;
  error?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('picker');
  const [open, setOpen] = useState(false);
  const [choosingEnd, setChoosingEnd] = useState(false);
  const text = start && end ? t('rangeValue', { start: formatDate(start, locale), end: formatDate(end, locale) }) : start ? t('rangeStartOnly', { start: formatDate(start, locale) }) : null;
  return (
    <PickerField
      id={id}
      label={label}
      labelHidden={labelHidden}
      valueText={text}
      placeholder={t('choosePeriod')}
      hint={hint ?? t('rangeHint')}
      error={error}
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setChoosingEnd(false);
      }}
      panelLabel={t('dialogRange')}
    >
      <Calendar
        mode="range"
        {...bounds}
        // Seul le premier jour détermine le mois cible : la clôture d'un mois ne désactive que le choix du premier jour.
        lockedMonths={choosingEnd ? undefined : bounds.lockedMonths}
        closedWeeks={bounds.closedWeeks ?? []}
        start={start}
        end={end}
        onPick={(d) => {
          if (choosingEnd && start && d >= start) {
            onChange(start, d);
            setChoosingEnd(false);
            setOpen(false);
          } else {
            onChange(d, null);
            setChoosingEnd(true);
          }
        }}
      />
    </PickerField>
  );
}
