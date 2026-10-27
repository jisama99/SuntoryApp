import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Délégations et suppléants (F-30.3) : écran de Paramètres, donc réservé aux profils qui ont cette entrée de menu (D118). */
export default async function DelegationsLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const menu = await repository.getMenu(await getAccessContext(locale as Locale));
  if (!menu.some((e) => e.key === 'settings')) notFound();
  return children;
}
