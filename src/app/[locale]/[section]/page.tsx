import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AlertList } from '@/components/AlertList';
import { Gallery } from '@/components/Gallery';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/States';
import { repository } from '@/data';
import { MENU_KEYS } from '@/domain/types';
import type { Locale, MenuKey } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

export default async function SectionPage({ params }: { params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);

  // L'accès est décidé par le Repository (menu du profil), jamais par l'écran.
  const menu = await repository.getMenu(ctx);
  const key = section as MenuKey;
  if (key === 'home' || !(MENU_KEYS as readonly string[]).includes(section) || !menu.some((e) => e.key === key)) {
    notFound();
  }

  const t = await getTranslations();
  const title = t(`menu.${key}`);

  if (key === 'alerts') {
    const [alerts, zones] = await Promise.all([repository.getAlerts(ctx), repository.getScopeZones(ctx)]);
    return (
      <>
        <PageHeader title={title} subtitle={t(`role.${ctx.profileId}`)} />
        {alerts.length === 0 ? (
          <EmptyState title={t('states.empty.title')} body={t('home.alerts.empty')} />
        ) : (
          <AlertList alerts={alerts} zones={zones} showAudience={ctx.side !== 'client'} />
        )}
      </>
    );
  }

  if (key === 'admin') {
    return (
      <>
        <PageHeader title={t('gallery.title')} subtitle={title} />
        <Gallery />
      </>
    );
  }

  return (
    <>
      <PageHeader title={title} subtitle={t(`role.${ctx.profileId}`)} />
      <EmptyState title={t('placeholder.title')} body={t('placeholder.body')} />
    </>
  );
}
