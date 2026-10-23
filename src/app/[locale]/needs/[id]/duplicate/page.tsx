import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DuplicateForm } from '@/components/DuplicateForm';
import { PageHeader } from '@/components/PageHeader';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { resolvePeriod } from '@/domain/week-rules';
import { keepTogether } from '@/lib/format';
import { loadFormData } from '@/lib/need-form-data';
import { getAccessContext } from '@/lib/session';

export default async function DuplicateNeedPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'needs') || !repository.canWriteNeeds(ctx)) notFound();
  const need = await repository.getNeed(ctx, id);
  if (!need) notFound();
  const t = await getTranslations();
  const data = await loadFormData(ctx);
  const first = need.periods.map(resolvePeriod).find((p) => p.start)?.start ?? null;
  return (
    <>
      <PageHeader title={t('duplicate.title', { code: keepTogether(need.need_code) })} subtitle={t(`role.${ctx.profileId}`)} />
      <DuplicateForm needId={need.id} sourceStart={first} today={data.today} min={data.min} max={data.max} closedWeeks={data.closedWeeks} />
    </>
  );
}
