'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '@/domain/types';
import type { IsoDate } from '@/domain/week';
import { formatDate } from '@/lib/format';
import { Calendar } from './Calendar';
import { PickerField } from './PickerField';

export interface PickerBounds {
  today: IsoDate;
  min: IsoDate;
  max: IsoDate;
  closedWeeks?: readonly string[];
  lockedMonths?: ReadonlyArray<{ month: string; deadline: IsoDate }>;
  nonWorking?: import('@/domain/working-days').CalendarRules;
}

/** Sélecteur d'une date (D133). La valeur interne est ISO AAAA-MM-JJ ; l'affichage suit la langue. */
export function DatePicker({ id, label, labelHidden, value, onChange, hint, error, ...bounds }: PickerBounds & {
  id: string;
  label: string;
  labelHidden?: boolean;
  value: IsoDate | null;
  onChange: (value: IsoDate) => void;
  hint?: string;
  error?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('picker');
  const [open, setOpen] = useState(false);
  return (
    <PickerField
      id={id}
      label={label}
      labelHidden={labelHidden}
      valueText={value ? formatDate(value, locale) : null}
      placeholder={t('choose')}
      hint={hint}
      error={error}
      open={open}
      onOpenChange={setOpen}
      panelLabel={t('dialogDate')}
    >
      <Calendar
        mode="day"
        {...bounds}
        closedWeeks={bounds.closedWeeks ?? []}
        start={value}
        end={null}
        onPick={(d) => {
          onChange(d);
          setOpen(false);
        }}
      />
    </PickerField>
  );
}
