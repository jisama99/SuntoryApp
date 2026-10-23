'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { qualifyNeedAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { SelectField } from '@/components/SelectField';
import { StatusTag } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import type { Locale } from '@/domain/types';

/** Qualification du besoin par l'agence (F-30.4) : prise en charge, demande de précision, rejet motivé. */
export function QualifyForm({ needId }: { needId: string }) {
  const t = useTranslations('pipeline.qualify');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [outcome, setOutcome] = useState('take');
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      if (outcome !== 'take' && motive.trim() === '') {
        setResult('motive_required');
        return;
      }
      const r = await qualifyNeedAction({ locale, needId, outcome, motive });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setMotive('');
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <section aria-labelledby="qualify-title" data-testid="qualify-form" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="qualify-title" className="text-lg font-semibold">{t('title')}</h2>
      <p className="max-w-prose text-muted">{t('help')}</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid max-w-xl gap-4">
        <SelectField
          id="qualify-outcome"
          label={t('outcome')}
          placeholder={t('choose')}
          value={outcome}
          options={(['take', 'clarify', 'reject'] as const).map((o) => ({ value: o, text: t(`outcomes.${o}`) }))}
          onChange={(e) => { setOutcome(e.target.value); setResult(null); }}
        />
        {outcome !== 'take' ? (
          <TextareaField id="qualify-motive" label={t('motive')} hint={t('motiveHint')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || outcome === ''}>{t('submit')}</Button>
          <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
        </div>
      </form>
    </section>
  );
}
