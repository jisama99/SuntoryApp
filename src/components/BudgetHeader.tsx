import { getTranslations } from 'next-intl/server';
import type { BudgetView } from '@/data/repository';
import { BUDGET_TABS, BudgetTabs } from './BudgetTabs';
import type { BudgetTab } from './BudgetTabs';
import { Breadcrumb } from './Breadcrumb';
import { PageHeader } from './PageHeader';

/** Sections proposées au profil, selon ce que la couche de données lui ouvre (enveloppe nationale, coûts). */
export function budgetTabsOf(view: Pick<BudgetView, 'envelopeVisible' | 'costsVisible'>): BudgetTab[] {
  return BUDGET_TABS.filter((tab) => (tab === 'envelope' ? view.envelopeVisible : tab === 'allocation' || tab === 'needs' ? view.costsVisible : true));
}

/** En-tête commun des écrans du budget : fil d'Ariane, titre, rappel des montants fictifs, sections. */
export async function BudgetHeader({ current, tabs, subtitle }: { current: BudgetTab; tabs: readonly BudgetTab[]; subtitle: string }) {
  const t = await getTranslations('budget');
  const tm = await getTranslations('menu');
  const title = current === 'situation' ? t('title') : t(`${current}.title`);
  return (
    <>
      <Breadcrumb items={current === 'situation' ? [{ label: tm('budget') }] : [{ label: tm('budget'), href: '/budget' }, { label: title }]} />
      <PageHeader title={title} subtitle={subtitle} />
      <p className="mb-6 max-w-prose text-sm text-muted" data-testid="budget-note">{t('note')}</p>
      <BudgetTabs current={current} tabs={tabs} />
    </>
  );
}
