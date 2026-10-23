import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Écrans de saisie : réservés aux profils qui peuvent saisir. Contrôle côté données, avant tout affichage progressif. */
export default async function WriteLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!repository.canWriteNeeds(await getAccessContext(locale as Locale))) notFound();
  return children;
}
