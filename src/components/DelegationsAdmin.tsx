'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { createDelegationAction, stopDelegationAction } from '@/app/[locale]/(app)/settings/actions';
import type { Locale } from '@/domain/types';
import type { IsoDate } from '@/domain/week';
import { addDays } from '@/domain/week';
import type { CalendarRules } from '@/domain/working-days';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { DateRangePicker } from './pickers/DateRangePicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';
import { TextareaField } from './TextareaField';

export interface DelegationZoneOption {
  value: string;
  text: string;
  kind: 'cvr' | 'dr';
}

/**
 * Création d'une délégation (F-30.3) : zone de l'absent, zone du suppléant de même niveau, période choisie au calendrier
 * (règle 12). Les contrôles (chevauchement, chaîne, dates) sont faits par la couche de données.
 */
export function DelegationCreateForm({ zones, today, nonWorking }: { zones: DelegationZoneOption[]; today: IsoDate; nonWorking: CalendarRules }) {
  const t = useTranslations('delegations');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [absent, setAbsent] = useState('');
  const [substitute, setSubstitute] = useState('');
  const [start, setStart] = useState<IsoDate | null>(null);
  const [end, setEnd] = useState<IsoDate | null>(null);
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<'ok' | string | null>(null);
  const [pending, startTransition] = useTransition();
  const kind = zones.find((z) => z.value === absent)?.kind;
  const substitutes = zones.filter((z) => z.kind === kind && z.value !== absent);

  const submit = () =>
    startTransition(async () => {
      if (!absent || !substitute || !start || !end) return setResult('required');
      const r = await createDelegationAction({ locale, absentZoneId: absent, substituteZoneId: substitute, startsOn: start, endsOn: end, motive });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setResult('ok');
        setAbsent(''); setSubstitute(''); setStart(null); setEnd(null); setMotive('');
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <section aria-labelledby="delegation-new-title" data-testid="delegation-form" className="mb-8 flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="delegation-new-title" className="text-lg font-semibold">{t('form.title')}</h2>
      <p className="max-w-prose text-muted">{t('intro')}</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid max-w-xl gap-4">
        <SelectField id="delegation-absent" label={t('form.absent')} placeholder={t('form.choose')} value={absent} options={zones} onChange={(e) => { setAbsent(e.target.value); setSubstitute(''); setResult(null); }} />
        <SelectField id="delegation-substitute" label={t('form.substitute')} placeholder={t('form.choose')} value={substitute} options={substitutes} disabled={!absent} onChange={(e) => { setSubstitute(e.target.value); setResult(null); }} />
        <DateRangePicker
          id="delegation-period"
          label={t('form.period')}
          start={start}
          end={end}
          onChange={(s, e) => { setStart(s); setEnd(e); setResult(null); }}
          today={today}
          min={today}
          max={addDays(today, 365)}
          nonWorking={nonWorking}
        />
        <TextareaField id="delegation-motive" label={t('form.motive')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>{t('form.submit')}</Button>
          <div aria-live="polite" data-testid="delegation-result">
            {result === 'ok' ? <StatusTag tone="ok">{t('form.created')}</StatusTag> : null}
            {result && result !== 'ok' ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}
          </div>
        </div>
      </form>
    </section>
  );
}

/** Arrêt ou annulation d'une délégation : effet le jour même, trace conservée. */
export function DelegationStopButton({ delegationId, planned }: { delegationId: string; planned: boolean }) {
  const t = useTranslations('delegations');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const stop = () =>
    startTransition(async () => {
      const r = await stopDelegationAction({ locale, delegationId });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });
  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" disabled={pending} onClick={stop} data-delegation-stop={delegationId}>{planned ? t('cancel') : t('stop')}</Button>
      <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
    </div>
  );
}
