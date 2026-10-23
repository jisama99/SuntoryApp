import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import type { NavItem } from '@/components/NavLinks';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { SkinSwitcher } from '@/components/SkinSwitcher';
import { Shortcuts } from '@/components/Shortcuts';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { profileDirectory, repository } from '@/data';
import type { Locale } from '@/domain/types';
import { redirect } from '@/i18n/navigation';
import { requireSession } from '@/lib/session';
import { buildAccessContext } from '@/domain/access';
import { SignOutButton } from '@/components/SignOutButton';
import { getSidebarCollapsed } from '@/lib/sidebar';

/** Gabarit de l'application (menu, barre d'outils). La page d'entrée, elle, s'affiche sans menu. */
export default async function AppLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireSession(locale as Locale);
  // Mot de passe temporaire : le changement passe avant tout (D189).
  if (session.account.must_change_password) redirect({ href: '/change-password', locale: locale as Locale });
  const ctx = buildAccessContext(session.profile, locale as Locale, { accountId: session.account.id, impersonated: session.impersonated });
  const [menu, profiles] = await Promise.all([repository.getMenu(ctx), profileDirectory.list()]);
  const { skin } = await repository.getHomeSkin(ctx);
  const t = await getTranslations('menu');
  const tApp = await getTranslations('app');
  const tNav = await getTranslations('nav');
  const items: NavItem[] = menu.map((e) => ({ key: e.key, href: e.href, label: t(e.key) }));

  return (
    <AppShell
      items={items}
      collapsedInitial={await getSidebarCollapsed()}
      canCreate={repository.canWriteNeeds(ctx)}
      labels={{
        brand: tApp('name'), nav: tNav('label'), mobile: tNav('mobile'), more: tNav('more'), moreTitle: tNav('moreTitle'),
        create: tNav('create'), collapse: tNav('collapse'), expand: tNav('expand'),
      }}
      toolbar={
        <>
          <Shortcuts items={items} canCreate={repository.canWriteNeeds(ctx)} createHref="/needs/new" />
          <ThemeSwitcher />
          <SkinSwitcher current={skin} locale={locale} />
          <LocaleSwitcher />
          {session.account.profile === 'provider_admin' ? <ProfileSwitcher profiles={profiles} current={ctx.profileId} /> : null}
          <SignOutButton locale={locale} />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
