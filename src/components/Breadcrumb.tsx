import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Icon } from './Icon';
import { UI_ICONS } from './icons';

export interface Crumb {
  label: string;
  href?: string;
}

/** Fil d'Ariane (règle commune 14) : la page courante est le dernier élément, sans lien. L'accueil est ajouté en tête. */
export async function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = await getTranslations();
  const all: Crumb[] = [{ label: t('menu.home'), href: '/' }, ...items];
  return (
    <nav aria-label={t('nav.breadcrumb')} className="mb-3 print:hidden">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="inline-flex min-h-11 items-center rounded-full px-2 font-semibold text-link hover:bg-sel">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="px-2 font-semibold text-ink">
                  {c.label}
                </span>
              )}
              {last ? null : <Icon icon={UI_ICONS.chevronRight} size="sm" className="text-muted" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
