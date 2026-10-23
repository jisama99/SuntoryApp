'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { decideOutboxAction } from '@/app/[locale]/settings/actions';
import type { Locale } from '@/domain/types';
import { Button } from './Button';

/** Validation ou écart d'un courriel préparé. Aucun envoi : la décision ne fait que marquer le message (D94). */
export function OutboxButtons({ id }: { id: string }) {
  const t = useTranslations('outbox');
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const decide = (decision: 'validated' | 'discarded') => startTransition(async () => { await decideOutboxAction({ locale, id, decision }); });
  return (
    <span className="flex flex-wrap gap-1">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => decide('validated')}>{t('validate')}</Button>
      <Button type="button" variant="ghost" disabled={pending} onClick={() => decide('discarded')}>{t('discard')}</Button>
    </span>
  );
}
