import { getTranslations, setRequestLocale } from 'next-intl/server';
import { accountRepository } from '@/data';
import type { Locale, ProfileId } from '@/domain/types';
import { getAccessContext } from '@/lib/session';
import { AccountsClient } from './AccountsClient';
import type { AccountsLabels } from './AccountsClient';

/** Gestion des comptes utilisateurs - reservee a agency_admin et provider_admin (D189). */
export default async function AccountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const t = await getTranslations();
  const accounts = await accountRepository.listAccounts(ctx);

  const labels: AccountsLabels = {
    create: t('admin.accounts.create'),
    username: t('admin.accounts.username'),
    profile: t('admin.accounts.profile'),
    firstName: t('admin.accounts.first_name'),
    scope: t('admin.accounts.scope'),
    scopeAll: t('admin.accounts.scope_all'),
    status: t('admin.accounts.status'),
    statusActive: t('admin.accounts.status_active'),
    statusInactive: t('admin.accounts.status_inactive'),
    statusTemp: t('admin.accounts.status_temp'),
    deactivate: t('admin.accounts.deactivate'),
    resetPassword: t('admin.accounts.reset_password'),
    tempPasswordShown: t('admin.accounts.temp_password_shown'),
    confirmDeactivate: t('admin.accounts.confirm_deactivate'),
    confirmReset: t('admin.accounts.confirm_reset'),
    cancel: t('admin.accounts.cancel'),
    confirm: t('admin.accounts.confirm'),
    empty: t('admin.accounts.empty'),
    errorInvalid: t('admin.accounts.error.invalid'),
    errorDuplicate: t('admin.accounts.error.duplicate'),
    errorForbidden: t('admin.accounts.error.forbidden'),
    errorNotFound: t('admin.accounts.error.not_found'),
    loading: t('states.loading'),
  };

  const profileOptions: { value: ProfileId; label: string }[] = [
    { value: 'direction_client', label: t('profile.direction_client') },
    { value: 'cvr_client', label: t('profile.cvr_client') },
    { value: 'dr_client', label: t('profile.dr_client') },
    { value: 'agency_operator', label: t('profile.agency_operator') },
    { value: 'agency_admin', label: t('profile.agency_admin') },
    { value: 'rs', label: t('profile.rs') },
  ];

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-xl font-extrabold tracking-tight text-title">
        {t('admin.accounts.title')}
      </h1>
      <AccountsClient
        accounts={accounts as Parameters<typeof AccountsClient>[0]['accounts']}
        locale={locale}
        labels={labels}
        profileOptions={profileOptions}
      />
    </main>
  );
}
