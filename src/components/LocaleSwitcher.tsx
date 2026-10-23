'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const t = useTranslations('locale');
  const current = useLocale();
  const pathname = usePathname();
  return (
    <div role="group" aria-label={t('label')} className="inline-flex rounded-full border border-line bg-surface p-0.5">
      {routing.locales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          lang={loc}
          hrefLang={loc}
          aria-current={loc === current ? 'true' : undefined}
          className={`inline-flex min-h-10 min-w-12 items-center justify-center rounded-full px-3 text-sm font-semibold ${
            loc === current ? 'bg-marine text-white' : 'text-ink hover:bg-alt'
          }`}
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
