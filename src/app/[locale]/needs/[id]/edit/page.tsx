import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { NeedForm } from '@/components/NeedForm';
import { PageHeader } from '@/components/PageHeader';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { keepTogether } from '@/lib/format';
import { loadFormData } from '@/lib/need-form-data';
import type { NeedFormValue } from '@/lib/need-form-value';
import { getAccessContext } from '@/lib/session';

/** Complète un brouillon. Un besoin soumis ne se modifie pas ici : les demandes de changement relèvent du lot A3. */
export default async function EditNeedPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'needs') || !repository.canWriteNeeds(ctx)) notFound();
  const need = await repository.getNeed(ctx, id);
  if (!need || need.need_state !== 'draft') notFound();
  const t = await getTranslations();
  const data = await loadFormData(ctx);
  const initial: NeedFormValue = {
    dispositif: need.dispositif ?? '',
    campaign_code: need.campaign_code ?? '',
    sector_id: need.sector_id,
    position_label: need.position_label ?? '',
    weekly_hours: need.weekly_hours === null ? '' : String(need.weekly_hours),
    priority: need.priority === null ? '' : String(need.priority),
    periods: need.periods.length > 0 ? need.periods.map(({ start_date, end_date, start_week, end_week }) => ({ start_date, end_date, start_week, end_week })) : [{ start_date: null, end_date: null, start_week: null, end_week: null }],
    days: need.days,
    hours_slot: need.hours_slot ?? '',
    store_codes: need.store_codes,
    client_comment: need.client_comment ?? '',
  };
  return (
    <>
      <PageHeader title={t('needs.complete', { code: keepTogether(need.need_code) })} subtitle={t(`role.${ctx.profileId}`)} />
      <NeedForm mode="edit" needId={need.id} initial={initial} {...data} />
    </>
  );
}
