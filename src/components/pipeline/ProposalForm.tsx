'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { saveProposalAction } from '@/app/[locale]/(app)/proposals/actions';
import type { WriteState } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { Field } from '@/components/Field';
import { DateRangePicker } from '@/components/pickers/DateRangePicker';
import { WeekdayPicker } from '@/components/pickers/WeekdayPicker';
import { SelectField } from '@/components/SelectField';
import { StatusTag } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import type { Period, ProposalInput } from '@/data/schemas';
import { computeDeviations } from '@/domain/pipeline';
import { COST_STATUSES } from '@/domain/types';
import type { Locale } from '@/domain/types';
import { addDays } from '@/domain/week';
import type { CalendarRules } from '@/domain/working-days';
import { useUnsavedWarning } from '@/lib/use-unsaved-warning';

export interface NeedBrief {
  weekly_hours: number | null;
  days: number[];
  hours_slot: string | null;
  periods: Period[];
  store_codes: string[];
}

/**
 * Proposition versionnée (F-30.5) : le brouillon se prépare et se corrige, l'envoi crée la version suivante. Les écarts au
 * besoin sont calculés en direct et doivent être expliqués. Envoyer une version qui change un élément déterminant invalide
 * l'accord précédent : l'écran le dit avant l'envoi.
 */
