'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { saveNeedAction } from '@/app/[locale]/needs/actions';
import type { FindingDto, SaveState } from '@/app/[locale]/needs/actions';
import { DISPOSITIFS } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { isoWeekOf, formatWeek } from '@/domain/week';
import { Link } from '@/i18n/navigation';
import { EMPTY_PERIOD, HOURS, toInput } from '@/lib/need-form-value';
import type { NeedFormValue, PeriodValue } from '@/lib/need-form-value';
import { Button } from './Button';
import { Field } from './Field';
import { FindingsPanel } from './FindingsPanel';
import { DateRangePicker } from './pickers/DateRangePicker';
import { WeekPicker } from './pickers/WeekPicker';
import { WeekdayPicker } from './pickers/WeekdayPicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';
import { TextareaField } from './TextareaField';

export interface NeedFormProps {
  mode: 'new' | 'edit';
  needId?: string;
  initial: NeedFormValue;
  /** Secteurs proposés (un seul pour un RS). */
  sectors: Array<{ id: string; text: string }>;
  stores: Array<{ value: string; text: string; sectorId: string | null }>;
  campaigns: Array<{ value: string; dispositif: string; text: string }>;
  today: string;
  min: string;
  max: string;
  closedWeeks: string[];
  daysAllowed: number[];
}

