'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { holidayOf } from '@/domain/holidays';
import { nonWorkingReason } from '@/domain/working-days';
import type { CalendarRules } from '@/domain/working-days';
import type { Locale } from '@/domain/types';
import { addDays, isoWeekOf, storedWeekOf, weekdayOf } from '@/domain/week';
import type { IsoDate } from '@/domain/week';
import { formatIsoWeek } from '@/lib/format';
import { Icon } from '../Icon';
import { UI_ICONS } from '../icons';

export type CalendarMode = 'day' | 'range' | 'week';

export interface CalendarProps {
  mode: CalendarMode;
  /** Jour courant de l'horloge de démonstration (jamais l'horloge du poste). */
  today: IsoDate;
  min: IsoDate;
  max: IsoDate;
  /** Semaines clôturées : leurs jours sont désactivés avec leur raison écrite. */
  closedWeeks: readonly string[];
  /** Début (et fin pour une période) sélectionnés. */
  start: IsoDate | null;
  end: IsoDate | null;
  onPick: (date: IsoDate) => void;
  /** Mois dont la saisie est close (D78) : leurs jours sont désactivés avec la date limite dépassée. */
  lockedMonths?: ReadonlyArray<{ month: string; deadline: IsoDate }>;
  /** Jours non ouvrés désactivés avec leur raison (calendrier d'échéances, durée de réouverture). */
  nonWorking?: CalendarRules;
}

const INTL: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

export type DayReason =
  | { key: 'outOfBounds'; min: IsoDate; max: IsoDate }
  | { key: 'closedWeek'; week: string }
  | { key: 'afterDeadline'; month: string; deadline: IsoDate }
  | { key: 'weekend'; weekday: number }
  | { key: 'nonWorkingHoliday'; holiday: string };

/** Raison pour laquelle un jour n'est pas sélectionnable, ou null. */
export function disabledReason(date: IsoDate, p: Pick<CalendarProps, 'min' | 'max' | 'closedWeeks' | 'lockedMonths' | 'nonWorking'>): DayReason | null {
  if (date < p.min || date > p.max) return { key: 'outOfBounds', min: p.min, max: p.max };
  const week = storedWeekOf(date);
  if (p.closedWeeks.includes(week)) return { key: 'closedWeek', week };
  const locked = p.lockedMonths?.find((m) => m.month === date.slice(0, 7));
  if (locked) return { key: 'afterDeadline', month: locked.month, deadline: locked.deadline };
  if (p.nonWorking) {
    const r = nonWorkingReason(date, p.nonWorking);
    if (r?.kind === 'weekday') return { key: 'weekend', weekday: r.weekday };
    if (r?.kind === 'holiday') return { key: 'nonWorkingHoliday', holiday: r.holiday };
  }
  return null;
}

const monthStart = (d: IsoDate) => `${d.slice(0, 7)}-01`;
const shiftMonth = (d: IsoDate, n: number): IsoDate => {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7)) - 1 + n;
  const date = new Date(Date.UTC(y, m, 1));
  return date.toISOString().slice(0, 10);
};

/**
 * Calendrier de sélection (D133, règle commune 12) : semaine du lundi, numéro de semaine ISO, jours désactivés avec
 * raison écrite, clavier complet (flèches, Début, Fin, Page précédente et suivante), cibles de 44 px.
 */