export function ProposalForm({ needId, need, initial, stores, allowedDays, today, nonWorking, nextVersion, hasValidDecision }: {
  needId: string;
  need: NeedBrief;
  initial: ProposalInput;
  stores: Array<{ value: string; text: string }>;
  allowedDays: number[];
  today: string;
  nonWorking: CalendarRules;
  nextVersion: number;
  hasValidDecision: boolean;
}) {
  const t = useTranslations('pipeline.proposal');
  const tw = useTranslations('deadline');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [candidate, setCandidate] = useState(initial.candidate_ref);
  const [hours, setHours] = useState(String(initial.weekly_hours));
  const [days, setDays] = useState<number[]>(initial.days);
  const [slot, setSlot] = useState(initial.hours_slot ?? '');
  const [start, setStart] = useState<string | null>(initial.start_date);
  const [end, setEnd] = useState<string | null>(initial.end_date);
  const [picked, setPicked] = useState<string[]>(initial.store_codes);
  const [note, setNote] = useState(initial.deviation_note ?? '');
  const [cost, setCost] = useState<string>(initial.cost_status);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<WriteState | 'incomplete' | null>(null);
  const [pending, startTransition] = useTransition();
  useUnsavedWarning(dirty, tw('unsaved'));
  const touch = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true); setResult(null); };

  const built = useMemo((): ProposalInput | null => {
    const h = Number(hours);
    if (!/^INT-\d{3}$/.test(candidate) || !Number.isInteger(h) || h < 1 || h > 60 || days.length === 0 || !start || !end) return null;
    return {
      candidate_ref: candidate, weekly_hours: h, days, hours_slot: slot.trim() || null, start_date: start, end_date: end, store_codes: picked,
      deviation_note: note.trim() || null, cost_status: cost as ProposalInput['cost_status'],
    };
  }, [candidate, hours, days, slot, start, end, picked, note, cost]);
  const deviations = built ? computeDeviations(need, built) : [];

  const submit = (send: boolean) =>
    startTransition(async () => {
      if (!built) {
        setResult('incomplete');
        return;
      }
      const r = await saveProposalAction({ locale, needId, input: built, send });
      setResult(r);
      if (r.status === 'ok') {
        setDirty(false);
        announce(send ? (r.detail?.invalidated ? t('sentInvalidated', { n: r.detail.invalidated }) : t('sent')) : t('draftSaved'), { undoToken: r.undoToken });
      }
    });

  return (
    <section aria-labelledby="proposal-form-title" data-testid="proposal-form" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="proposal-form-title" className="text-lg font-semibold">{t('title', { n: nextVersion })}</h2>
      <p className="max-w-prose text-muted">{t('help')}</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); submit(true); }} className="grid max-w-2xl gap-4">
        <Field id="proposal-worker" label={t('worker')} hint={t('workerHint')} value={candidate} maxLength={7} onChange={(e) => touch(setCandidate)(e.target.value.toUpperCase())} />
        <Field id="proposal-hours" label={t('hours')} type="number" inputMode="numeric" min={1} max={60} value={hours} onChange={(e) => touch(setHours)(e.target.value)} />
        <WeekdayPicker id="proposal-days" label={t('days')} value={days} onChange={touch(setDays)} allowed={allowedDays} />
        <Field id="proposal-slot" label={t('slot')} hint={t('slotHint')} value={slot} maxLength={40} onChange={(e) => touch(setSlot)(e.target.value)} />
        <DateRangePicker
          id="proposal-period"
          label={t('period')}
          start={start}
          end={end}
          onChange={(s, e) => { setStart(s); setEnd(e); setDirty(true); setResult(null); }}
          today={today}
          min={addDays(today, -60)}
          max={addDays(today, 730)}
          nonWorking={nonWorking}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">{t('stores')}</legend>
          {stores.length === 0 ? <p className="text-muted">{t('noStores')}</p> : null}
          {stores.map((s) => {
            const checked = picked.includes(s.value);
            return (
              <label key={s.value} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-ctl px-4 py-2 ${checked ? 'bg-sel font-semibold' : 'bg-alt'}`}>
                <input type="checkbox" className="size-5" checked={checked} onChange={(e) => touch(setPicked)(e.target.checked ? [...picked, s.value] : picked.filter((c) => c !== s.value))} />
                {s.text}
              </label>
            );
          })}
        </fieldset>
        <div className="flex flex-col gap-2" data-testid="deviations">
          <span className="text-sm font-semibold">{t('deviations')}</span>
          {deviations.length === 0 ? (
            <StatusTag tone="ok">{t('noDeviation')}</StatusTag>
          ) : (
            <ul className="flex flex-wrap gap-2">{deviations.map((d) => <li key={d}><StatusTag tone="attention">{t(`deviation.${d}`)}</StatusTag></li>)}</ul>
          )}
        </div>
        <TextareaField
          id="proposal-note"
          label={t('note')}
          hint={deviations.length > 0 ? t('noteRequired') : t('noteHint')}
          value={note}
          maxLength={280}
          onChange={(e) => touch(setNote)(e.target.value)}
        />
        <SelectField
          id="proposal-cost"
          label={t('cost')}
          hint={t('costHint')}
          placeholder={t('choose')}
          value={cost}
          options={COST_STATUSES.map((c) => ({ value: c, text: t(`costStatus.${c}`) }))}
          onChange={(e) => touch(setCost)(e.target.value)}
        />
        {hasValidDecision ? <p className="text-muted">{t('invalidatesWarning')}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => submit(false)}>{t('saveDraft')}</Button>
          <Button type="submit" disabled={pending}>{t('send')}</Button>
        </div>
        <div aria-live="polite" data-testid="proposal-result" className="flex flex-col items-start gap-2">
          {result === 'incomplete' ? <StatusTag tone="risk">{t('incomplete')}</StatusTag> : null}
          {result && result !== 'incomplete' && result.status === 'refused' ? (
            <>
              <StatusTag tone="risk">{t(`refused.${result.reason}`)}</StatusTag>
              {result.issues?.map((i) => <span key={i} className="text-sm font-semibold text-danger">{t(`issue.${i}`)}</span>)}
            </>
          ) : null}
          {result && result !== 'incomplete' && result.status === 'invalid' ? <StatusTag tone="risk">{t('refused.invalid')}</StatusTag> : null}
          {result && result !== 'incomplete' && result.status === 'ok' ? <StatusTag tone="ok">{result.detail?.sent ? t('sent') : t('draftSaved')}</StatusTag> : null}
        </div>
      </form>
    </section>
  );
}
