'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { removeAllocationAction, saveAllocationAction, setEnvelopeAction } from '@/app/[locale]/(app)/budget/actions';
import type { Locale } from '@/domain/types';
import type { IsoDate } from '@/domain/week';
import type { CalendarRules } from '@/domain/working-days';
import { formatMoney, parseMoneyInput } from '@/lib/money';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { Field } from './Field';
import { DateRangePicker } from './pickers/DateRangePicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';
import { TextareaField } from './TextareaField';

/** Version de départ du formulaire d'enveloppe : la version courante, que la cliente remplace. */
export interface EnvelopeDefaults {
  version: number;
  periodStart: IsoDate;
  periodEnd: IsoDate;
}

/**
 * Saisie d'une nouvelle version de l'enveloppe (direction cliente). Le montant se tape (deux décimales au plus), la période se
 * choisit au calendrier (règle 12). Le motif est exigé dès la deuxième version. Les refus viennent de la couche de données.
 */
export function EnvelopeForm({ current, today, min, max, nonWorking }: { current: EnvelopeDefaults | null; today: IsoDate; min: IsoDate; max: IsoDate; nonWorking: CalendarRules }) {
  const t = useTranslations('budget.envelope');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [amount, setAmount] = useState('');
  const [start, setStart] = useState<IsoDate | null>(current?.periodStart ?? null);
  const [end, setEnd] = useState<IsoDate | null>(current?.periodEnd ?? null);
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const value = parseMoneyInput(amount);
      if (value === null || !start || !end) return setResult('incomplete');
      const r = await setEnvelopeAction({ locale, amountEur: value, periodStart: start, periodEnd: end, motive });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setAmount('');
        setMotive('');
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} data-testid="envelope-form" aria-labelledby="envelope-form-title" className="grid max-w-2xl gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="envelope-form-title" className="text-lg font-semibold">{t('formTitle')}</h2>
      {current ? null : <p className="text-muted">{t('firstVersion')}</p>}
      <Field
        id="envelope-amount"
        label={t('amount')}
        hint={t('amountHint')}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); setResult(null); }}
      />
      <DateRangePicker
        id="envelope-period"
        label={t('period')}
        hint={t('periodHint')}
        start={start}
        end={end}
        onChange={(s, e) => { setStart(s); setEnd(e); setResult(null); }}
        today={today}
        min={min}
        max={max}
        nonWorking={nonWorking}
      />
      <TextareaField
        id="envelope-motive"
        label={t('motive')}
        hint={current ? t('motiveHint') : undefined}
        maxLength={280}
        value={motive}
        onChange={(e) => { setMotive(e.target.value); setResult(null); }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{t('submit')}</Button>
        <div aria-live="polite" data-testid="envelope-result">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
      </div>
    </form>
  );
}

export interface AllocationLineOption {
  campaign: string;
  cvrId: string;
  cents: number;
  revision: number;
}

/**
 * Création ou modification d'une ligne d'allocation (agence administration). Le total réparti ne dépasse jamais l'enveloppe : le
 * contrôle est dans la couche de données, l'écran affiche seulement le refus. Modifier une ligne existante exige un motif.
 */
export function AllocationForm({ campaigns, cvrs, lines, remainingCents }: {
  campaigns: Array<{ value: string; text: string }>;
  cvrs: Array<{ value: string; text: string }>;
  lines: AllocationLineOption[];
  remainingCents: number;
}) {
  const t = useTranslations('budget.allocation');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [campaign, setCampaign] = useState('');
  const [cvrId, setCvrId] = useState('');
  const [amount, setAmount] = useState('');
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const existing = lines.find((l) => l.campaign === campaign && l.cvrId === cvrId);

  const submit = () =>
    startTransition(async () => {
      const value = parseMoneyInput(amount);
      if (!campaign || !cvrId || value === null) return setResult('incomplete');
      const r = await saveAllocationAction({ locale, campaign, cvrId, amountEur: value, motive });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setAmount('');
        setMotive('');
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} data-testid="allocation-form" aria-labelledby="allocation-form-title" className="grid max-w-2xl gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="allocation-form-title" className="text-lg font-semibold">{t('formTitle')}</h2>
      <p className="text-muted" data-testid="allocation-remaining">{t('remaining', { amount: formatMoney(remainingCents, locale) })}</p>
      <SelectField id="allocation-campaign" label={t('campaign')} placeholder={t('choose')} value={campaign} options={campaigns} onChange={(e) => { setCampaign(e.target.value); setResult(null); }} />
      <SelectField id="allocation-cvr" label={t('cvr')} placeholder={t('choose')} value={cvrId} options={cvrs} onChange={(e) => { setCvrId(e.target.value); setResult(null); }} />
      {existing ? <p className="text-muted" data-testid="allocation-existing">{t('existing', { amount: formatMoney(existing.cents, locale), revision: existing.revision })}</p> : null}
      <Field
        id="allocation-amount"
        label={t('amount')}
        hint={t('amountHint')}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); setResult(null); }}
      />
      <TextareaField
        id="allocation-motive"
        label={t('motive')}
        hint={t('motiveHint')}
        maxLength={280}
        value={motive}
        onChange={(e) => { setMotive(e.target.value); setResult(null); }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{t('submit')}</Button>
        <div aria-live="polite" data-testid="allocation-result">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
      </div>
    </form>
  );
}

/** Retrait d'une ligne : le motif se saisit dans la ligne, la confirmation reste annulable (D159). */
export function RemoveAllocationButton({ lineId }: { lineId: string }) {
  const t = useTranslations('budget.allocation');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [open, setOpen] = useState(false);
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return <Button type="button" variant="secondary" onClick={() => setOpen(true)} data-testid="allocation-remove">{t('remove')}</Button>;
  return (
    <div className="flex min-w-0 flex-col items-start gap-2" data-testid="allocation-remove-panel">
      <Field id={`remove-${lineId}`} label={t('removeMotive')} type="text" maxLength={280} value={motive} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const r = await removeAllocationAction({ locale, lineId, motive });
            if (r.status === 'ok') { announce(tc('saved'), { undoToken: r.undoToken }); setOpen(false); setMotive(''); setResult(null); } else setResult(r.status === 'refused' ? r.reason : 'invalid');
          })}
        >
          {t('removeConfirm')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => { setOpen(false); setMotive(''); setResult(null); }}>{t('removeCancel')}</Button>
      </div>
      <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
    </div>
  );
}