export function Calendar(props: CalendarProps) {
  const { mode, today, start, end, onPick } = props;
  const locale = useLocale() as Locale;
  const t = useTranslations('picker');
  const initial = start ?? (today < props.min ? props.min : today > props.max ? props.max : today);
  const [focus, setFocus] = useState<IsoDate>(initial);
  const [month, setMonth] = useState<IsoDate>(monthStart(initial));
  const grid = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(true);

  const intl = INTL[locale];
  const monthLabel = new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const dayLabel = new Intl.DateTimeFormat(intl, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const weekdayLabel = new Intl.DateTimeFormat(intl, { weekday: 'short', timeZone: 'UTC' });

  const weeks = useMemo(() => {
    const gridStart = addDays(month, -(weekdayOf(month) - 1));
    return Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, i) => addDays(gridStart, r * 7 + i)));
  }, [month]);

  useEffect(() => {
    if (!wantFocus.current) return;
    grid.current?.querySelector<HTMLElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus, month]);

  const move = (to: IsoDate) => {
    wantFocus.current = true;
    setFocus(to);
    setMonth(monthStart(to));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const wd = weekdayOf(focus);
    const keys: Record<string, IsoDate> = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      Home: addDays(focus, -(wd - 1)),
      End: addDays(focus, 7 - wd),
      PageUp: shiftMonth(focus, e.shiftKey ? -12 : -1).slice(0, 8) + focus.slice(8),
      PageDown: shiftMonth(focus, e.shiftKey ? 12 : 1).slice(0, 8) + focus.slice(8),
    };
    const next = keys[e.key];
    if (!next) return;
    e.preventDefault();
    move(next);
  };

  const selectedWeek = mode === 'week' && start ? storedWeekOf(start) : null;
  const focusReason = disabledReason(focus, props);
  const focusHoliday = holidayOf(focus);

  const reasonText = (r: DayReason) => {
    switch (r.key) {
      case 'outOfBounds':
        return t('reason.outOfBounds', { min: formatDay(r.min), max: formatDay(r.max) });
      case 'closedWeek':
        return t('reason.closedWeek', { week: formatIsoWeek(r.week, locale) });
      case 'afterDeadline':
        return t('reason.afterDeadline', { month: monthName(r.month), deadline: formatDay(r.deadline) });
      case 'weekend':
        return t('reason.weekend', { day: weekdayName(r.weekday) });
      case 'nonWorkingHoliday':
        return t('reason.nonWorkingHoliday', { name: t(`holiday.${r.holiday}`) });
    }
  };
  const monthName = (m: string) =>
    new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${m}-01T00:00:00Z`));
  const weekdayName = (wd: number) =>
    new Intl.DateTimeFormat(intl, { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${addDays('2026-11-01', wd)}T00:00:00Z`));
  const formatDay = (d: IsoDate) =>
    new Intl.DateTimeFormat(intl, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));

  return (
    <div className="w-84 max-w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={t('prevMonth')}
          onClick={() => move(shiftMonth(month, -1))}
          className="grid size-11 place-items-center rounded-full hover:bg-alt"
        >
          <Icon icon={UI_ICONS.chevronLeft} size="md" />
        </button>
        <p className="font-semibold capitalize" aria-live="polite">
          {monthLabel.format(new Date(`${month}T00:00:00Z`))}
        </p>
        <button
          type="button"
          aria-label={t('nextMonth')}
          onClick={() => move(shiftMonth(month, 1))}
          className="grid size-11 place-items-center rounded-full hover:bg-alt"
        >
          <Icon icon={UI_ICONS.chevronRight} size="md" />
        </button>
      </div>

      <div ref={grid} role="grid" aria-label={monthLabel.format(new Date(`${month}T00:00:00Z`))} onKeyDown={onKeyDown}>
        <div role="row" className="grid grid-cols-[var(--calendar-week-col)_repeat(7,1fr)] items-center text-center text-xs text-muted">
          <span role="columnheader" title={t('isoWeek')}>
            {t('weekShort')}
          </span>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} role="columnheader" className="py-1 capitalize">
              {weekdayLabel.format(new Date(`${addDays('2026-11-02', i)}T00:00:00Z`))}
            </span>
          ))}
        </div>
        {weeks.map((row) => {
          const mondayWeek = isoWeekOf(row[0] as string);
          const stored = `${mondayWeek.year}-S${String(mondayWeek.week).padStart(2, '0')}`;
          const weekClosed = props.closedWeeks.includes(stored);
          return (
            <div key={row[0]} role="row" className="grid grid-cols-[var(--calendar-week-col)_repeat(7,1fr)] items-center">
              {mode === 'week' ? (
                <button
                  type="button"
                  aria-label={t('pickWeek', { week: formatIsoWeek(stored, locale) })}
                  aria-disabled={weekClosed || undefined}
                  onClick={() => !weekClosed && onPick(row[0] as string)}
                  className="grid h-11 place-items-center text-xs text-muted hover:text-ink"
                >
                  {mondayWeek.week}
                </button>
              ) : (
                <span role="rowheader" aria-label={t('isoWeekNumber', { week: mondayWeek.week })} className="grid h-11 place-items-center text-xs text-muted">
                  {mondayWeek.week}
                </span>
              )}
              {row.map((d) => {
                const inMonth = d.slice(0, 7) === month.slice(0, 7);
                const reason = disabledReason(d, props);
                const holiday = holidayOf(d);
                const isStart = d === start;
                const isEnd = d === end;
                const inRange = mode === 'range' && start !== null && end !== null && d > start && d < end;
                const inWeek = selectedWeek !== null && storedWeekOf(d) === selectedWeek;
                const selected = isStart || isEnd || inWeek;
                const cls = reason
                  ? 'bg-alt text-muted'
                  : selected
                    ? 'bg-primary text-on-fill font-semibold'
                    : inRange
                      ? 'bg-sel text-ink'
                      : d === today
                        ? 'bg-tint-aqua text-ink font-semibold'
                        : holiday
                          ? 'bg-tint-sand text-ink'
                          : inMonth
                            ? 'text-ink hover:bg-alt'
                            : 'text-muted hover:bg-alt';
                const spoken = [
                  dayLabel.format(new Date(`${d}T00:00:00Z`)),
                  d === today ? t('today') : null,
                  holiday ? t('reason.holiday', { name: t(`holiday.${holiday}`) }) : null,
                  reason ? reasonText(reason) : null,
                ].filter(Boolean).join(', ');
                return (
                  <div key={d} role="gridcell" aria-selected={selected || undefined} className="grid place-items-center">
                    <button
                      type="button"
                      data-date={d}
                      tabIndex={d === focus ? 0 : -1}
                      aria-label={spoken}
                      aria-disabled={reason ? true : undefined}
                      aria-current={d === today ? 'date' : undefined}
                      onFocus={() => {
                        wantFocus.current = false;
                        setFocus(d);
                      }}
                      onClick={() => {
                        if (reason) return;
                        wantFocus.current = true;
                        onPick(d);
                      }}
                      className={`relative grid size-11 place-items-center rounded-full tabular text-sm ${cls} ${reason ? 'cursor-not-allowed' : ''}`}
                    >
                      {Number(d.slice(8))}
                      {holiday ? (
                        <span aria-hidden="true" className="absolute bottom-0.5 text-xs leading-none">
                          {t('holidayShort')}
                        </span>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="mt-2 min-h-11 text-sm text-muted" aria-live="polite" data-testid="calendar-reason">
        {focusReason ? reasonText(focusReason) : focusHoliday ? t('reason.holiday', { name: t(`holiday.${focusHoliday}`) }) : t('legend')}
      </p>
      <button
        type="button"
        onClick={() => move(today < props.min ? props.min : today > props.max ? props.max : today)}
        className="min-h-11 rounded-full px-4 text-sm font-semibold text-link hover:bg-sel"
      >
        {t('goToday')}
      </button>
    </div>
  );
}
