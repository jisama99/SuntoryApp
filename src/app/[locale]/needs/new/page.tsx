import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NeedForm } from '@/components/NeedForm';
import { PageHeader } from '@/components/PageHeader';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { loadFormData } from '@/lib/need-form-data';
import { emptyNeedForm } from '@/lib/need-form-value';
import { getAccessContext } from '@/lib/session';

export default async function NewNeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'needs') || !repository.canWriteNeeds(ctx)) notFound();
  const t = await getTranslations();
  const data = await loadFormData(ctx);
  return (
    <>
      <PageHeader title={t('needs.new')} subtitle={t(`role.${ctx.profileId}`)} />
      <NeedForm mode="new" initial={emptyNeedForm(data.sectors.length === 1 ? (data.sectors[0]?.id ?? '') : '')} {...data} />
    </>
  );
}
