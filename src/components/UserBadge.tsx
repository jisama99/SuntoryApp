import { getTranslations } from 'next-intl/server';
import { logoutAction } from '@/app/actions';
import type { ProfileId } from '@/domain/types';
import { Icon } from './Icon';
import { UI_ICONS } from './icons';

interface Props {
  firstName: string | null;
  profileId: ProfileId;
  username: string;
  locale: string;
  /** Seul provider_admin voit aussi le sélecteur de profil simulé (à passer en enfant si nécessaire). */
  children?: React.ReactNode;
}

/** Affiche le prénom et le profil de l'utilisateur connecté, et le bouton de déconnexion. */
export async function UserBadge({ firstName, profileId, locale, children }: Props) {
  const t = await getTranslations();
  const label = firstName ?? t(`profile.${profileId}`);
  const signOut = t('auth.sign_out');

  return (
    <details className="relative">
      <summary
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-alt px-3 text-sm font-semibold marker:hidden"
        aria-label={`${label} - ${t(`profile.${profileId}`)}`}
      >
        <Icon icon={UI_ICONS.profile} size="sm" />
        <span className="hidden sm:inline">{label}</span>
        <Icon icon={UI_ICONS.chevronDown} size="sm" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-card bg-surface p-3 shadow-card">
        <p className="mb-1 text-xs font-semibold text-title">{label}</p>
        <p className="mb-3 text-xs text-muted">{t(`profile.${profileId}`)}</p>
        {children}
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-2 rounded-ctl px-3 text-left text-sm font-medium hover:bg-alt text-risk"
          >
            <Icon icon={UI_ICONS.logout} size="sm" />
            {signOut}
          </button>
        </form>
      </div>
    </details>
  );
}
