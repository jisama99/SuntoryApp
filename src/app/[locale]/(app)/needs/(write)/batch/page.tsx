import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BatchTable } from '@/components/BatchTable';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageHeader } from '@/components/PageHeader';
import { repository } from '@/data';
import { normalizeToken } from '@/domain/batch-paste';
import { DISPOSITIFS } from '@/domain/types';
import type { Dispositif, Locale } from '@/domain/types';
import { loadFormData } from '@/lib/need-form-data';
import { getAccessContext } from '@/lib/session';

/** Saisie en lot (F-20.2) : RS et agence. L'accès est décidé par le Repository, pas par l'écran. */
export default async function BatchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'needs') || !repository.canWriteNeeds(ctx)) notFound();
  const t = await getTranslations();
  const [data, draft] = await Promise.all([loadFormData(ctx), repository.getBatchDraft(ctx)]);
  const sectors = data.sectors;
  // Libellés acceptés au collage : code, libellé français et libellé anglais de chaque dispositif.
  const fr = await getTranslations({ locale: 'fr', namespace: 'dispositif' });
  const en = await getTranslations({ locale: 'en', namespace: 'dispositif' });
  const dispositifNames: Record<string, Dispositif> = {};
  for (const d of DISPOSITIFS) for (const name of [d, fr(d), en(d)]) dispositifNames[normalizeToken(name)] = d;
  return (
    <>
      <Breadcrumb items={[{ label: t('menu.needs'), href: '/needs' }, { label: t('batch.title') }]} />
      <PageHeader title={t('batch.title')} subtitle={t(`role.${ctx.profileId}`)} />
      <BatchTable
        initialRows={draft?.rows ?? []}
        hadDraft={draft !== null}
        fixedSectorId={sectors.length === 1 ? (sectors[0]?.id ?? null) : null}
        sectors={sectors}
        stores={data.stores}
        campaigns={data.campaigns}
        dispositifNames={dispositifNames}
        today={data.today}
        min={data.min}
        max={data.max}
        closedWeeks={data.closedWeeks}
        daysAllowed={data.daysAllowed}
        daysByDispositif={data.daysByDispositif}
        deadline={data.deadline}
      />
    </>
  );
}
