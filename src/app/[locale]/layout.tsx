import '@fontsource-variable/inter';
import '../globals.css';
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { DemoBanner } from '@/components/DemoBanner';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { NavLinks } from '@/components/NavLinks';
import type { NavItem } from '@/components/NavLinks';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { UI_ICONS } from '@/components/icons';
import { profileDirectory, repository } from '@/data';
import { routing } from '@/i18n/routing';
import { getAccessContext } from '@/lib/session';
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
  const MenuIcon = UI_ICONS.menu;

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
          <div className="min-h-[calc(100vh-40px)] lg:grid lg:grid-cols-[252px_1fr]">
            <aside className="hidden border-r border-line bg-surface p-4 lg:block">
              <p className="mb-4 px-3 text-lg font-extrabold tracking-tight text-title">{tApp('name')}</p>
              <NavLinks items={items} label={tNav('label')} />
            </aside>
            <div className="min-w-0">
              <details className="border-b border-line bg-surface lg:hidden">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold marker:hidden">
                  <MenuIcon aria-hidden="true" className="size-5" strokeWidth={1.7} />
                  {tNav('open')}
                </summary>
                <div className="p-3">
                  <NavLinks items={items} label={tNav('label')} />
                </div>
              </details>
              <div className="flex flex-wrap items-center justify-end gap-3 px-4 pt-4 lg:px-8">
                <ThemeSwitcher />
                <LocaleSwitcher />
                <ProfileSwitcher profiles={profiles} current={ctx.profileId} />
              </div>
              <main id="main" tabIndex={-1} className="px-4 py-6 lg:px-8">
                {children}
              </main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
