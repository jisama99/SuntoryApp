'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { createDelegationAction, revokeDelegationAction } from '@/app/[locale]/(app)/settings/delegations/actions';
import type { Locale } from '@/domain/types';
import { addDays } from '@/domain/week';
import type { IsoDate } from '@/domain/week';
import type { CalendarRules } from '@/domain/working-days';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { DateRangePicker } from './pickers/DateRangePicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';

export interface DelegationZoneOption {
  value: string;
  text: string;
  kind: 'cvr' | 'dr';
}

/**
 * Désignation d'un suppléant (F-30.3) : le délégant et le suppléant sont du même niveau (CVR ou DR), les dates d'effet et de fin se
 * choisissent au calendrier (règle 12). Un suppléant agit dans le périmètre du délégant, jamais au-delà ; un seul suppléant à la fois.
 */
export function DelegationCreateForm({ zones, today, nonWorking }: { zones: DelegationZoneOption[]; today: IsoDate; nonWorking: CalendarRules }) {
  const t = useTranslations('delegations');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [delegator, setDelegator] = useState('');
  const [substitute, setSubstitute] = useState('');
  const [start, setStart] = useState<IsoDate | null>(null);
  const [end, setEnd] = useState<IsoDate | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const kind = zones.find((z) => z.value === delegator)?.kind;

  const submit = () =>
    startTransition(async () => {
      if (!delegator || !substitute || !start || !end) return setResult('incomplete');
      const r = await createDelegationAction({ locale, delegatorZoneId: delegator, substituteZoneId: substitute, startDate: start, endDate: end });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setDelegator('');
        setSubstitute('');
        setStart(null);
        setEnd(null);
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} data-testid="delegation-form" aria-labelledby="delegation-form-title" className="grid max-w-2xl gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="delegation-form-title" className="text-lg font-semibold">{t('form.title')}</h2>
      <p className="max-w-prose text-muted">{t('form.help')}</p>
      <SelectField
        id="delegation-delegator"
        label={t('form.delegator')}
        placeholder={t('form.choose')}
        value={delegator}
        options={zones.map((z) => ({ value: z.value, text: z.text }))}
        onChange={(e) => { setDelegator(e.target.value); setSubstitute(''); setResult(null); }}
      />
      <SelectField
        id="delegation-substitute"
        label={t('form.substitute')}
        hint={t('form.substituteHint')}
        placeholder={t('form.choose')}
        value={substitute}
        disabled={!kind}
        options={zones.filter((z) => z.kind === kind && z.value !== delegator).map((z) => ({ value: z.value, text: z.text }))}
        onChange={(e) => { setSubstitute(e.target.value); setResult(null); }}
      />
      <DateRangePicker
        id="delegation-period"
        label={t('form.period')}
        hint={t('form.periodHint')}
        start={start}
        end={end}
        onChange={(s, e) => { setStart(s); setEnd(e); setResult(null); }}
        today={today}
        min={today}
        max={addDays(today, 365)}
        nonWorking={nonWorking}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{t('form.submit')}</Button>
        <div aria-live="polite" data-testid="delegation-result">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
      </div>
    </form>
  );
}

/** Révocation : la délégation reste au dossier avec sa trace, elle ne se supprime pas. */
export function RevokeDelegationButton({ delegationId }: { delegationId: string }) {
  const t = useTranslations('delegations');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const r = await revokeDelegationAction({ locale, delegationId });
          if (r.status === 'ok') { announce(tc('saved'), { undoToken: r.undoToken }); setResult(null); } else setResult(r.status === 'refused' ? r.reason : 'invalid');
        })}
      >
        {t('revoke')}
      </Button>
      <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
    </div>
  );
}
