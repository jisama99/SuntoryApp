import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrandLogo, BrandMark } from '@/components/BrandLogo';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { LoginForm } from '@/components/LoginForm';
import { Visual } from '@/components/Visual';
import { redirect as nextRedirect } from 'next/navigation';
import { safeReturnTo } from '@/lib/return-to';
import { getSession } from '@/lib/session';

/**
 * Écran de connexion (D160, D188) sur le visuel de la forêt : identifiant et mot de passe fictifs, aucun envoi avant le clic.
 * Mobile : l'image en haut, le choix dans une feuille qui chevauche la photo. Bureau : un panneau voilé sur l'image.
 */
export default async function StartPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const raw = (await searchParams).next;
  const next = safeReturnTo(Array.isArray(raw) ? raw[0] : raw);
  setRequestLocale(locale);
  if (await getSession()) nextRedirect(next ?? `/${locale}`);
  const t = await getTranslations();
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
        aria-labelledby="start-title"
        className="relative -mt-8 flex flex-1 flex-col gap-5 rounded-t-card bg-surface p-6 pb-10 sm:mt-0 sm:w-full sm:max-w-md sm:flex-none sm:rounded-card sm:p-8 veil-sm"
      >
        <BrandLogo brand="suntory" className="h-10 self-start" />
        <p className="font-semibold text-muted-strong">{t('app.name')}</p>
        <h1 id="start-title" className="text-xl font-extrabold tracking-tight text-title">{t('titles.signIn')}</h1>
        <LoginForm next={next} />
        <BrandMark className="mt-2 self-start" />
      </section>
    </main>
  );
}
