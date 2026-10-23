'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { recordStepAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { DatePicker } from '@/components/pickers/DatePicker';
import { SelectField } from '@/components/SelectField';
import { StatusTag } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import type { Locale, RecruitmentStep } from '@/domain/types';
import { addDays } from '@/domain/week';
import type { CalendarRules } from '@/domain/working-days';
import { formatDate } from '@/lib/format';

/** Heures de prise de poste proposées, par demi-heure (D231) : saisie par sélecteur, jamais en texte libre. */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const v = `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
  return { value: v, text: v };
});

export interface StepDef {
  step: RecruitmentStep;
  /** Valeur courante affichée (date déjà enregistrée), le cas échéant. */
  current: string | null;
  /** Étape ouverte à cette personne et dans l'état du besoin. */
  enabled: boolean;
  /** Raison écrite quand l'étape est fermée. */
  blocked?: 'not_taken' | 'no_accord' | 'not_hired' | 'closed' | 'forbidden' | 'already' | 'accord_pending';
  field: 'date' | 'date_future' | 'motive' | 'sector' | 'none' | 'date_motive';
  /** Date plancher (par exemple la date du recrutement). */
  min?: string;
}

/**
 * Étapes de recrutement, de prise de poste et de remise du véhicule. Chaque étape est une écriture à part, avec sa date :
 * la prise de poste et la remise du véhicule sont deux événements distincts (D11). Les dates passent par le sélecteur (règle 12).
 */
export function StepPanel({ needId, steps, sectors, today, nonWorking }: {
  needId: string;
  steps: StepDef[];
  sectors: Array<{ id: string; text: string }>;
  today: string;
  nonWorking: CalendarRules;
}) {
  return (
    <section aria-labelledby="steps-title" data-testid="step-panel" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <StepsHeading />
      <ul className="grid gap-4 lg:grid-cols-2">
        {steps.map((s) => <StepItem key={s.step} needId={needId} def={s} sectors={sectors} today={today} nonWorking={nonWorking} />)}
      </ul>
    </section>
  );
}

function StepsHeading() {
  const t = useTranslations('pipeline.steps');
  return (
    <>
      <h2 id="steps-title" className="text-lg font-semibold">{t('title')}</h2>
      <p className="max-w-prose text-muted">{t('help')}</p>
    </>
  );
}

function StepItem({ needId, def, sectors, today, nonWorking }: { needId: string; def: StepDef; sectors: Array<{ id: string; text: string }>; today: string; nonWorking: CalendarRules }) {
  const t = useTranslations('pipeline.steps');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [date, setDate] = useState<string | null>(def.field === 'date' || def.field === 'date_future' || def.field === 'date_motive' ? today : null);
  const [motive, setMotive] = useState('');
  const [sector, setSector] = useState('');
  const [time, setTime] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const needsDate = def.field === 'date' || def.field === 'date_future' || def.field === 'date_motive';
  const needsMotive = def.field === 'motive' || def.field === 'date_motive';
  const max = def.field === 'date_future' ? addDays(today, 365) : today;

  const submit = () =>
    startTransition(async () => {
      if ((needsDate && !date) || (needsMotive && def.field === 'motive' && motive.trim() === '') || (def.field === 'sector' && !sector)) {
        setResult(def.field === 'sector' ? 'invalid_sector' : needsMotive && !motive.trim() ? 'motive_required' : 'invalid');
        return;
      }
      const r = await recordStepAction({
        locale, needId, step: def.step, ...(needsDate && date ? { date } : {}), ...(needsMotive ? { motive } : {}), ...(def.step === 'start_work' && time ? { time } : {}), ...(def.field === 'sector' ? { fromSectorId: sector } : {}),
      });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setResult(null);
        setMotive('');
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <li data-step={def.step} className="flex flex-col gap-3 rounded-ctl bg-alt p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{t(`names.${def.step}`)}</h3>
        {def.current ? <StatusTag tone="ok">{t('recordedOn', { date: formatDate(def.current, locale) })}</StatusTag> : null}
      </div>
      <p className="text-sm text-muted">{t(`hints.${def.step}`)}</p>
      {def.enabled ? (
        <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-3">
          {needsDate ? (
            <DatePicker
              id={`step-${def.step}-date`}
              label={t('date')}
              value={date}
              onChange={(d) => { setDate(d); setResult(null); }}
              today={today}
              min={def.min ?? addDays(today, -365)}
              max={max}
              nonWorking={nonWorking}
            />
          ) : null}
          {def.step === 'start_work' ? (
            <SelectField id="step-start_work-time" label={t('time')} placeholder={t('timeNone')} value={time} options={TIME_OPTIONS} onChange={(e) => { setTime(e.target.value); setResult(null); }} />
          ) : null}
          {def.field === 'sector' ? (
            <SelectField id="step-reassign-sector" label={t('fromSector')} placeholder={t('choose')} value={sector} options={sectors.map((s) => ({ value: s.id, text: s.text }))} onChange={(e) => { setSector(e.target.value); setResult(null); }} />
          ) : null}
          {needsMotive ? (
            <TextareaField id={`step-${def.step}-motive`} label={t('motive')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="secondary" disabled={pending}>{t(`actions.${def.step}`)}</Button>
            <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
          </div>
        </form>
      ) : (
        <p className="text-sm font-semibold text-muted">{t(`blocked.${def.blocked ?? 'forbidden'}`)}</p>
      )}
    </li>
  );
}
