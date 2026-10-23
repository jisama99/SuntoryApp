import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrandLogo, BrandMark } from '@/components/BrandLogo';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Visual } from '@/components/Visual';
import type { Locale } from '@/domain/types';
import { redirect } from '@/i18n/navigation';
import { safeReturnTo } from '@/lib/return-to';
import { requireSession } from '@/lib/session';

/** Changement du mot de passe temporaire à la première connexion (D189). Sans mot de passe temporaire, retour à l'accueil. */
export default async function ChangePasswordPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const raw = (await searchParams).next;
  const next = safeReturnTo(Array.isArray(raw) ? raw[0] : raw);
  setRequestLocale(locale);
  const session = await requireSession(locale as Locale);
  if (!session.account.must_change_password) redirect({ href: '/', locale: locale as Locale });
  const t = await getTranslations('changePassword');
  return (
    <main id="main" tabIndex={-1} className="relative isolate flex min-h-svh flex-col sm:items-center sm:justify-center">
      <div className="relative h-72 sm:absolute sm:inset-0 sm:-z-10 sm:h-auto">
        <Visual id="forest" priority className="size-full object-cover" />
        <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-3">
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </div>
      <section
        aria-labelledby="change-title"
        className="relative -mt-8 flex flex-1 flex-col gap-5 rounded-t-card bg-surface p-6 pb-10 veil-sm sm:mt-0 sm:w-full sm:max-w-md sm:flex-none sm:rounded-card sm:p-8"
      >
        <BrandLogo brand="suntory" className="h-10 self-start" />
        <h1 id="change-title" className="text-xl font-extrabold tracking-tight text-title">{t('title')}</h1>
        <ChangePasswordForm next={next} />
        <BrandMark className="mt-2 self-start" />
      </section>
    </main>
  );
}
