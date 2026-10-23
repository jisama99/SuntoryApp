'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { withdrawProposalAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { StatusTag } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import type { Locale } from '@/domain/types';

/** Retrait d'une proposition envoyée : motif obligatoire, la décision qui s'y rattache est invalidée et reste au dossier. */
export function WithdrawProposalForm({ proposalId, hasDecision }: { proposalId: string; hasDecision: boolean }) {
  const t = useTranslations('pipeline.withdraw');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [open, setOpen] = useState(false);
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      if (motive.trim() === '') {
        setResult('motive_required');
        return;
      }
      const r = await withdrawProposalAction({ locale, proposalId, motive });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setOpen(false);
        setMotive('');
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  if (!open) {
    return <Button type="button" variant="secondary" onClick={() => setOpen(true)}>{t('open')}</Button>;
  }
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid max-w-xl gap-3 rounded-ctl bg-alt p-4">
      {hasDecision ? <p className="text-muted">{t('invalidates')}</p> : null}
      <TextareaField id={`withdraw-motive-${proposalId}`} label={t('motive')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{t('submit')}</Button>
        <Button type="button" variant="ghost" onClick={() => { setOpen(false); setResult(null); }}>{t('cancel')}</Button>
        <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
      </div>
    </form>
  );
}
