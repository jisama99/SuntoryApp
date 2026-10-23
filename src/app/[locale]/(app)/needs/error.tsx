'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/States';

/** État d'erreur de la route (règle commune 14) : aucune donnée n'a été modifiée, le bouton relance l'affichage. */
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('states');
  return (
    <ErrorState title={t('error.title')} body={t('error.body')}>
      <Button type="button" onClick={reset}>{t('retry')}</Button>
    </ErrorState>
  );
}
