import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { HomeSkinDefault } from '@/components/HomeSkinDefault';
import { PageHeader } from '@/components/PageHeader';
import { repository } from '@/data';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Paramètres : accès décidé par le menu du profil (D118). L'agence administration modifie, le prestataire consulte. */
export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'settings')) notFound();
  const t = await getTranslations();
  const skinDefault = await repository.getHomeSkinDefault(ctx);
  const cards = [
    { href: '/settings/deadlines', title: t('titles.deadlineSettings'), body: t('settings.deadlines.body') },
    { href: '/settings/dispositifs', title: t('titles.schemeSettings'), body: t('settings.dispositifs.body') },
    { href: '/settings/delegations', title: t('titles.delegations'), body: t('delegations.body') },
    ...(repository.canManageAccounts(ctx) ? [{ href: '/settings/accounts', title: t('titles.manageAccess'), body: t('accounts.body') }] : []),
  ] as const;
  return (
    <>
      <Breadcrumb items={[{ label: t('menu.settings') }]} />
      <PageHeader title={t('menu.settings')} subtitle={t(`role.${ctx.profileId}`)} />
      {repository.canManageSettings(ctx) ? null : <p className="mb-6 text-muted">{t('settings.readOnly')}</p>}
      {skinDefault ? <HomeSkinDefault current={skinDefault} /> : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href} className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <p className="text-muted">{c.body}</p>
            <Link href={c.href} className="inline-flex min-h-11 w-fit items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-fill hover:bg-primary-hover">
              {t('settings.open')}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
