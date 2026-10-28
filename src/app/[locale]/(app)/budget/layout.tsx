import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/**
 * Accès à la section Budget, décidé par le menu du profil (D118) et par le droit de lecture du budget. Dans un layout, au-dessus des
 * états de chargement, pour qu'une entrée absente du menu réponde 404 avant tout affichage progressif (règle commune 14).
 */
export default async function BudgetLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'budget') || !repository.canReadBudget(ctx)) notFound();
  return children;
}
