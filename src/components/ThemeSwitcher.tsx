import { getTranslations } from 'next-intl/server';
import { Icon } from './Icon';
import { setTheme } from '@/app/actions';
import { getTheme, THEMES } from '@/lib/theme';
import type { Theme } from '@/lib/theme';
import { UI_ICONS } from './icons';

const ICONS = { system: UI_ICONS.themeSystem, light: UI_ICONS.themeLight, dark: UI_ICONS.themeDark } satisfies Record<Theme, unknown>;

/** Choix d'affichage Système, Clair ou Sombre, mémorisé dans un cookie et appliqué côté serveur (sans flash). */
export async function ThemeSwitcher() {
  const t = await getTranslations('theme');
  const current = await getTheme();
  return (
    <form action={setTheme} role="group" aria-label={t('label')} className="inline-flex rounded-full bg-alt p-1">
      {THEMES.map((theme) => {
        const Glyph = ICONS[theme];
        const active = theme === current;
        return (
          <button
            key={theme}
            type="submit"
            name="theme"
            value={theme}
            aria-pressed={active}
            aria-label={t(theme)}
            title={t(theme)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full ${active ? 'bg-marine text-on-fill' : 'text-ink hover:bg-alt'}`}
          >
            <Icon icon={Glyph} size="sm" />
          </button>
        );
      })}
    </form>
  );
}
