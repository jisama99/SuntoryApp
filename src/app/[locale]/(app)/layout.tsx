import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import type { NavItem } from '@/components/NavLinks';
import { SkinSwitcher } from '@/components/SkinSwitcher';
import { Shortcuts } from '@/components/Shortcuts';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { UserBadge } from '@/components/UserBadge';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext, getSessionAccount } from '@/lib/session';
import { getSidebarCollapsed } from '@/lib/sidebar';

/** Gabarit de l'application (menu, barre d'outils). La page d'entrée, elle, s'affiche sans menu. */
export default async function AppLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const [menu, account] = await Promise.all([repository.getMenu(ctx), getSessionAccount()]);
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
          <UserBadge
            firstName={account?.first_name ?? null}
            profileId={ctx.profileId}
            username={account?.username ?? ''}
            locale={locale}
          />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
