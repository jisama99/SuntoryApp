import { getTranslations } from 'next-intl/server';
import { LoadingState } from '@/components/States';

/** État de chargement des écrans du circuit besoin, proposition, décision (règle commune 14). */
export default async function Loading() {
  const t = await getTranslations('states');
  return <LoadingState title={t('loading.title')} body={t('loading.body')} />;
}
