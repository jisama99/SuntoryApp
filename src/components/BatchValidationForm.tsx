'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { validateBatchAction } from '@/app/[locale]/(app)/proposals/actions';
import type { Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { StatusTag } from './StatusTag';
import { TextareaField } from './TextareaField';

export interface ValidationBatchItem {
  needId: string;
  needCode: string;
  sector: string;
  due: string | null;
  overdue: boolean;
}

/**
 * Validation en lot avec motif commun (F-30.6) pour le CVR, ou l'arbitrage en lot pour le DR : chaque besoin est contrôlé seul
 * par la couche de données, un refus n'arrête pas les autres, une seule annulation défait tout le lot.
 */
export function BatchValidationForm({ items }: { items: ValidationBatchItem[] }) {
  const t = useTranslations('pipeline.batchValidate');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [picked, setPicked] = useState<string[]>([]);
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<{ done: number; refused: number; reasons: string[] } | 'invalid' | 'motive' | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (outcome: 'validated' | 'refused') =>
    startTransition(async () => {
      if (picked.length === 0) return setResult('invalid');
      if (outcome === 'refused' && motive.trim() === '') return setResult('motive');
      const r = await validateBatchAction({ locale, needIds: picked, outcome, motive });
      if (r.status !== 'ok') return setResult('invalid');
      setResult({ done: r.done, refused: r.refused, reasons: r.reasons });
      if (r.done > 0) {
        announce(tc('saved'), { undoToken: r.undoToken, onUndo: () => setResult(null) });
        setPicked([]);
        setMotive('');
      }
    });

  return (
    <section aria-labelledby="batch-validate-title" data-testid="batch-validation" className="mb-8 flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="batch-validate-title" className="text-lg font-semibold">{t('title')}</h2>
      <p className="max-w-prose text-muted">{t('help')}</p>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{t('legend')}</legend>
        <button
          type="button"
          onClick={() => setPicked(picked.length === items.length ? [] : items.map((i) => i.needId))}
          className="inline-flex min-h-11 w-fit items-center rounded-full px-4 text-sm font-semibold text-link hover:bg-sel"
        >
          {picked.length === items.length ? t('none') : t('all')}
        </button>
        {items.map((i) => {
          const checked = picked.includes(i.needId);
          return (
            <label key={i.needId} className={`flex min-h-11 cursor-pointer flex-wrap items-center gap-3 rounded-ctl px-4 py-2 ${checked ? 'bg-sel' : 'bg-alt'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => { setPicked(e.target.checked ? [...picked, i.needId] : picked.filter((x) => x !== i.needId)); setResult(null); }}
                className="size-5"
              />
              <span className="font-mono text-sm font-semibold">{i.needCode}</span>
              <span className="text-muted">{i.sector}</span>
              {i.due ? <span className="text-sm text-muted">{t('due', { date: formatDate(i.due, locale) })}</span> : null}
              {i.overdue ? <StatusTag tone="risk">{t('overdue')}</StatusTag> : null}
            </label>
          );
        })}
      </fieldset>
      <TextareaField id="batch-review-motive" label={t('motive')} hint={t('motiveHint')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={pending} onClick={() => submit('validated')}>{t('approve')}</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => submit('refused')}>{t('refuse')}</Button>
      </div>
      <div aria-live="polite" data-testid="batch-validation-result" className="flex flex-col gap-2">
        {result === 'invalid' ? <StatusTag tone="risk">{t('nothingPicked')}</StatusTag> : null}
        {result === 'motive' ? <StatusTag tone="risk">{t('motiveRequired')}</StatusTag> : null}
        {result && typeof result === 'object' ? (
          <>
            <StatusTag tone={result.done > 0 ? 'ok' : 'attention'}>{t('summary', { done: result.done, refused: result.refused })}</StatusTag>
            {result.reasons.map((r) => <span key={r} className="text-sm text-muted">{t(`reason.${r}`)}</span>)}
          </>
        ) : null}
      </div>
    </section>
  );
}
