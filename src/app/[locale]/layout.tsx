import '@fontsource-variable/inter';
import '../globals.css';
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ConfirmationProvider } from '@/components/Confirmation';
import { DemoBanner } from '@/components/DemoBanner';
import { routing } from '@/i18n/routing';
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
  const theme = await getTheme();
  const tApp = await getTranslations('app');

  return (
    <html lang={locale} data-theme={theme === 'system' ? undefined : theme}>
      <body>
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-full focus:bg-marine focus:px-4 focus:py-2 focus:text-on-fill"
          >
            {tApp('skip')}
          </a>
          <DemoBanner />
          <ConfirmationProvider>{children}</ConfirmationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
