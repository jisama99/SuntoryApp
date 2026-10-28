import type { ReactNode } from 'react';
import { requireBudgetSection } from '@/lib/budget-guard';

/** Section réservée aux profils que la couche de données y autorise : sinon 404, avant tout affichage progressif. */
export default async function BudgetSectionLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireBudgetSection(locale, 'costs');
  return children;
}
