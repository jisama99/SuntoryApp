'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { decideAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { SelectField } from '@/components/SelectField';
import { StatusTag } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import type { Locale } from '@/domain/types';

/** Décision de la cliente sur une version de proposition : valider, demander une révision, refuser (motif obligatoire). */
export function DecisionForm({ proposalId, version }: { proposalId: string; version: number }) {
  const t = useTranslations('pipeline.decide');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [outcome, setOutcome] = useState('');
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      if (!outcome) {
        setResult('outcome_required');
        return;
      }
      if (outcome !== 'approved' && motive.trim() === '') {
        setResult('motive_required');
        return;
      }
      const r = await decideAction({ locale, proposalId, outcome, motive });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setMotive('');
        setOutcome('');
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} data-testid="decision-form" className="grid max-w-xl gap-4 rounded-ctl bg-alt p-4">
      <h3 className="font-semibold">{t('title', { n: version })}</h3>
      <SelectField
        id={`decide-outcome-${proposalId}`}
        label={t('outcome')}
        placeholder={t('choose')}
        value={outcome}
        options={(['approved', 'revision', 'refused'] as const).map((o) => ({ value: o, text: t(`outcomes.${o}`) }))}
        onChange={(e) => { setOutcome(e.target.value); setResult(null); }}
      />
      <TextareaField id={`decide-motive-${proposalId}`} label={t('motive')} hint={t('motiveHint')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{t('submit')}</Button>
        <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
      </div>
    </form>
  );
}