/** Saisie unitaire d'un besoin (F-20.1) : dates et semaines par calendrier, jours par cases, règles W et D renvoyées par la couche données. */
export function NeedForm(props: NeedFormProps) {
  const t = useTranslations('form');
  const td = useTranslations('dispositif');
  const locale = useLocale() as Locale;
  const [value, setValue] = useState<NeedFormValue>(props.initial);
  const [result, setResult] = useState<SaveState | null>(null);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof NeedFormValue>(key: K, v: NeedFormValue[K]) => {
    setValue((cur) => ({ ...cur, [key]: v }));
    setResult(null);
  };
  const bounds = { today: props.today, min: props.min, max: props.max, closedWeeks: props.closedWeeks };

  const setPeriod = (i: number, patch: Partial<PeriodValue>) => {
    setValue((cur) => ({ ...cur, periods: cur.periods.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
    setResult(null);
  };
  const setRange = (i: number, start: string, end: string | null) =>
    setPeriod(i, {
      start_date: start,
      end_date: end,
      start_week: formatWeek(isoWeekOf(start)),
      end_week: end ? formatWeek(isoWeekOf(end)) : null,
    });

  const campaigns = props.campaigns.filter((c) => !value.dispositif || c.dispositif === value.dispositif);
  const stores = props.stores.filter((s) => s.sectorId === value.sector_id || s.sectorId === null);
  const missing = new Set(result && result.status !== 'invalid' ? result.missing : []);
  const err = (key: string) => (missing.has(key) ? t('required') : undefined);

  const submit = (options: { confirm?: boolean; mergeInto?: string } = {}) =>
    startTransition(async () => {
      setResult(
        await saveNeedAction({ locale, input: toInput(value), needId: props.needId, confirm: options.confirm, mergeInto: options.mergeInto }),
      );
    });

  const applyFix = (fix: NonNullable<FindingDto['fix']>) => {
    setPeriod(fix.periodNo - 1, { [fix.field]: fix.value });
  };

  const mergeCandidate =
    result && result.status === 'needs_confirmation'
      ? result.findings.find((f) => ['D2', 'D3', 'D4'].includes(f.rule) && f.relatedVisible && f.relatedNeedId)?.relatedNeedId
      : undefined;

  const dispositifOptions = DISPOSITIFS.map((d) => ({ value: d, text: td(d) }));
  const noteKey = result?.status === 'saved' ? `saved.${result.decision}` : null;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6"
      aria-describedby="need-form-note"
    >
      <p id="need-form-note" className="max-w-prose text-muted">{t('note')}</p>

      <section aria-labelledby="f-general" className="grid gap-4 rounded-card bg-surface p-5 shadow-card sm:grid-cols-2">
        <h2 id="f-general" className="text-lg font-semibold sm:col-span-2">{t('sections.general')}</h2>
        {props.sectors.length === 1 ? (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-semibold">{t('fields.sector')}</span>
            <span>{props.sectors[0]?.text}</span>
          </div>
        ) : (
          <div className="sm:col-span-2">
            <SelectField
              id="f-sector"
              label={t('fields.sector')}
              placeholder={t('choose')}
              value={value.sector_id}
              disabled={props.mode === 'edit'}
              onChange={(e) => setValue((cur) => ({ ...cur, sector_id: e.target.value, store_codes: [] }))}
              options={props.sectors.map((s) => ({ value: s.id, text: s.text }))}
            />
          </div>
        )}
        <SelectField
          id="f-dispositif"
          label={t('fields.dispositif')}
          placeholder={t('choose')}
          value={value.dispositif}
          options={dispositifOptions}
          error={err('dispositif')}
          onChange={(e) => setValue((cur) => ({ ...cur, dispositif: e.target.value, campaign_code: '' }))}
        />
        <SelectField
          id="f-campaign"
          label={t('fields.campaign')}
          placeholder={t('choose')}
          value={value.campaign_code}
          options={campaigns.map((c) => ({ value: c.value, text: c.text }))}
          error={err('campaign_code')}
          hint={t('hints.campaign')}
          onChange={(e) => set('campaign_code', e.target.value)}
        />
        <SelectField
          id="f-position"
          label={t('fields.position')}
          placeholder={t('choose')}
          value={value.position_label}
          options={Array.from({ length: 7 }, (_, i) => ({ value: `Poste ${i + 1}`, text: `${t('fields.positionPrefix')} ${i + 1}` }))}
          error={err('position_label')}
          onChange={(e) => set('position_label', e.target.value)}
        />
        <SelectField
          id="f-priority"
          label={t('fields.priority')}
          placeholder={t('choose')}
          value={value.priority}
          options={[1, 2, 3].map((p) => ({ value: String(p), text: t('fields.priorityN', { n: p }) }))}
          error={err('priority')}
          onChange={(e) => set('priority', e.target.value)}
        />
        <SelectField
          id="f-hours"
          label={t('fields.weeklyHours')}
          placeholder={t('choose')}
          value={value.weekly_hours}
          options={HOURS.map((h) => ({ value: String(h), text: t('fields.hoursN', { n: h }) }))}
          error={err('weekly_hours')}
          onChange={(e) => set('weekly_hours', e.target.value)}
        />
        <Field
          id="f-slot"
          label={t('fields.hoursSlot')}
          hint={t('hints.hoursSlot')}
          error={err('hours_slot')}
          value={value.hours_slot}
          maxLength={40}
          onChange={(e) => set('hours_slot', e.target.value)}
        />
      </section>

      {value.periods.map((p, i) => (
        <section key={i} aria-labelledby={`f-period-${i}`} className="grid gap-4 rounded-card bg-surface p-5 shadow-card sm:grid-cols-2">
          <h2 id={`f-period-${i}`} className="text-lg font-semibold sm:col-span-2">{t('periodN', { n: i + 1 })}</h2>
          <div className="sm:col-span-2">
            <DateRangePicker
              id={`f-range-${i}`}
              label={t('fields.dates')}
              start={p.start_date}
              end={p.end_date}
              onChange={(s, e) => setRange(i, s, e)}
              error={i === 0 ? err('period') : undefined}
              {...bounds}
            />
          </div>
          <WeekPicker id={`f-sw-${i}`} label={t('fields.startWeek')} value={p.start_week} onChange={(w) => setPeriod(i, { start_week: w })} {...bounds} />
          <WeekPicker id={`f-ew-${i}`} label={t('fields.endWeek')} value={p.end_week} onChange={(w) => setPeriod(i, { end_week: w })} {...bounds} />
          {i === 1 ? (
            <Button type="button" variant="ghost" className="w-fit" onClick={() => setValue((cur) => ({ ...cur, periods: cur.periods.slice(0, 1) }))}>
              {t('removePeriod')}
            </Button>
          ) : null}
        </section>
      ))}
      {value.periods.length < 2 ? (
        <Button type="button" variant="secondary" className="w-fit" onClick={() => setValue((cur) => ({ ...cur, periods: [...cur.periods, EMPTY_PERIOD] }))}>
          {t('addPeriod')}
        </Button>
      ) : null}

      <section aria-labelledby="f-days" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
        <h2 id="f-days" className="text-lg font-semibold">{t('sections.days')}</h2>
        <WeekdayPicker id="f-weekdays" label={t('fields.days')} value={value.days} onChange={(d) => set('days', d)} allowed={props.daysAllowed} error={err('days')} />
      </section>

      <section aria-labelledby="f-stores" className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
        <h2 id="f-stores" className="text-lg font-semibold">{t('sections.stores')}</h2>
        {stores.length === 0 ? (
          <p className="text-muted">{t('noStores')}</p>
        ) : (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">{t('fields.stores')}</legend>
            {stores.map((s) => (
              <label key={s.value} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={value.store_codes.includes(s.value)}
                  onChange={(e) => set('store_codes', e.target.checked ? [...value.store_codes, s.value] : value.store_codes.filter((c) => c !== s.value))}
                />
                <span>{s.text}</span>
              </label>
            ))}
          </fieldset>
        )}
        <TextareaField
          id="f-comment"
          label={t('fields.comment')}
          hint={t('hints.comment')}
          value={value.client_comment}
          maxLength={280}
          onChange={(e) => set('client_comment', e.target.value)}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? t('saving') : t('save')}</Button>
        <Link href="/needs" className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-link hover:bg-sel">
          {t('back')}
        </Link>
      </div>

      <div aria-live="polite" data-testid="form-result" className="flex flex-col gap-4">
        {result?.status === 'invalid' ? <StatusTag tone="risk">{t('invalid')}</StatusTag> : null}
        {result?.status === 'saved' && noteKey ? (
          <div className="flex flex-col gap-3 rounded-card bg-ok-soft p-5 text-ink" data-testid="saved">
            <StatusTag tone="ok">{t(`${noteKey}.title`)}</StatusTag>
            <p>{t(`${noteKey}.body`, { code: result.needCode })}</p>
            {result.missing.length > 0 ? (
              <p className="text-muted">{t('stillMissing', { fields: result.missing.map((m) => t(`missing.${m}`)).join(', ') })}</p>
            ) : null}
            <Link href="/needs" className="inline-flex min-h-11 w-fit items-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
              {t('goList')}
            </Link>
          </div>
        ) : null}
        {result?.status === 'refused' ? (
          <div className="flex flex-col gap-3" data-testid="refused">
            <StatusTag tone="risk">{t(`refusal.${result.reason}`)}</StatusTag>
          </div>
        ) : null}
        {result && result.status !== 'invalid' && result.findings.length > 0 ? (
          <FindingsPanel findings={result.findings} onFix={applyFix} />
        ) : null}
        {result?.status === 'needs_confirmation' ? (
          <div className="flex flex-wrap items-center gap-3" data-testid="confirm-actions">
            <p className="w-full text-muted">{t('confirmNote')}</p>
            <Button type="button" disabled={pending} onClick={() => submit({ confirm: true })}>{t('confirm')}</Button>
            {mergeCandidate ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={() => submit({ mergeInto: mergeCandidate })}>{t('merge')}</Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => setResult(null)}>{t('adjust')}</Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
