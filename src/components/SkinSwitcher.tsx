import { getTranslations } from 'next-intl/server';
import { setHomeSkinAction } from '@/app/actions';
import { HOME_SKINS } from '@/domain/types';
import type { HomeSkin } from '@/domain/types';

/** Choix du skin d'accueil par l'utilisateur, près du thème (D161). Le choix est gardé pour le profil simulé. */
export async function SkinSwitcher({ current, locale }: { current: HomeSkin; locale: string }) {
  const t = await getTranslations('skin');
  return (
    <form action={setHomeSkinAction} role="group" aria-label={t('label')} className="inline-flex rounded-full bg-alt p-1">
      <input type="hidden" name="locale" value={locale} />
      {HOME_SKINS.map((skin) => (
        <button
          key={skin}
          type="submit"
          name="skin"
          value={skin}
          aria-pressed={skin === current}
          className={`inline-flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${skin === current ? 'bg-marine text-on-fill' : 'text-ink hover:bg-alt'}`}
        >
          {t(skin)}
        </button>
      ))}
    </form>
  );
}
