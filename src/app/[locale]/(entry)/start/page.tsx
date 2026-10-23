import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BrandLogo, BrandMark } from '@/components/BrandLogo';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Visual } from '@/components/Visual';
import { LoginForm } from './LoginForm';
import type { LoginFormLabels } from './LoginForm';

/**
 * Écran de connexion (D183, D188). Remplace le choix de profil simulé.
 * Aucune connexion ne part avant la soumission explicite du formulaire.
 */
export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const next = typeof sp.next === 'string' ? sp.next : undefined;
  setRequestLocale(locale);
  const t = await getTranslations();

  const labels: LoginFormLabels = {
    username: t('auth.username'),
    password: t('auth.password'),
    submit: t('auth.submit'),
    loading: t('states.loading'),
    error: t('auth.error'),
    locked: t('auth.locked'),
    tempPasswordTitle: t('auth.temp_password_title'),
    tempPasswordHint: t('auth.temp_password_hint'),
    newPassword: t('auth.new_password'),
    confirmPassword: t('auth.confirm_password'),
    savePassword: t('auth.save_password'),
    changeError: t('auth.change_password.invalid'),
  };

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
        aria-labelledby="login-title"
        className="relative -mt-8 flex flex-1 flex-col gap-5 rounded-t-card bg-surface p-6 pb-10 sm:mt-0 sm:w-full sm:max-w-md sm:flex-none sm:rounded-card sm:p-8 veil-sm"
      >
        <BrandLogo brand="suntory" className="h-10 self-start" />
        <div>
          <h1 id="login-title" className="text-xl font-extrabold tracking-tight text-title">
            {t('auth.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-strong">{t('banner.note')}</p>
        </div>
        <LoginForm labels={labels} locale={locale} next={next} />
        <BrandMark className="mt-2 self-start" />
      </section>
    </main>
  );
}
