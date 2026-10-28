import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/**
 * Accès à une section du budget, décidé par la couche de données (enveloppe nationale ou coûts). Appelé depuis un layout, au-dessus
 * des états de chargement : une section interdite répond 404 avant tout affichage progressif (règle commune 14).
 */
export async function requireBudgetSection(locale: string, section: 'envelope' | 'costs'): Promise<void> {
  setRequestLocale(locale);
  const view = await repository.getBudget(await getAccessContext(locale as Locale));
  if (section === 'envelope' ? !view.envelopeVisible : !view.costsVisible) notFound();
}
