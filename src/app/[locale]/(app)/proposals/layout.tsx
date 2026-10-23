import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/**
 * Accès à la section Propositions et décisions, décidé par le menu du profil (D118). Dans un layout, au-dessus des états de
 * chargement, pour qu'une entrée absente du menu réponde 404 avant tout affichage progressif (règle commune 14).
 */
export default async function ProposalsLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const menu = await repository.getMenu(await getAccessContext(locale as Locale));
  if (!menu.some((e) => e.key === 'proposals')) notFound();
  return children;
}
