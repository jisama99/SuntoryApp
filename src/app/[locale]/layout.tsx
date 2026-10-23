import '@fontsource-variable/inter';
import '../globals.css';
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { DemoBanner } from '@/components/DemoBanner';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { AppShell } from '@/components/AppShell';
import type { NavItem } from '@/components/NavLinks';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { profileDirectory, repository } from '@/data';
import { routing } from '@/i18n/routing';
import { getAccessContext } from '@/lib/session';
import { getSidebarCollapsed } from '@/lib/sidebar';
import { getTheme } from '@/lib/theme';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'app' });
  return { title: t('name'), robots: { index: false, follow: false } };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ctx = await getAccessContext(locale);
  const theme = await getTheme();
  const [menu, profiles] = await Promise.all([repository.getMenu(ctx), profileDirectory.list()]);
  const t = await getTranslations('menu');
  const tApp = await getTranslations('app');
  const tNav = await getTranslations('nav');
  const items: NavItem[] = menu.map((e) => ({ key: e.key, href: e.href, label: t(e.key) }));
  
  return (
    <html lang={locale} data-theme={theme === 'system' ? undefined : theme}>
      <body>
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-full focus:bg-marine focus:px-4 focus:py-2 focus:text-white"
          >
            {tApp('skip')}
          </a>
          <DemoBanner />
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
                <ThemeSwitcher />
                <LocaleSwitcher />
                <ProfileSwitcher profiles={profiles} current={ctx.profileId} />
              </>
            }
          >
            {children}
          </AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
