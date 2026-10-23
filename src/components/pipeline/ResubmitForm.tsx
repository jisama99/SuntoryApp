'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { resubmitNeedAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { StatusTag } from '@/components/StatusTag';
import type { Locale } from '@/domain/types';

/** Renvoi d'un besoin refusé : un nouveau tour de validation s'ouvre, l'historique des tours précédents reste au dossier. */
export function ResubmitForm({ needId }: { needId: string }) {
  const t = useTranslations('pipeline.resubmit');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submit = () =>
    startTransition(async () => {
      const r = await resubmitNeedAction({ locale, needId });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'not_found');
      }
    });
  return (
    <section aria-labelledby="resubmit-title" data-testid="resubmit-form" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="resubmit-title" className="text-lg font-semibold">{t('title')}</h2>
      <p className="max-w-prose text-muted">{t('help')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={pending} onClick={submit}>{t('submit')}</Button>
        <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
      </div>
    </section>
  );
}
