import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/States';
import { PageHeader } from '@/components/PageHeader';

export default function NotFound() {
  const t = useTranslations('states');
  return (
    <>
      <PageHeader title="404" />
      <EmptyState title={t('empty.title')} body={t('empty.body')} />
    </>
  );
}
