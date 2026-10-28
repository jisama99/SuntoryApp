import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export const BUDGET_TABS = ['situation', 'envelope', 'allocation', 'needs', 'journal'] as const;
export type BudgetTab = (typeof BUDGET_TABS)[number];

const HREF: Record<BudgetTab, string> = {
  situation: '/budget', envelope: '/budget/envelope', allocation: '/budget/allocation', needs: '/budget/needs', journal: '/budget/journal',
};

/**
 * Sections du budget : chaque onglet est une vraie page (règle commune 14). Les onglets proposés viennent des droits du profil,
 * calculés par l'appelant à partir de la couche de données ; une page refuse de toute façon l'accès qui ne lui est pas ouvert.
 */
export async function BudgetTabs({ current, tabs }: { current: BudgetTab; tabs: readonly BudgetTab[] }) {
  const t = await getTranslations('budget.tabs');
  return (
    <nav aria-label={t('label')} className="mb-6 flex flex-wrap gap-2 print:hidden" data-testid="budget-tabs">
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={HREF[tab]}
          aria-current={current === tab ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${current === tab ? 'bg-primary text-on-fill' : 'bg-alt text-ink hover:bg-sel'}`}
        >
          {t(tab)}
        </Link>
      ))}
    </nav>
  );
}
